"use client"

import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  ShoppingBag,
  Heart,
  Gift,
  Truck,
  HelpCircle,
  Settings,
  LogOut,
  User,
  CreditCard,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState, useMemo } from "react"
import type { CategoryWithSubcategories } from "@/lib/server/get-categories"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const accountLinks = [
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Wishlist", href: "/wishlist", icon: Heart },
  { name: "Gift Cards", href: "/gift-cards", icon: Gift },
  { name: "Track Order", href: "/track-order", icon: Truck },
]

const supportLinks = [
  { name: "Help Center", href: "/help", icon: HelpCircle },
  { name: "Account Settings", href: "/settings", icon: Settings },
  { name: "Sign Out", href: "/signout", icon: LogOut },
]

interface MobileNavProps {
  categories?: CategoryWithSubcategories[]
  loading?: boolean
}

export function MobileNav({ categories: serverCategories = [], loading = false }: MobileNavProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  // Use server categories directly - no loading state needed
  const categories = useMemo(() => serverCategories, [serverCategories])

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Simple fade-in animation for initial load
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2, staggerChildren: 0.02 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } },
  }

  // Smooth expand animation for subcategories
  const expandVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.15 },
    },
  }

  return (
    <motion.div className="flex h-full flex-col bg-white" variants={containerVariants} initial="hidden" animate="visible">
      <SheetHeader className="border-b px-6 py-4">
        <SheetTitle>
          <motion.div className="flex items-center gap-2" variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-10 w-10 overflow-hidden rounded-lg bg-gradient-to-br from-cherry-800 to-cherry-900 p-0.5"
            >
              <Link href="/" className="block h-full w-full">
                <div className="h-full w-full rounded-lg bg-white p-2">
                  <Image
                    src="/images/screenshot-20from-202025-02-18-2013-30-22.png"
                    alt="MIZIZZI"
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>
              </Link>
            </motion.div>
            <span className="text-lg font-bold">MIZIZZI</span>
          </motion.div>
        </SheetTitle>
        <SheetDescription>Browse categories and manage your account</SheetDescription>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          {/* Quick Links */}
          <motion.div className="grid grid-cols-2 gap-4" variants={itemVariants}>
            <Link href="/account" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <User className="h-5 w-5 text-cherry-600" />
              <div className="text-sm font-medium">Account</div>
            </Link>
            <Link href="/orders" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <Clock className="h-5 w-5 text-cherry-600" />
              <div className="text-sm font-medium">Orders</div>
            </Link>
            <Link href="/payments" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <CreditCard className="h-5 w-5 text-cherry-600" />
              <div className="text-sm font-medium">Payments</div>
            </Link>
            <Link href="/reviews" className="flex items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <Star className="h-5 w-5 text-cherry-600" />
              <div className="text-sm font-medium">Reviews</div>
            </Link>
          </motion.div>

          <motion.div className="mb-4" variants={itemVariants}>
            <Link
              href="/categories"
              className="flex items-center justify-between w-full p-3 rounded-lg bg-cherry-50 hover:bg-cherry-100 transition-colors"
            >
              <span className="text-sm font-semibold text-cherry-800">Browse All Categories</span>
              <ChevronRight className="h-4 w-4 text-cherry-600" />
            </Link>
          </motion.div>

          {/* Categories */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-3 text-sm font-semibold">Shop by Category</h3>
            {loading ? (
              <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div key={i} className="h-10 bg-gray-200 rounded animate-pulse" variants={itemVariants} />
                ))}
              </motion.div>
            ) : categories.length > 0 ? (
              <motion.div className="space-y-1" variants={containerVariants} initial="hidden" animate="visible">
                {categories.slice(0, 10).map((category) => (
                  <motion.div key={category.id} variants={itemVariants}>
                    <Collapsible
                      open={expandedCategories.has(category.id)}
                      onOpenChange={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Link
                          href={`/category/${category.slug}`}
                          className="flex-1 text-sm font-medium hover:text-cherry-600 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {category.image_url && (
                                <div className="h-6 w-6 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                                  <img
                                    src={category.image_url || "/placeholder.svg"}
                                    alt={category.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <span>{category.name}</span>
                            </div>
                            {category.product_count && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {category.product_count}
                              </span>
                            )}
                          </div>
                        </Link>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2 transition-transform">
                              <motion.div
                                animate={{ rotate: expandedCategories.has(category.id) ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </motion.div>
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </div>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <CollapsibleContent asChild>
                          <motion.div
                            variants={expandVariants}
                            initial="hidden"
                            animate={expandedCategories.has(category.id) ? "visible" : "hidden"}
                            exit="exit"
                            className="ml-4 mt-1 overflow-hidden"
                          >
                            <div className="space-y-1 border-l-2 border-gray-100 pl-3">
                              {category.subcategories.slice(0, 8).map((subcategory) => (
                                <Link
                                  key={subcategory.id}
                                  href={`/category/${subcategory.slug}`}
                                  className="block text-xs text-muted-foreground hover:text-cherry-600 py-1.5 px-2 rounded hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{subcategory.name}</span>
                                    {subcategory.product_count && (
                                      <span className="text-gray-400">({subcategory.product_count})</span>
                                    )}
                                  </div>
                                </Link>
                              ))}
                              {category.subcategories.length > 8 && (
                                <Link
                                  href={`/category/${category.slug}`}
                                  className="block text-xs text-cherry-600 font-medium py-1.5 px-2 rounded hover:bg-cherry-50 transition-colors"
                                >
                                  View all {category.name} →
                                </Link>
                              )}
                            </div>
                          </motion.div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </motion.div>
                ))}

                {categories.length > 10 && (
                  <motion.div className="pt-2 mt-3 border-t border-gray-100" variants={itemVariants}>
                    <Link
                      href="/categories"
                      className="flex items-center justify-center w-full p-2 text-sm font-medium text-cherry-600 hover:text-cherry-700 hover:bg-cherry-50 rounded-lg transition-colors"
                    >
                      View All Categories
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div className="text-sm text-gray-500 py-4 text-center" variants={itemVariants}>
                No categories available at the moment.
              </motion.div>
            )}
          </motion.div>

          <Separator />

          {/* Account Links */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-2 text-sm font-semibold">My Account</h3>
            <div className="space-y-2">
              {accountLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg py-2 text-sm hover:text-cherry-600 transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>

          <Separator />

          {/* Support Links */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-2 text-sm font-semibold">Support</h3>
            <div className="space-y-2">
              {supportLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg py-2 text-sm hover:text-cherry-600 transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </ScrollArea>
    </motion.div>
  )
}
