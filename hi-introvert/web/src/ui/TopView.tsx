import React, { useEffect, useRef } from 'react'
import type { World } from '@v1b3x0r/mds-core'

export const TopView: React.FC<{ world: World }> = ({ world }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!

    const draw = () => {
      if (!ctx) return
      const w = c.width, h = c.height
      ctx.clearRect(0, 0, w, h)

      // simple background grid
      ctx.strokeStyle = '#eee'
      ctx.lineWidth = 1
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

      // draw entities as circles
      for (const e of world.entities) {
        const valence = e.emotion?.valence ?? 0
        const color = valence > 0 ? `rgba(46, 204, 113, ${0.5 + valence * 0.5})` : `rgba(52, 152, 219, ${0.5 + (-valence) * 0.5})`
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(e.x, e.y, 10, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const id = setInterval(draw, 200)
    draw()
    return () => clearInterval(id)
  }, [world])

  return (
    <canvas ref={canvasRef} width={400} height={300} style={{ width: '100%', border: '1px solid #eee', borderRadius: 4 }} />
  )
}

