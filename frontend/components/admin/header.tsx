"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import useMobile from "@/hooks/use-mobile"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { useAdmin } from "@/contexts/admin/admin-context"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Icons
import {
  Menu,
  X,
  Search,
  Bell,
  MessageCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Calendar,
  Globe,
  Plus,
  Upload,
  Download,
  Printer,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  Package,
  ShoppingBag,
  Users,
  FileText,
  Sliders,
} from "lucide-react"
import Link from "next/link"

interface AdminHeaderProps {
  toggleSidebar: () => void
  isSidebarCollapsed: boolean
}

export function AdminHeader({ toggleSidebar, isSidebarCollapsed }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { user, logout } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const searchRef = useRef<HTMLDivElement>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [showNotificationBadge, setShowNotificationBadge] = useState(true)
  const [showMessageBadge, setShowMessageBadge] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; href: string }[]>([])
  const [quickActions, setQuickActions] = useState<{ label: string; href: string; icon: React.ReactNode }[]>([
    { label: "New Product", href: "/admin/products/new", icon: <Package className="h-4 w-4" /> },
    { label: "New Order", href: "/admin/orders/new", icon: <ShoppingBag className="h-4 w-4" /> },
    { label: "New Customer", href: "/admin/customers/new", icon: <Users className="h-4 w-4" /> },
    { label: "New Category", href: "/admin/categories/new", icon: <FileText className="h-4 w-4" /> },
  ])
  const { notifications, markNotificationAsRead, clearAllNotifications } = useAdmin()
  const [systemStatus, setSystemStatus] = useState<{
    api: "operational" | "degraded" | "down"
    database: "operational" | "degraded" | "down"
    storage: "operational" | "degraded" | "down"
    websocket: "operational" | "degraded" | "down"
  }>({
    api: "operational",
    database: "operational",
    storage: "operational",
    websocket: "operational",
  })
  const [languages, setLanguages] = useState([
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "sw", name: "Swahili", flag: "🇰🇪" },
  ])
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "John Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
      message: "When will my order be shipped?",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: "2",
      sender: "Jane Smith",
      avatar: "https://i.pravatar.cc/150?img=2",
      message: "I need help with my return",
      time: "1 hour ago",
      read: false,
    },
    {
      id: "3",
      sender: "Robert Johnson",
      avatar: "https://i.pravatar.cc/150?img=3",
      message: "Is the luxury watch back in stock?",
      time: "3 hours ago",
      read: true,
    },
  ])

  useEffect(() => {
    setMounted(true)

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Generate breadcrumbs based on current path
    const generateBreadcrumbs = () => {
      const paths = (pathname ?? "").split("/").filter(Boolean)
      const breadcrumbsArray: { label: string; href: string }[] = [{ label: "Dashboard", href: "/admin" }]

      let currentPath = ""
      paths.forEach((path, i) => {
        if (path === "admin") return // Skip "admin" in breadcrumbs

        currentPath += `/${path}`
        const formattedPath = path
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        // Don't add IDs to breadcrumbs
        if (!path.match(/^\d+$/) && !path.match(/^\[.*\]$/)) {
          breadcrumbsArray.push({
            label: formattedPath,
            href: `/admin${currentPath}`,
          })
        }
      })

      setBreadcrumbs(breadcrumbsArray)
    }

    generateBreadcrumbs()

    return () => {
      clearInterval(timer)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setIsSearchResultsOpen(true)

    // Simulate search API call
    setTimeout(() => {
      setSearchResults([
        {
          type: "product",
          id: "1",
          title: "Luxury Watch",
          subtitle: "In stock: 24 units",
          href: "/admin/products/1",
        },
        {
          type: "order",
          id: "ORD-12345",
          title: "Order #12345",
          subtitle: "Status: Processing",
          href: "/admin/orders/12345",
        },
        {
          type: "customer",
          id: "3",
          title: "John Smith",
          subtitle: "john.smith@example.com",
          href: "/admin/customers/3",
        },
      ])
      setIsSearching(false)
    }, 500)
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin/login")
  }

  const handleSearchFocus = () => {
    setIsSearchFocused(true)
    setIsSearchResultsOpen(true)
  }

  const handleSearchBlur = () => {
    setIsSearchFocused(false)
    // Delay closing search results to allow clicking on them
    setTimeout(() => {
      setIsSearchResultsOpen(false)
    }, 200)
  }

  const handleNotificationClick = () => {
    setShowNotificationBadge(false)
  }

  const handleMessageClick = () => {
    setShowMessageBadge(false)
  }

  const handleLanguageChange = (code: string) => {
    setCurrentLanguage(code)
    // Here you would implement actual language change logic
  }

  const handleMarkAllNotificationsAsRead = () => {
    clearAllNotifications()
  }

  const handleMarkAllMessagesAsRead = () => {
    setMessages(messages.map((msg) => ({ ...msg, read: true })))
  }

  const getSystemStatusColor = (status: "operational" | "degraded" | "down") => {
    switch (status) {
      case "operational":
        return "bg-green-500"
      case "degraded":
        return "bg-yellow-500"
      case "down":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSystemStatusText = (status: "operational" | "degraded" | "down") => {
    switch (status) {
      case "operational":
        return "Operational"
      case "degraded":
        return "Degraded"
      case "down":
        return "Down"
      default:
        return "Unknown"
    }
  }

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      )
    }

    if (searchResults.length === 0) {
      return (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No results found for &quot;{searchQuery}&quot;
        </div>
      )
    }

    return (
      <div className="p-2">
        {searchResults.map((result) => (
          <Link
            key={`${result.type}-${result.id}`}
            href={result.href}
            className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm transition-all duration-200"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-sm",
                result.type === "product"
                  ? "bg-blue-100/80 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                  : result.type === "order"
                    ? "bg-purple-100/80 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
                    : "bg-green-100/80 text-green-600 dark:bg-green-900/50 dark:text-green-400",
              )}
            >
              {result.type === "product" ? (
                <Package className="h-4 w-4" />
              ) : result.type === "order" ? (
                <ShoppingBag className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{result.subtitle}</div>
            </div>
          </Link>
        ))}
        <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-800/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg"
            onClick={() => router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)}
          >
            View all results
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-30 flex h-14 md:h-16 items-center gap-1 sm:gap-2 px-2 sm:px-4 md:px-6 shadow-lg",
        "bg-white border-b border-gray-200",
        "shadow-gray-900/5",
        "admin-header-clean",
      )}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {isMobile ? (
        <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "md:hidden rounded-lg h-8 w-8 sm:h-9 sm:w-9",
              "text-gray-700 hover:text-gray-900",
              "hover:bg-gray-100",
              "transition-colors duration-150",
            )}
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5 stroke-[1.5]" />
          </Button>
        </motion.div>
      ) : (
        <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "hidden md:flex rounded-lg h-8 w-8 sm:h-9 sm:w-9",
              "text-gray-700 hover:text-gray-900",
              "hover:bg-gray-100",
              "transition-colors duration-150",
            )}
            onClick={toggleSidebar}
          >
            {isSidebarCollapsed ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                <Menu className="h-5 w-5 stroke-[1.5]" />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                <X className="h-5 w-5 stroke-[1.5]" />
              </motion.div>
            )}
          </Button>
        </motion.div>
      )}

      {/* Breadcrumbs - Hidden on mobile */}
      <div className="hidden lg:flex items-center space-x-1 text-xs md:text-sm text-gray-500 dark:text-gray-400 ml-2">
        {breadcrumbs.map((crumb, i) => (
          <motion.div
            key={i}
            className="flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.2 }}
          >
            {i > 0 && <ChevronRight className="h-3 w-3 mx-1 text-gray-300 dark:text-gray-600" />}
            <Link
              href={crumb.href}
              className={cn(
                "hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 px-2 py-1 rounded-lg",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                i === breadcrumbs.length - 1
                  ? "font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50"
                  : "text-gray-500 dark:text-gray-400",
              )}
            >
              {crumb.label}
            </Link>
          </motion.div>
        ))}
      </div>

        {isMobile ? (
          <>
            <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <SheetTrigger asChild>
                    <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex items-center gap-2 px-2 sm:px-3 rounded-lg h-9",
                          "text-gray-700 hover:text-gray-900",
                          "hover:bg-gray-100",
                          "transition-colors duration-150",
                          "border border-gray-200 hover:border-gray-300",
                        )}
                      >
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-700 shadow-sm">
                          <span className="text-xs font-semibold text-white">
                            {(user?.name || "AU").substring(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="hidden md:block text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {(user?.name || "Admin").split(' ')[0]}
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block ml-auto" />
                      </Button>
                    </motion.div>
              </SheetTrigger>
            <SheetContent
              side="top"
              className={cn(
                "pt-12",
                "bg-white dark:bg-gray-900",
                "border-b border-gray-200 dark:border-gray-800",
              )}
            >
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 -translate-y-1/2" />
                  <Input
                    type="search"
                    placeholder="Search products, orders, customers..."
                    className={cn(
                      "w-full pl-10 rounded-lg",
                      "bg-white dark:bg-gray-800",
                      "border border-gray-200 dark:border-gray-700",
                      "focus-visible:ring-blue-500 focus-visible:border-blue-500",
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <div
          ref={searchRef}
          className={cn(
            "hidden flex-1 sm:flex sm:max-w-md relative transition-all duration-300",
            isSearchFocused ? "sm:max-w-lg" : "sm:max-w-md",
          )}
        >
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2 stroke-[1.5]" />
              <Input
                type="search"
                placeholder="Search..."
                className={cn(
                  "w-full pl-10 rounded-lg transition-all duration-150 text-sm",
                  "bg-gray-100",
                  "border-0",
                  "focus-visible:ring-0 focus-visible:bg-white",
                  "focus-visible:outline-none",
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              {isSearchResultsOpen && searchQuery.trim() && (
                <motion.div
                  className={cn(
                    "absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg z-50",
                    "bg-white",
                    "border border-gray-200",
                  )}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderSearchResults()}
                </motion.div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Date and Time - Hidden on mobile */}
      <motion.div
        className="hidden lg:flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400 px-2 sm:px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs sm:text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.15 }}
      >
        <Calendar className="h-4 w-4" />
        <span className="font-medium hidden sm:inline">{format(currentTime, "EEEE, MMMM d, yyyy")}</span>
        <span className="font-medium sm:hidden">{format(currentTime, "MMM d")}</span>
      </motion.div>

      <div className="ml-auto flex items-center gap-0.5 sm:gap-1 md:gap-2">
        {/* System Status Indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "rounded-xl",
                          "text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400",
                          "hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm",
                          "border border-transparent hover:border-white/20 dark:hover:border-gray-700/50",
                        )}
                      >
                        {isOnline ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </motion.div>
                  </PopoverTrigger>
                  <PopoverContent
                    className={cn(
                      "w-80",
                      "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
                      "border border-gray-200/50 dark:border-gray-800/50 shadow-xl",
                    )}
                    align="end"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">System Status</h4>
                        <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">API</span>
                          <div className="flex items-center">
                            <span
                              className={`h-2 w-2 rounded-full mr-2 ${getSystemStatusColor(systemStatus.api)}`}
                            ></span>
                            <span className="text-xs font-medium">{getSystemStatusText(systemStatus.api)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Database</span>
                          <div className="flex items-center">
                            <span
                              className={`h-2 w-2 rounded-full mr-2 ${getSystemStatusColor(systemStatus.database)}`}
                            ></span>
                            <span className="text-xs font-medium">{getSystemStatusText(systemStatus.database)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Storage</span>
                          <div className="flex items-center">
                            <span
                              className={`h-2 w-2 rounded-full mr-2 ${getSystemStatusColor(systemStatus.storage)}`}
                            ></span>
                            <span className="text-xs font-medium">{getSystemStatusText(systemStatus.storage)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">WebSocket</span>
                          <div className="flex items-center">
                            <span
                              className={`h-2 w-2 rounded-full mr-2 ${getSystemStatusColor(systemStatus.websocket)}`}
                            ></span>
                            <span className="text-xs font-medium">{getSystemStatusText(systemStatus.websocket)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200/50 dark:border-gray-800/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg"
                        >
                          View detailed status
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>System Status</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Language Selector */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "rounded-xl",
                          "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400",
                          "hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm",
                          "border border-transparent hover:border-white/20 dark:hover:border-gray-700/50",
                        )}
                      >
                        <Globe className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={cn(
                      "w-56",
                      "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
                      "border border-gray-200/50 dark:border-gray-800/50 shadow-xl",
                    )}
                  >
                    <DropdownMenuLabel>Select Language</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {languages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        className={cn(
                          "cursor-pointer rounded-lg mx-1",
                          currentLanguage === lang.code && "bg-blue-50/80 dark:bg-blue-900/50",
                        )}
                        onClick={() => handleLanguageChange(lang.code)}
                      >
                        <span className="mr-2">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {currentLanguage === lang.code && <CheckCircle className="ml-auto h-4 w-4 text-green-500" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Change Language</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Quick Actions Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "rounded-xl",
                          "text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400",
                          "hover:bg-white/60 dark:hover:bg-gray-800/60 backdrop-blur-sm",
                          "border border-transparent hover:border-white/20 dark:hover:border-gray-700/50",
                        )}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={cn(
                      "w-56",
                      "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
                      "border border-gray-200/50 dark:border-gray-800/50 shadow-xl",
                    )}
                  >
                    <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {quickActions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        className="cursor-pointer rounded-lg mx-1"
                        onClick={() => router.push(action.href)}
                      >
                        <div className="mr-2">{action.icon}</div>
                        <span>{action.label}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer rounded-lg mx-1">
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Import Data</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer rounded-lg mx-1">
                      <Download className="mr-2 h-4 w-4" />
                      <span>Export Data</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer rounded-lg mx-1">
                      <Printer className="mr-2 h-4 w-4" />
                      <span>Print Reports</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Quick Actions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Messages Dropdown */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "relative rounded-lg h-9 w-9",
                          "text-gray-700 hover:text-gray-900",
                          "hover:bg-gray-100",
                          "transition-colors duration-150",
                        )}
                        onClick={handleMessageClick}
                      >
                        <MessageCircle className="h-5 w-5 stroke-[1.5]" />
                      <AnimatePresence>
                        {showMessageBadge && messages.some((msg) => !msg.read) && (
                          <motion.span
                            className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-lg shadow-blue-500/50"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.15 }}
                          >
                            {messages.filter((msg) => !msg.read).length}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Messages</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent
            align="end"
            className={cn(
              "w-[280px] md:w-80 shadow-lg",
              "bg-white",
              "border border-gray-200",
            )}
          >
            <DropdownMenuLabel className="text-gray-900 flex justify-between items-center">
              <span>Messages</span>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-600 border-blue-200"
              >
                {messages.filter((msg) => !msg.read).length} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <ScrollArea className="h-[300px]">
              <div className="p-2">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: index * 0.02 }}
                  >
                    <DropdownMenuItem className="flex items-start gap-3 p-3 hover:bg-blue-50 cursor-pointer rounded-lg mx-1">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.sender} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {message.sender.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{message.sender}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{message.time}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{message.message}</div>
                      </div>
                      {!message.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1"></div>}
                    </DropdownMenuItem>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
            <DropdownMenuSeparator className="bg-gray-100/50 dark:bg-gray-800/50" />
            <div className="p-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-lg"
                onClick={handleMarkAllMessagesAsRead}
              >
                Mark all as read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50/80 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-lg"
                onClick={() => router.push("/admin/messages")}
              >
                View all messages
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "relative rounded-lg h-9 w-9",
                          "text-gray-700 hover:text-gray-900",
                          "hover:bg-gray-100",
                          "transition-colors duration-150",
                        )}
                        onClick={handleNotificationClick}
                      >
                        <Bell className="h-5 w-5 stroke-[1.5]" />
                      <AnimatePresence>
                        {showNotificationBadge && notifications.length > 0 && (
                          <motion.span
                            className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg shadow-red-500/50"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.15 }}
                          >
                            {notifications.length}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent
            align="end"
            className={cn(
              "w-[280px] md:w-80 shadow-lg",
              "bg-white",
              "border border-gray-200",
            )}
          >
            <DropdownMenuLabel className="text-gray-900 flex justify-between items-center">
              <span>Notifications</span>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-600 border-red-200"
              >
                {notifications.length} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <Tabs defaultValue="all" className="w-full">
              <div className="px-3 pt-2">
                <TabsList className="w-full grid grid-cols-3 bg-gray-100">
                  <TabsTrigger value="all" className="text-xs rounded-lg">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs rounded-lg">
                    Orders
                  </TabsTrigger>
                  <TabsTrigger value="system" className="text-xs rounded-lg">
                    System
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="all" className="m-0">
                <ScrollArea className="h-[250px]">
                  <div className="p-2">
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 hover:bg-red-50/80 dark:hover:bg-red-900/20 cursor-pointer rounded-xl mx-1 backdrop-blur-sm">
                          <div className="flex items-center gap-2 w-full">
                            <div className="bg-red-50/80 dark:bg-red-900/50 p-2 rounded-xl">
                              <ShoppingBag className="h-4 w-4 text-red-500 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">New Order #1234</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</div>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                          </div>
                        </DropdownMenuItem>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            <DropdownMenuSeparator className="bg-gray-100/50 dark:bg-gray-800/50" />
            <div className="p-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50/80 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg"
                onClick={handleMarkAllNotificationsAsRead}
              >
                Mark all as read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-red-700 hover:bg-red-50/80 dark:text-gray-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg"
                onClick={() => router.push("/admin/notifications")}
              >
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center gap-2 px-2 sm:px-3 rounded-lg h-9",
                        "text-gray-700 hover:text-gray-900",
                        "hover:bg-gray-100",
                        "transition-colors duration-200",
                        "border border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <Avatar className="h-7 w-7 border border-gray-300 shadow-sm">
                        <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                          {(user?.name || "AU").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {user?.name || "Admin User"}
                        </div>
                        <div className="text-xs text-gray-500">Store Admin</div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block ml-1" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Your Profile</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent
            align="end"
            className={cn(
              "shadow-lg w-56",
              "bg-white",
              "border border-gray-200",
            )}
          >
            <div className="flex items-center justify-start p-3 bg-gray-50 rounded-lg mx-2 mb-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-semibold text-sm text-gray-900">{(user?.name || "Admin").split(' ')[0]}</p>
                <p className="w-[200px] truncate text-xs text-gray-600">
                  {user?.email || "admin@example.com"}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/admin/profile")}
                className="hover:bg-gray-100 cursor-pointer rounded-lg mx-1"
              >
                <User className="mr-2 h-4 w-4 stroke-[1.5]" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin/settings")}
                className="hover:bg-gray-100 cursor-pointer rounded-lg mx-1"
              >
                <Settings className="mr-2 h-4 w-4 stroke-[1.5]" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="hover:bg-gray-100 cursor-pointer rounded-lg mx-1">
                  <Sliders className="mr-2 h-4 w-4 stroke-[1.5]" />
                  <span>Preferences</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent
                    className={cn(
                      "shadow-lg",
                      "bg-white",
                      "border border-gray-200",
                    )}
                  >
                    <DropdownMenuItem className="hover:bg-gray-100 cursor-pointer rounded-lg mx-1">
                      <span>Notifications</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-100 cursor-pointer rounded-lg mx-1">
                      <span>Display</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-100 cursor-pointer rounded-lg mx-1">
                      <span>Accessibility</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem
              onClick={() => router.push("/admin/activity")}
              className="hover:bg-gray-100 cursor-pointer rounded-lg mx-1"
            >
              <CheckCircle className="mr-2 h-4 w-4 stroke-[1.5]" />
              <span>Activity Log</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="hover:bg-red-50 hover:text-red-700 cursor-pointer rounded-lg mx-1"
            >
              <LogOut className="mr-2 h-4 w-4 stroke-[1.5]" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
