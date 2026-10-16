// Renders the pixel-art tomato sprite into every favicon/app icon in public/.
// Usage: node scripts/generate-icons.js
const fs = require("fs")
const path = require("path")
const zlib = require("zlib")
const ts = require("typescript")

const root = path.join(__dirname, "..")

// Load the sprite data straight from the app source so icons and UI never drift apart
const loadSprites = () => {
  const source = fs.readFileSync(path.join(root, "src/components/pixel/sprites.ts"), "utf8")
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
  const module = { exports: {} }
  new Function("module", "exports", outputText)(module, module.exports)
  return module.exports
}

const { TOMATO, PALETTE } = loadSprites()

const hexToRgba = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(255)

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

const crc32 = (buffer) => {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, "ascii"), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

const encodePng = (size, pixels) => {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // no filter
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

// Draws the sprite scaled by an integer factor, centered, over an optional background
const renderIcon = (size, background) => {
  const spriteSize = TOMATO.length
  const padding = background ? Math.round(size * 0.08) : 0
  const scale = Math.max(1, Math.floor((size - padding * 2) / spriteSize))
  const offset = Math.floor((size - spriteSize * scale) / 2)
  const pixels = Buffer.alloc(size * size * 4)

  if (background) {
    const bg = hexToRgba(background)
    for (let i = 0; i < size * size; i++) bg.forEach((v, c) => (pixels[i * 4 + c] = v))
  }

  TOMATO.forEach((row, sy) => {
    row.split("").forEach((char, sx) => {
      if (char === ".") return
      const color = hexToRgba(PALETTE[char])
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const i = ((offset + sy * scale + y) * size + offset + sx * scale + x) * 4
          color.forEach((v, c) => (pixels[i + c] = v))
        }
      }
    })
  })
  return encodePng(size, pixels)
}

// ICO container holding PNG images
const encodeIco = (images) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + images.length * 16
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16)
    entry[0] = size >= 256 ? 0 : size
    entry[1] = size >= 256 ? 0 : size
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += png.length
    return entry
  })
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)])
}

const BACKGROUND = "#1D2B53"
const outputs = {
  "favicon-16x16.png": renderIcon(16),
  "favicon-32x32.png": renderIcon(32),
  "apple-touch-icon.png": renderIcon(180, BACKGROUND),
  "android-chrome-192x192.png": renderIcon(192, BACKGROUND),
  "android-chrome-512x512.png": renderIcon(512, BACKGROUND),
  "logo192.png": renderIcon(192, BACKGROUND),
  "logo512.png": renderIcon(512, BACKGROUND),
  "favicon.ico": encodeIco([16, 32, 48].map((size) => ({ size, png: renderIcon(size) }))),
}

for (const [name, data] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(root, "public", name), data)
  console.log(`public/${name}`)
}
