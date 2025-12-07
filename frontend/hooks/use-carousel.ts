"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TIMING } from "@/constants/carousel"

interface UseCarouselProps {
  itemsLength: number
  autoPlay?: boolean
  interval?: number
}

export function useCarousel({ itemsLength, autoPlay = true, interval = TIMING.autoSlideInterval }: UseCarouselProps) {
  const [[currentSlide, direction], setSlideState] = useState<[number, number]>([0, 0])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const changeSlide = useCallback(
    (newIndex: number, newDirection: number) => {
      if (isTransitioning) return

      setIsTransitioning(true)
      setSlideState([newIndex, newDirection])

      setTimeout(() => {
        setIsTransitioning(false)
      }, 500)
    },
    [isTransitioning],
  )

  const currentSlideRef = useRef(currentSlide)
  const itemsLengthRef = useRef(itemsLength)

  useEffect(() => {
    currentSlideRef.current = currentSlide
  }, [currentSlide])

  useEffect(() => {
    itemsLengthRef.current = itemsLength
  }, [itemsLength])

  const nextSlide = useCallback(() => {
    const next = (currentSlideRef.current + 1) % itemsLengthRef.current
    changeSlide(next, 1)
  }, [changeSlide])

  const prevSlide = useCallback(() => {
    const prev = (currentSlideRef.current - 1 + itemsLengthRef.current) % itemsLengthRef.current
    changeSlide(prev, -1)
  }, [changeSlide])

  const pause = useCallback(() => {
    setIsPaused(true)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  // Auto-advance slides
  useEffect(() => {
    if (!autoPlay || isPaused) return

    intervalRef.current = setInterval(nextSlide, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoPlay, isPaused, interval, nextSlide])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        prevSlide()
      } else if (event.key === "ArrowRight") {
        nextSlide()
      } else if (event.key === " ") {
        event.preventDefault()
        if (isPaused) {
          resume()
        } else {
          pause()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [prevSlide, nextSlide, isPaused, pause, resume])

  return {
    currentSlide,
    direction,
    isTransitioning,
    isPaused,
    nextSlide,
    prevSlide,
    changeSlide,
    pause,
    resume,
  }
}
