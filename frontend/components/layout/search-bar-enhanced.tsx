"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState, memo } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Search } from "lucide-react"
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
  }: {
    inputRef: React.RefObject<HTMLInputElement>
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onFocus: () => void
    onBlur: () => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    placeholder: string
  }) => (
    <div className="relative flex-1">
      <div className="absolute left-0 top-0 h-full flex items-center pl-4 pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
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
        className="w-full h-[42px] pl-11 pr-4 text-sm bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:ring-0 placeholder:text-gray-400 text-gray-900"
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
    const imageUrl = product.image?.startsWith("http")
      ? product.image
      : product.image
        ? `${BACKEND_URL}/api/uploads/product_images/${product.image.split("/").pop()}`
        : "/diverse-products-still-life.png"

    return (
      <motion.button
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={onClick}
        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group"
      >
        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={product.name}
            width={40}
            height={40}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/diverse-products-still-life.png"
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 truncate group-hover:text-[#8B0A1A] transition-colors">{product.name}</p>
          {product.price && (
            <p className="text-sm font-bold text-[#8B0A1A]">KSh {Number(product.price).toLocaleString()}</p>
          )}
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
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        onClick={onClick}
        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
      >
        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-700">{highlightMatch(suggestion, query)}</span>
      </motion.button>
    )
  },
)

SuggestionItem.displayName = "SuggestionItem"

const AppleSpinner = memo(() => (
  <div className="relative w-5 h-5">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-2 bg-[#8B0A1A] rounded-full left-1/2 top-0 origin-[50%_250%]"
        style={{
          transform: `rotate(${i * 45}deg) translateX(-50%)`,
        }}
        animate={{
          opacity: [0.2, 1, 0.2],
        }}
        transition={{
          duration: 0.8,
          repeat: Number.POSITIVE_INFINITY,
          delay: i * 0.1,
          ease: "linear",
        }}
      />
    ))}
  </div>
))

AppleSpinner.displayName = "AppleSpinner"

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
    delay: 150,
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

      if (typeof item === "object" && item.id) {
        router.push(`/product/${item.id}`)
      } else {
        const searchTerm = typeof item === "string" ? item : item.name
        setQuery(searchTerm)
        router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
      }
      setIsOpen(false)
    },
    [router],
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

  const trendingProducts = searchHook.getTrendingProducts()
  const categories = searchHook.getCategories()

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
          />
          <button
            onClick={handleSearchClick}
            className="h-[42px] px-5 rounded-[4px] bg-[#8B0A1A] hover:bg-[#6D0814] text-white font-medium text-sm transition-colors flex-shrink-0 flex items-center justify-center"
            aria-label="Search"
          >
            Search
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
                    className="p-6 text-center text-red-600 text-sm"
                  >
                    {error}
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
                    {results.slice(0, 8).map((product, index) => (
                      <ProductResultItem
                        key={`product-${product.id}`}
                        product={product}
                        onClick={() => handleSelect(product)}
                        index={index}
                      />
                    ))}
                    {results.length > 8 && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        onClick={handleSearchClick}
                        className="w-full px-4 py-3.5 text-sm font-semibold text-[#8B0A1A] hover:bg-gray-50/80 active:bg-gray-100 transition-all text-center border-t border-gray-100/80"
                      >
                        View all {results.length} results
                      </motion.button>
                    )}
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
                      <p className="text-gray-500 text-sm font-medium">No products found for "{query}"</p>
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
