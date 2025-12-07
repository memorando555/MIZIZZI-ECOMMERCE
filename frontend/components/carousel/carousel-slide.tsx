"use client"

import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import type { CarouselItem } from "@/types/carousel"

interface CarouselSlideProps {
  item: CarouselItem
  isActive: boolean
  index: number
}

export const CarouselSlide = React.memo<CarouselSlideProps>(({ item, isActive, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="absolute inset-0 overflow-hidden"
    >
      {/* Background Image */}
      <div className="relative h-full w-full">
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.title}
          fill
          className="object-cover"
          priority={index === 0}
          fetchPriority={index === 0 ? "high" : "auto"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          quality={90}
        />
      </div>
    </motion.div>
  )
})

CarouselSlide.displayName = "CarouselSlide"
