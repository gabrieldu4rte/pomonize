import type React from "react"
import { memo } from "react"

// 5x7 bitmap font for the timer display
const GLYPHS: Record<string, string[]> = {
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ":": [".", ".", "#", ".", "#", ".", "."],
}

interface PixelDigitsProps {
  text: string
  color: string
  shadowColor?: string
  scale?: number
  dimColon?: boolean
}

const PixelDigits: React.FC<PixelDigitsProps> = ({ text, color, shadowColor = "#000000", scale = 6, dimColon = false }) => {
  const pixels: { x: number; y: number; colon: boolean }[] = []
  let cursor = 0

  text.split("").forEach((char, index) => {
    const glyph = GLYPHS[char]
    if (!glyph) return
    glyph.forEach((row, y) => {
      row.split("").forEach((cell, x) => {
        if (cell === "#") pixels.push({ x: cursor + x, y, colon: char === ":" })
      })
    })
    cursor += glyph[0].length + (index < text.length - 1 ? 1 : 0)
  })

  const width = cursor + 1
  const height = 8

  return (
    <svg
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {pixels.map(({ x, y, colon }) => (
        <rect key={`s${x}-${y}`} x={x + 1} y={y + 1} width={1} height={1} fill={shadowColor} opacity={colon && dimColon ? 0.3 : 1} />
      ))}
      {pixels.map(({ x, y, colon }) => (
        <rect key={`p${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} opacity={colon && dimColon ? 0.3 : 1} />
      ))}
    </svg>
  )
}

export default memo(PixelDigits)
