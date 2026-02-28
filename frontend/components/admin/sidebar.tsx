"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useOnClickOutside } from "@/hooks/use-on-click-outside"
import { useMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

// Icons
import Image from "next/image"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
  Boxes,
  ShoppingCart,
  Sliders,
  Palette,
  Layout,
  ListTree,
  Megaphone,
  PhoneCall,
} from "lucide-react"

interface AdminSidebarProps {
  isCollapsed: boolean
  toggleSidebar: () => void
}

// Define types for menu items
interface SubMenuItem {
  title: string
  path: string
  badge?: number | string
}

interface MenuItem {
  title: string
  icon: React.ReactNode
  path: string
  badge?: number | string | null
  submenu?: SubMenuItem[]
}

// Animation variants
const sidebarVariants = {
  expanded: { width: "260px" },
  collapsed: { width: "64px" },
}

const menuItemVariants = {
  expanded: { opacity: 1, x: 0 },
  collapsed: { opacity: 0, x: -10 },
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    path: "/admin",
    badge: null,
  },
  {
    title: "Orders",
    icon: <ShoppingBag size={20} />,
    path: "/admin/orders",
    badge: 12,
    submenu: [
      { title: "All Orders", path: "/admin/orders" },
      { title: "Pending", path: "/admin/orders/pending", badge: 5 },
      { title: "Processing", path: "/admin/orders/processing", badge: 3 },
      { title: "Completed", path: "/admin/orders/completed" },
      { title: "Cancelled", path: "/admin/orders/cancelled" },
      { title: "Returns", path: "/admin/orders/returns", badge: 2 },
      { title: "Invoices", path: "/admin/orders/invoices" },
      { title: "Order Tracking", path: "/admin/orders/tracking" },
    ],
  },
  {
    title: "Products",
    icon: <Package size={20} />,
    path: "/admin/products",
    submenu: [
      { title: "All Products", path: "/admin/products" },
      { title: "Reviews", path: "/admin/reviews", badge: 15 },
    ],
  },
  {
    title: "Shop Categories",
    icon: <Boxes size={20} />,
    path: "/admin/shop-categories",
    submenu: [
      { title: "All Categories", path: "/admin/shop-categories" },
      { title: "Add New", path: "/admin/shop-categories/new" },
      { title: "Featured", path: "/admin/shop-categories?featured=true" },
    ],
  },
  {
    title: "Carousel",
    icon: <Sliders size={20} />,
    path: "/admin/carousel",
    badge: "Featured",
    submenu: [
      { title: "All Carousels", path: "/admin/carousel" },
      { title: "Homepage", path: "/admin/carousel?position=homepage" },
      { title: "Category Pages", path: "/admin/carousel?position=category_page" },
      { title: "Flash Sales", path: "/admin/carousel?position=flash_sales" },
      { title: "Luxury Deals", path: "/admin/carousel?position=luxury_deals" },
      { title: "Analytics", path: "/admin/carousel/analytics" },
    ],
  },
  {
    title: "Top Bar",
    icon: <Megaphone size={20} />,
    path: "/admin/topbar",
    badge: "New",
  },
  {
    title: "Contact CTA",
    icon: <PhoneCall size={20} />,
    path: "/admin/contact-cta",
    badge: null,
  },
  {
    title: "Side Panels",
    icon: <Layout size={20} />,
    path: "/admin/side-panels",
    badge: null,
  },
  {
    title: "Footer Management",
    icon: <ListTree size={20} />,
    path: "/admin/footer",
    badge: null,
  },
  {
    title: "Inventory",
    icon: <Boxes size={20} />,
    path: "/admin/inventory",
    badge: 8,
    submenu: [
      { title: "Stock Management", path: "/admin/inventory" },
      { title: "Low Stock", path: "/admin/inventory/low-stock", badge: 8 },
      { title: "Stock History", path: "/admin/inventory/history" },
      { title: "Stock Adjustments", path: "/admin/inventory/adjustments" },
      { title: "Warehouse", path: "/admin/inventory/warehouse" },
    ],
  },
  {
    title: "Customers",
    icon: <Users size={20} />,
    path: "/admin/customers",
    submenu: [
      { title: "All Customers", path: "/admin/customers" },
      { title: "Customer Groups", path: "/admin/customer-groups" },
      { title: "Addresses", path: "/admin/addresses" },
      { title: "Verification", path: "/admin/customers/verification" },
      { title: "Customer Profiles", path: "/admin/customers/profiles" },
    ],
  },
  {
    title: "Cart & Wishlist",
    icon: <ShoppingCart size={20} />,
    path: "/admin/cart-wishlist",
    submenu: [
      { title: "Cart Items", path: "/admin/cart-wishlist/cart-items" },
      { title: "Abandoned Carts", path: "/admin/cart-wishlist/abandoned-carts", badge: 7 },
      { title: "Wishlist Items", path: "/admin/cart-wishlist/wishlist-items" },
      { title: "Dashboard", path: "/admin/cart-wishlist" },
    ],
  },
  {
    title: "Settings",
    icon: <Settings size={20} />,
    path: "/admin/settings",
    submenu: [
      { title: "General", path: "/admin/settings" },
      { title: "Store", path: "/admin/settings/store" },
      { title: "Users & Permissions", path: "/admin/settings/users" },
      { title: "Taxes", path: "/admin/settings/taxes" },
      { title: "Integrations", path: "/admin/settings/integrations" },
      { title: "Localization", path: "/admin/settings/localization" },
      { title: "Sound Settings", path: "/admin/settings/sound" },
    ],
  },
  {
    title: "Theme",
    icon: <Palette size={20} />,
    path: "/admin/theme",
    badge: "Styling",
    submenu: [
      { title: "Theme Editor", path: "/admin/theme" },
      { title: "Color Palette", path: "/admin/theme" },
      { title: "Design Preview", path: "/admin/theme" },
    ],
  },
]

