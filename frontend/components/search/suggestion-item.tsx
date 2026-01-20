"use client"

import { Search, Star, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

interface SuggestionItemProps {
  name: string
  price?: number
  image?: string
  rating?: number
  category?: string
  isProduct?: boolean
  onClick: () => void
  index: number
}

export function SuggestionItem({
  name,
  price,
  image,
  rating,
  category,
  isProduct = false,
  onClick,
  index,
}: SuggestionItemProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="w-full px-4 py-3 hover:bg-gradient-to-r hover:from-[#8B0A1A]/5 hover:to-transparent transition-all duration-200 text-left group"
    >
      <div className="flex items-center gap-3">
        {/* Icon or Image */}
        <div className="flex-shrink-0">
          {isProduct && image ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <Image
                src={image || "/placeholder.svg"}
                alt={name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#8B0A1A]/10 flex items-center justify-center flex-shrink-0">
              <Search className="h-5 w-5 text-[#8B0A1A]" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#8B0A1A] transition-colors">
                {name}
              </p>
              {category && !isProduct && (
                <p className="text-xs text-gray-500 truncate mt-0.5">in {category}</p>
              )}
            </div>
          </div>

          {/* Product-specific info */}
          {isProduct && (
            <div className="flex items-center gap-2 mt-1">
              {price && <p className="text-sm font-bold text-[#8B0A1A]">KSh {price.toLocaleString()}</p>}
              {rating && rating > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="text-gray-400 group-hover:text-[#8B0A1A] transition-colors flex-shrink-0">
          <ShoppingCart className="w-4 h-4" />
        </div>
      </div>
    </motion.button>
  )
}
