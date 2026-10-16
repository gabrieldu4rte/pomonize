import type React from "react"
import { memo } from "react"
import { PALETTE, type Sprite } from "./sprites"

interface PixelSpriteProps {
  sprite: Sprite
  scale?: number
  className?: string
  title?: string
  // Paint every opaque pixel with this color (used for "empty" silhouettes)
  mono?: string
}

const PixelSprite: React.FC<PixelSpriteProps> = ({ sprite, scale = 3, className, title, mono }) => {
  const height = sprite.length
  const width = Math.max(...sprite.map((row) => row.length))
  const rects: React.ReactNode[] = []

  // Merge horizontal runs of the same color into a single rect
  sprite.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const char = row[x]
      let run = 1
      while (x + run < row.length && row[x + run] === char) run++
      if (char !== ".") {
        const fill = mono ?? (char === "c" ? "currentColor" : PALETTE[char])
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={fill} />)
      }
      x += run
    }
  })

  return (
    <svg
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  )
}

export default memo(PixelSprite)
