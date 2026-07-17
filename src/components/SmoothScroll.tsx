"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import ScrollTrigger from "gsap/ScrollTrigger"
import ScrollSmoother from "gsap/ScrollSmoother"

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

    // Detect if device is mobile/touch-enabled
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Skip ScrollSmoother entirely on mobile to prevent horizontal scroll issues
    if (isMobile || isTouchDevice) return;

    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current!,
      content: contentRef.current!,
      smooth: 1.5,
      effects: true,
      normalizeScroll: true,
    })

    return () => {
      smoother.kill()
    }
  }, [])

  return (
    <div ref={wrapperRef} id="smooth-wrapper">
      <div ref={contentRef} id="smooth-content">
        {children}
      </div>
    </div>
  )
}
