"use client"

import React from "react"

import { useCallback, useEffect, useRef, useState, memo } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Search, AlertCircle, Zap } from "lucide-react"
import { useSearch } from "@/hooks/use-search"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface EnhancedSearchBarProps {
  isMobile?: boolean
  placeholder?: string
  onSearch?: (query: string) => void
  containerClassName?: string
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://mizizzi-ecommerce-1.onrender.com"

const JumiaSearchInput = memo(
  ({
    inputRef,
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    placeholder,
    isLoading,
  }: {
    inputRef: React.RefObject<HTMLInputElement>
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onFocus: () => void
    onBlur: () => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    placeholder: string
    isLoading?: boolean
  }) => (
    <div className="relative flex-1">
      <div className="absolute left-0 top-0 h-full flex items-center pl-4 pointer-events-none">
        {isLoading ? (
          <div className="h-5 w-5 animate-spin">
            <Zap className="h-5 w-5 text-[#8B0A1A]" />
          </div>
        ) : (
          <Search className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full h-[42px] pl-11 pr-4 text-sm bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#8B0A1A] focus:ring-opacity-20 focus:border-[#8B0A1A] placeholder:text-gray-400 text-gray-900 transition-all"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        aria-label={placeholder}
      />
    </div>
  ),
)

JumiaSearchInput.displayName = "JumiaSearchInput"

const ImagePlaceholder = memo(() => (
  <div className="w-10 h-10 rounded bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
    <div className="text-gray-400 text-xs font-semibold">IMG</div>
  </div>
))

ImagePlaceholder.displayName = "ImagePlaceholder"

const ProductResultItem = memo(
  ({
    product,
    onClick,
    index,
  }: {
    product: any
    onClick: () => void
    index: number
  }) => {
    // Use memoization to prevent re-renders affecting image display
    const imageUrl = React.useMemo(() => {
      if (!product.image) return null
      if (product.image.startsWith("http")) return product.image
      return `${BACKEND_URL}/api/uploads/product_images/${product.image.split("/").pop()}`
    }, [product.image])

    const hasStock = product.stock > 0
    const discountBadge = product.discount ? `${product.discount}%` : null
    const [imageError, setImageError] = useState(false)

    return (
      <motion.button
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={onClick}
        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gradient-to-r hover:from-[#8B0A1A]/5 hover:to-transparent transition-all duration-200 text-left group relative border-b border-gray-100/50 last:border-0"
      >
        {imageError || !imageUrl ? (
          <ImagePlaceholder />
        ) : (
          <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0 relative">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={product.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority={false}
              onError={() => setImageError(true)}
            />
            {discountBadge && (
              <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                -{discountBadge}
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm text-gray-900 truncate group-hover:text-[#8B0A1A] transition-colors font-medium leading-tight">
                {product.name}
              </p>
              {product.category && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{product.category}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {product.price && (
              <p className="text-sm font-bold text-[#8B0A1A]">KSh {Number(product.price).toLocaleString()}</p>
            )}
            {product.rating && product.rating > 0 && (
              <div className="flex items-center gap-0.5">
                <span className="text-yellow-400">★</span>
                <span className="text-xs text-gray-600 font-medium">{product.rating.toFixed(1)}</span>
              </div>
            )}
            {!hasStock && (
              <span className="text-xs text-red-500 font-medium ml-auto">Out of Stock</span>
            )}
          </div>
        </div>
      </motion.button>
    )
  },
)

ProductResultItem.displayName = "ProductResultItem"

const SuggestionItem = memo(
  ({
    suggestion,
    query,
    onClick,
    index,
  }: {
    suggestion: string
    query: string
    onClick: () => void
    index: number
  }) => {
    const highlightMatch = (text: string, searchQuery: string) => {
      if (!searchQuery.trim()) return text
      const regex = new RegExp(`(${searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
      const parts = text.split(regex)
      return parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="font-semibold text-[#8B0A1A]">
            {part}
          </span>
        ) : (
          part
        ),
      )
    }

    return (
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={onClick}
        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gradient-to-r hover:from-[#8B0A1A]/8 hover:to-transparent transition-all duration-200 text-left group border-b border-gray-100/50 last:border-0 cursor-pointer"
      >
        <div className="flex-shrink-0">
          <Search className="h-4 w-4 text-[#8B0A1A]/60 group-hover:text-[#8B0A1A] transition-colors" />
        </div>
        <span className="text-sm text-gray-700 flex-1 group-hover:text-gray-900 font-medium">{highlightMatch(suggestion, query)}</span>
        <div className="text-gray-300 group-hover:text-[#8B0A1A] transition-colors text-xs font-medium">Go</div>
      </motion.button>
    )
  },
)

SuggestionItem.displayName = "SuggestionItem"

export function EnhancedSearchBar({
  isMobile = false,
  placeholder = "Search products, brands and categories",
  onSearch,
  containerClassName = "",
}: EnhancedSearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const searchHook = useSearch({
    initialQuery: query,
    delay: 50, // Ultra-fast search with minimal debounce
    onSearch: (searchQuery) => {
      if (onSearch) {
        onSearch(searchQuery)
      }
    },
  })

  const { results, isLoading, error, suggestions, handleSearch: updateSearchQuery } = searchHook

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        if (query.trim().length >= 1) {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`)
          setIsOpen(false)
          searchInputRef.current?.blur()
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        setIsOpen(false)
        searchInputRef.current?.blur()
      }
    },
    [query, router],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setQuery(value)
      updateSearchQuery(value)
      if (value.length >= 1) {
        setIsOpen(true)
      }
    },
    [updateSearchQuery],
  )

  const handleSearchClick = useCallback(() => {
    if (query.trim().length >= 1) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
    }
  }, [query, router])

  const handleSelect = useCallback(
    (item: string | any) => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }

      // Always go directly to product if it has an ID
      if (typeof item === "object" && item.id) {
        router.push(`/product/${item.id}`)
      } else if (typeof item === "string") {
        // If string suggestion, find the matching product from results
        const matchingProduct = results.find(
          (result) => result.name.toLowerCase() === item.toLowerCase()
        )
        if (matchingProduct && matchingProduct.id) {
          router.push(`/product/${matchingProduct.id}`)
        } else {
          // Fallback to search results if product not found
          setQuery(item)
          router.push(`/search?q=${encodeURIComponent(item)}`)
        }
      }
      setIsOpen(false)
    },
    [router, results],
  )

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
    }
    setIsOpen(true)
  }, [])

  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [])

  const showDropdown = isOpen && query.length >= 1

  const searchSuggestions =
    query.length >= 1
      ? [
          ...suggestions.filter((s: string) => s.toLowerCase().includes(query.toLowerCase())),
          ...results.slice(0, 3).map((r) => r.name),
        ]
          .filter((value, index, self) => self.indexOf(value) === index)
          .slice(0, 6)
      : []

  return (
    <div className={`w-full ${containerClassName}`}>
      <div className="relative">
        <div className="flex items-stretch gap-2">
          <JumiaSearchInput
            inputRef={searchInputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            isLoading={isLoading}
          />
          <button
            onClick={handleSearchClick}
            disabled={isLoading}
            className="h-[42px] px-5 rounded-[4px] bg-[#8B0A1A] hover:bg-[#6D0814] disabled:bg-gray-400 text-white font-medium text-sm transition-colors flex-shrink-0 flex items-center justify-center"
            aria-label="Search"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8,
              }}
              className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-xl shadow-2xl shadow-black/10 z-50 overflow-hidden"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="max-h-[70vh] overflow-y-auto">
                {/* Error state */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 text-center flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-600 text-sm">{error}</span>
                  </motion.div>
                )}

                {/* Search suggestions */}
                {!error && searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="border-b border-gray-100/80 py-1"
                  >
                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Suggestions</p>
                    {searchSuggestions.map((suggestion, index) => (
                      <SuggestionItem
                        key={`suggestion-${index}`}
                        suggestion={suggestion}
                        query={query}
                        onClick={() => handleSelect(suggestion)}
                        index={index}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Product results */}
                {!error && results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.08 }}
                    className="py-1"
                  >
                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Products</p>
                    {results.slice(0, 8).map((product, index) => (
                      <ProductResultItem
                        key={`product-${product.id}`}
                        product={product}
                        onClick={() => handleSelect(product)}
                        index={index}
                      />
                    ))}
                  </motion.div>
                )}

                {/* No results */}
                {!error && results.length === 0 && searchSuggestions.length === 0 && query.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-10 text-center"
                  >
                    <div className="text-gray-400 mb-2">
                      <Search className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No products found for <span className="font-bold text-gray-700">"{query}"</span></p>
                    <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
                  </motion.div>
                )}

                {/* Loading state */}
                {isLoading && results.length === 0 && !error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-6 text-center"
                  >
                    <div className="flex justify-center mb-2">
                      <div className="h-6 w-6 animate-spin">
                        <Zap className="h-6 w-6 text-[#8B0A1A]" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
