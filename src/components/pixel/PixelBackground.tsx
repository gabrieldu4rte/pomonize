import type React from "react"
import { useEffect, useRef } from "react"

const PIXEL = 4

const SKY_BANDS = ["#0b1026", "#111d35", "#1D2B53", "#2b2557", "#422136", "#7E2553"]
const FAR_HILLS = "#291b3d"
const NEAR_HILLS = "#13102a"
const GRASS = "#008751"
const STAR_COLORS = ["#FFF1E8", "#FFEC27", "#29ADFF", "#FFCCAA"]

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

const CLOUD = [
  "....wwww......",
  "..wwwwwwww....",
  ".wwwwwwwwwwww.",
  "wwwwwwwwwwwwww",
  ".llllllllllll.",
]

const mulberry32 = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const ridge = (width: number, base: number, amplitude: number, rand: () => number) => {
  const points: number[] = []
  const anchors = Array.from({ length: Math.ceil(width / 24) + 2 }, () => rand())
  for (let x = 0; x < width; x++) {
    const i = Math.floor(x / 24)
    const t = (x % 24) / 24
    const smooth = t * t * (3 - 2 * t)
    const value = anchors[i] * (1 - smooth) + anchors[i + 1] * smooth
    points.push(Math.round(base - value * amplitude))
  }
  return points
}

const PixelBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    let width = 0
    let height = 0
    let scenery: HTMLCanvasElement | null = null
    let stars: { x: number; y: number; color: string; phase: number; big: boolean }[] = []
    let clouds: { x: number; y: number; speed: number }[] = []

    const build = () => {
      width = Math.max(1, Math.ceil(window.innerWidth / PIXEL))
      height = Math.max(1, Math.ceil(window.innerHeight / PIXEL))
      canvas.width = width
      canvas.height = height

      const rand = mulberry32(1337)
      scenery = document.createElement("canvas")
      scenery.width = width
      scenery.height = height
      const s = scenery.getContext("2d")
      if (!s) return

      const image = s.createImageData(width, height)
      const rgb = SKY_BANDS.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)))
      for (let y = 0; y < height; y++) {
        const pos = (y / height) * (rgb.length - 1)
        const band = Math.min(Math.floor(pos), rgb.length - 2)
        const frac = pos - band
        for (let x = 0; x < width; x++) {
          const color = frac * 16 > BAYER[y % 4][x % 4] ? rgb[band + 1] : rgb[band]
          const i = (y * width + x) * 4
          image.data[i] = color[0]
          image.data[i + 1] = color[1]
          image.data[i + 2] = color[2]
          image.data[i + 3] = 255
        }
      }
      s.putImageData(image, 0, 0)

      const moonR = 9
      const moonX = Math.round(width * 0.84)
      const moonY = Math.max(40, Math.round(height * 0.22))
      for (let y = -moonR; y <= moonR; y++) {
        for (let x = -moonR; x <= moonR; x++) {
          if (x * x + y * y > moonR * moonR) continue
          const lit = (x + 2) ** 2 + (y + 2) ** 2 <= (moonR - 1) ** 2
          s.fillStyle = lit ? "#FFF1E8" : "#C2C3C7"
          s.fillRect(moonX + x, moonY + y, 1, 1)
        }
      }
      s.fillStyle = "#FFCCAA"
      s.fillRect(moonX - 4, moonY - 3, 2, 2)
      s.fillRect(moonX + 2, moonY - 5, 1, 1)
      s.fillRect(moonX + 1, moonY + 2, 3, 2)
      s.fillRect(moonX - 3, moonY + 4, 1, 1)

      const far = ridge(width, height * 0.8, height * 0.18, rand)
      const near = ridge(width, height * 0.93, height * 0.1, rand)
      far.forEach((top, x) => {
        s.fillStyle = FAR_HILLS
        s.fillRect(x, top, 1, height - top)
      })
      near.forEach((top, x) => {
        s.fillStyle = GRASS
        s.fillRect(x, top, 1, 1)
        s.fillStyle = NEAR_HILLS
        s.fillRect(x, top + 1, 1, height - top)
      })

      stars = Array.from({ length: Math.round((width * height) / 450) }, () => ({
        x: Math.floor(rand() * width),
        y: Math.floor(rand() * height * 0.65),
        color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
        phase: rand() * Math.PI * 2,
        big: rand() > 0.9,
      }))
      clouds = Array.from({ length: Math.max(3, Math.round(width / 90)) }, () => ({
        x: rand() * width,
        y: Math.floor(height * (0.08 + rand() * 0.4)),
        speed: 0.6 + rand() * 1.2,
      }))
    }

    const draw = (time: number) => {
      if (!scenery) return
      ctx.drawImage(scenery, 0, 0)

      stars.forEach((star) => {
        const twinkle = reduceMotion ? 1 : Math.sin(time / 600 + star.phase)
        if (twinkle < -0.6) return
        ctx.fillStyle = star.color
        ctx.fillRect(star.x, star.y, 1, 1)
        if (star.big && twinkle > 0.4) {
          ctx.fillRect(star.x - 1, star.y, 3, 1)
          ctx.fillRect(star.x, star.y - 1, 1, 3)
        }
      })

      clouds.forEach((cloud) => {
        const span = width + CLOUD[0].length
        const x = Math.floor(((cloud.x + (reduceMotion ? 0 : (time / 1000) * cloud.speed)) % span) - CLOUD[0].length)
        CLOUD.forEach((row, cy) => {
          for (let cx = 0; cx < row.length; cx++) {
            if (row[cx] === ".") continue
            ctx.fillStyle = row[cx] === "w" ? "rgba(194,195,199,0.35)" : "rgba(131,118,156,0.35)"
            ctx.fillRect(x + cx, cloud.y + cy, 1, 1)
          }
        })
      })
    }

    let frame = 0
    let last = 0
    const loop = (time: number) => {
      if (time - last > 100) {
        draw(time)
        last = time
      }
      frame = requestAnimationFrame(loop)
    }

    const onResize = () => {
      build()
      draw(performance.now())
    }

    build()
    draw(0)
    if (!reduceMotion) frame = requestAnimationFrame(loop)
    window.addEventListener("resize", onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="pixel-background" aria-hidden />
}

export default PixelBackground
