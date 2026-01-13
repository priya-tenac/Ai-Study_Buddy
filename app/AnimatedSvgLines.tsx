"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export default function AnimatedSvgLines() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") return

    gsap.registerPlugin(ScrollTrigger)

    const paths = gsap.utils.toArray<SVGPathElement>(".draw-svg-path")
    const tweens: gsap.core.Tween[] = []

    paths.forEach((path, index) => {
      const length = path.getTotalLength()
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      })

      const tween = gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: "power2.out",
        delay: 0.1 * index,
        scrollTrigger: {
          trigger: path,
          start: "top 85%",
          toggleActions: "play none none none",
          once: true,
        },
      })

      tweens.push(tween)
    })

    return () => {
      tweens.forEach((tween) => tween.kill())
    }
  }, [pathname])

  return null
}
