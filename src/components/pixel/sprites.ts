// Pixel art drawn as text grids. Each character is one pixel:
// '.' is transparent, 'c' is currentColor and every other character is a key of PALETTE.

export type Sprite = readonly string[]

// PICO-8 palette
export const PALETTE: Record<string, string> = {
  k: "#000000",
  n: "#1D2B53",
  m: "#7E2553",
  g: "#008751",
  b: "#AB5236",
  d: "#5F574F",
  l: "#C2C3C7",
  w: "#FFF1E8",
  r: "#FF004D",
  o: "#FFA300",
  y: "#FFEC27",
  G: "#00E436",
  B: "#29ADFF",
  i: "#83769C",
  p: "#FF77A8",
  s: "#FFCCAA",
}

export const TOMATO: Sprite = [
  ".......kk.......",
  "......kgGk......",
  "....kkkgGkkk....",
  "..kkGGGGGGGGkk..",
  ".krkGgkGGkgGkrk.",
  ".krrkkrkkrkkrrk.",
  "krwwrrrrrrrrrrrk",
  "krwrrrrrrrrrrrrk",
  "krwrrrrrrrrrrrrk",
  "krrrrrrrrrrrrrrk",
  "krrrrrrrrrrrrrmk",
  "krrrrrrrrrrrrrmk",
  "krrrrrrrrrrrrmmk",
  ".krrrrrrrrrrmmk.",
  "..kkrrrrrrmmkk..",
  "....kkkkkkkk....",
]

export const LIGHTNING: Sprite = [
  "......kkkk",
  ".....kyyyk",
  "....kywyk.",
  "...kywyk..",
  "..kyyykkkk",
  ".kyyyyyyyk",
  "kkkkyyyyk.",
  "...kyyyk..",
  "..kyyyk...",
  "..kyyk....",
  ".kyyk.....",
  ".kkk......",
]

export const CLOCK: Sprite = [
  "...kkkkkk...",
  "..kBBBBBBk..",
  ".kBwwwwwwBk.",
  "kBwwwkwwwwBk",
  "kBwwwkwwwwBk",
  "kBwwwkwwwwBk",
  "kBwwwkkkwwBk",
  "kBwwwwwwwwBk",
  "kBwwwwwwwwBk",
  ".kBwwwwwwBk.",
  "..kBBBBBBk..",
  "...kkkkkk...",
]

export const ROBOT: Sprite = [
  ".....kk.....",
  ".....rr.....",
  "..kkkkkkkk..",
  ".kllllllllk.",
  ".klrrllrrlk.",
  ".klrwllrwlk.",
  ".kllllllllk.",
  ".kldkdkdklk.",
  ".kllllllllk.",
  "..kkkkkkkk..",
  "...kddddk...",
  "..kkk..kkk..",
]

export const TARGET: Sprite = [
  "...kkkkkk...",
  "..krrrrrrk..",
  ".krrwwwwrrk.",
  "krrwwrrwwrrk",
  "krwwrrrrwwrk",
  "krwrrwwrrwrk",
  "krwrrwwrrwrk",
  "krwwrrrrwwrk",
  "krrwwrrwwrrk",
  ".krrwwwwrrk.",
  "..krrrrrrk..",
  "...kkkkkk...",
]

export const COFFEE: Sprite = [
  "..l..l..l...",
  "...l..l..l..",
  "..l..l..l...",
  "kkkkkkkkkk..",
  "kwbbbbbbwkkk",
  "kwbbbbbbwk.k",
  "kwwwwwwwwk.k",
  "kwwwwwwwwkkk",
  "kwwwwwwwwk..",
  ".kwwwwwwk...",
  "..kkkkkk....",
  "............",
]

export const STAR: Sprite = [
  ".....kk.....",
  "....kwyk....",
  "....kyyk....",
  "kkkkkyykkkkk",
  "kyyyyyyyyyyk",
  ".kyyyyyyyyk.",
  "..kyyyyyyk..",
  "..kyyyyyyk..",
  ".kyyykkyyyk.",
  ".kyyk..kyyk.",
  "kyyk....kyyk",
  "kkk......kkk",
]

export const BULB: Sprite = [
  "..kkkk..",
  ".kyyyyk.",
  "kyywyyyk",
  "kywyyyyk",
  "kyyyyyyk",
  ".kyyyyk.",
  "..kyyk..",
  "..kllk..",
  "..kddk..",
  "...kk...",
]

export const HEART: Sprite = [
  ".kk.kk.",
  "kprkrrk",
  "kprrrrk",
  "krrrrrk",
  ".krrrk.",
  "..krk..",
  "...k...",
]

export const PLAY: Sprite = [
  "c......",
  "cc.....",
  "ccc....",
  "cccc...",
  "cccc...",
  "ccc....",
  "cc.....",
  "c......",
]

export const PAUSE: Sprite = [
  "cc..cc",
  "cc..cc",
  "cc..cc",
  "cc..cc",
  "cc..cc",
  "cc..cc",
  "cc..cc",
  "cc..cc",
]

export const RESET: Sprite = [
  "..cccc.c",
  ".c....cc",
  "c....ccc",
  "c.......",
  "c......c",
  "c......c",
  ".c....c.",
  "..cccc..",
]

export const ARROW_LEFT: Sprite = [
  "...c....",
  "..cc....",
  ".ccccccc",
  "cccccccc",
  ".ccccccc",
  "..cc....",
  "...c....",
]

export const ARROW_RIGHT: Sprite = ARROW_LEFT.map((row) => row.split("").reverse().join(""))

export const SPEAKER_ON: Sprite = [
  "...c......",
  "..cc...c..",
  "cccc.c..c.",
  "cccc..c.c.",
  "cccc..c.c.",
  "cccc.c..c.",
  "..cc...c..",
  "...c......",
]

export const SPEAKER_OFF: Sprite = [
  "...c......",
  "..cc......",
  "cccc.c...c",
  "cccc..c.c.",
  "cccc...c..",
  "cccc..c.c.",
  "..cc.c...c",
  "...c......",
]
