"use client"

import { useEffect, useRef } from "react"

export default function MouseGlow() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  const mouse = useRef({ x: 0, y: 0 })
  const pos = useRef({ x: 0, y: 0 })
  const scale = useRef(1)
  const ringScale = useRef(1)
  const ringOpacity = useRef(0.5)
  const rotation = useRef(0)

  useEffect(() => {
    if (!cursorRef.current || !ringRef.current) return

    const cursor = cursorRef.current
    const ring = ringRef.current

    mouse.current.x = window.innerWidth / 2
    mouse.current.y = window.innerHeight / 2
    pos.current.x = mouse.current.x
    pos.current.y = mouse.current.y

    let lastX = mouse.current.x
    let lastY = mouse.current.y

    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY

      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      const speed = Math.min(Math.sqrt(dx * dx + dy * dy) / 15, 1)

      scale.current = 1 + speed * 0.4
      ringScale.current = 1 + speed * 0.6
      ringOpacity.current = 0.4 + speed * 0.6

      lastX = e.clientX
      lastY = e.clientY
    }

    const animate = () => {
      // Smooth follow (LERP)
      pos.current.x += (mouse.current.x - pos.current.x) * 0.15
      pos.current.y += (mouse.current.y - pos.current.y) * 0.15

      rotation.current += 0.3 // slow infinite rotation

      cursor.style.transform = `
        translate(${pos.current.x}px, ${pos.current.y}px)
        translate(-50%, -50%)
        scale(${scale.current})
      `

      ring.style.transform = `
        translate(-50%, -50%)
        rotate(${rotation.current}deg)
        scale(${ringScale.current})
      `
      ring.style.opacity = `${ringOpacity.current}`

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
    window.addEventListener("pointermove", onMove)

    return () => {
      window.removeEventListener("pointermove", onMove)
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed z-50"
      aria-hidden
    >
      {/* Outer aura */}
      <div className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[60px]" />

      {/* Rotating gradient ring */}
      <div
        ref={ringRef}
        className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2
        rounded-full bg-[conic-gradient(from_0deg,#818cf8,#a5b4fc,#6366f1,#818cf8)]
        blur-md"
      />

      {/* Core dot */}
      <div
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2
        rounded-full bg-indigo-200 shadow-[0_0_20px_rgba(129,140,248,0.95)]"
      />
    </div>
  )
}
