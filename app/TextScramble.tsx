"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { gsap } from "gsap"
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"

export default function TextScramble() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") return

    gsap.registerPlugin(ScrambleTextPlugin)

    const elements = gsap.utils.toArray<HTMLElement>(".text-scramble")

    const tweens: gsap.core.Tween[] = []

    elements.forEach((el, index) => {
      const targetText = el.dataset.scrambleText || el.textContent || ""
      if (!targetText) return

      // Ensure the element displays the final text for accessibility
      el.textContent = targetText

      const durationAttr = el.dataset.scrambleDuration
      const duration = durationAttr ? parseFloat(durationAttr) || 2.0 : 2.0

      const tween = gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.4,
          delay: 0.15 + index * 0.1,
          onStart: () => {
            gsap.to(el, {
              duration,
              scrambleText: {
                text: targetText,
                chars: "upperAndLowerCase",
                revealDelay: 0.15,
                speed: 0.3,
              },
              ease: "none",
            })
          },
        }
      )

      tweens.push(tween)
    })

    return () => {
      tweens.forEach((tween) => tween.kill())
    }
  }, [pathname])

  return null
}