export function AdminSidebar({ isCollapsed, toggleSidebar }: AdminSidebarProps) {
  const pathFromRouter = usePathname()
  const pathname = pathFromRouter || "" // Ensure pathname is never null
  const router = useRouter()
  const isMobile = useMobile()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Initialize open menus based on current path
  useEffect(() => {
    const newOpenMenus: Record<string, boolean> = {}

    menuItems.forEach((item) => {
      if (item.submenu) {
        const isActive = item.submenu.some(
          (subItem) => pathname === subItem.path || pathname.startsWith(subItem.path + "/"),
        )
        if (isActive) {
          newOpenMenus[item.title] = true
        }
      }
    })

    setOpenMenus(newOpenMenus)
  }, [pathname])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close sidebar when clicking outside on mobile
  useOnClickOutside(sidebarRef, () => {
    if (isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  })

  const handleLogout = () => {
    // Implement logout functionality
    router.push("/admin/login")
  }

  const toggleSubmenu = (title: string) => {
    if (isCollapsed) return

    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const isActive = (path: string) => {
    if (path === "/admin/dashboard" && pathname === "/admin/dashboard") {
      return true
    }
    if (path === "/admin" && pathname === "/admin") {
      return true
    }
    return pathname.startsWith(path) && path !== "/admin" && path !== "/admin/dashboard"
  }

  const isSubmenuActive = (item: MenuItem) => {
    if (!item.submenu) return false
    return item.submenu.some((subItem) => pathname === subItem.path || pathname.startsWith(subItem.path + "/"))
  }

  const renderMenuItems = () => {
    return menuItems.map((item, index) => (
      <div key={index} className="mb-1">
        <div
          className={cn(
            "flex items-center rounded-md cursor-pointer transition-colors duration-200",
            isActive(item.path) || isSubmenuActive(item)
              ? "bg-cherry-50 text-cherry-600 dark:bg-cherry-900/20 dark:text-cherry-400"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300",
            isCollapsed ? "justify-center py-2 px-0" : "py-2 px-3",
          )}
          onClick={() => (item.submenu ? toggleSubmenu(item.title) : router.push(item.path))}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center w-full" : "w-full")}>
            <span className={cn("flex-shrink-0", isCollapsed ? "" : "mr-3")}>{item.icon}</span>

            {!isCollapsed && (
              <>
                <span className="flex-grow font-medium text-sm">{item.title}</span>

                {item.badge && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-cherry-100 text-xs font-medium text-cherry-600 px-1.5 dark:bg-cherry-900/50 dark:text-cherry-300">
                    {item.badge}
                  </span>
                )}

                {item.submenu && (
                  <ChevronDown
                    size={16}
                    className={cn(
                      "ml-1 transition-transform duration-200",
                      openMenus[item.title] ? "transform rotate-180" : "",
                    )}
                  />
                )}
              </>
            )}

            {isCollapsed && item.badge && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-medium text-white">
                {typeof item.badge === "number" ? (item.badge > 9 ? "9+" : item.badge) : item.badge}
              </span>
            )}
          </div>
        </div>

        {!isCollapsed && item.submenu && openMenus[item.title] && (
          <div className="mt-1 ml-7 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-1">
            {item.submenu.map((subItem, subIndex) => (
              <Link
                key={subIndex}
                href={subItem.path}
                className={cn(
                  "flex items-center text-xs py-2 px-3 rounded-md transition-colors duration-200",
                  pathname === subItem.path || pathname.startsWith(subItem.path + "/")
                    ? "bg-cherry-50 text-cherry-600 font-medium dark:bg-cherry-900/20 dark:text-cherry-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60 mr-2"></span>
                <span>{subItem.title}</span>
                {subItem.badge && (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-cherry-100 text-[10px] font-medium text-cherry-600 px-1 dark:bg-cherry-900/50 dark:text-cherry-300">
                    {subItem.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    ))
  }

  // Mobile sidebar implementation
  if (isMobile) {
    return (
      <>
        {/* Mobile toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 md:hidden h-9 w-9 rounded-md bg-white shadow-md border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={20} />
        </Button>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                ref={sidebarRef}
                className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl z-50 flex flex-col"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white dark:bg-slate-800 p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                      <Image
                        src="/images/screenshot-20from-202025-02-18-2013-30-22.png"
                        alt="Mizizzi Logo"
                        width={32}
                        height={32}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="ml-2 text-lg font-bold">
                      Mizizzi{" "}
                      <span className="text-xs bg-gradient-to-r from-orange-600 to-orange-700 text-white px-1.5 py-0.5 rounded-sm font-medium">
                        Admin
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X size={18} />
                  </Button>
                </div>

                <div className="px-3 py-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1 px-3 py-2">{renderMenuItems()}</ScrollArea>

                <div className="mt-auto border-t border-gray-200 dark:border-gray-800 p-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} className="mr-2" />
                    <span>Logout</span>
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop sidebar
  return (
    <TooltipProvider>
      <motion.div
        className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ duration: 0.2 }}
      >
        <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <div
            className={cn("flex items-center cursor-pointer", isCollapsed ? "justify-center w-full" : "")}
            onClick={toggleSidebar}
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white dark:bg-slate-800 p-1 shadow-sm border border-slate-200 dark:border-slate-700">
              <Image
                src="/images/screenshot-20from-202025-02-18-2013-30-22.png"
                alt="Mizizzi Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>

            {!isCollapsed && <span className="ml-2 text-lg font-bold">Mizizzi Admin</span>}
          </div>
        </div>

        {!isCollapsed && (
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500"
              />
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 px-3 py-2">{renderMenuItems()}</ScrollArea>

        <div className="mt-auto border-t border-gray-200 dark:border-gray-800 p-3">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full h-9 justify-center" onClick={handleLogout}>
                  <LogOut size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-2" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
