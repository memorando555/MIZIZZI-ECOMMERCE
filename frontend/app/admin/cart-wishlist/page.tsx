"use client"

import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { adminService } from "@/services/admin"
import { ShoppingCart, Heart, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"

interface CartWishlistStats {
  cart_items_total: number
  wishlist_items_total: number
  abandoned_carts_count: number
  total_cart_value: number
  total_wishlist_value: number
  total_abandoned_value: number
  items_with_price_drop: number
}

export default function CartWishlistDashboard() {
  const router = useRouter()
  const { user } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CartWishlistStats>({
    cart_items_total: 0,
    wishlist_items_total: 0,
    abandoned_carts_count: 0,
    total_cart_value: 0,
    total_wishlist_value: 0,
    total_abandoned_value: 0,
    items_with_price_drop: 0,
  })

  useEffect(() => {
    if (!user) {
      router.push("/admin/login")
      return
    }
    fetchStats()
  }, [user, router])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [cartItems, wishlistItems, abandonedCarts] = await Promise.all([
        adminService.getCartItems(),
        adminService.getWishlistItems(),
        adminService.getAbandonedCarts(),
      ])

      const cartTotal = cartItems.items?.reduce((sum: number, item: any) => sum + item.total_price, 0) || 0
      const wishlistTotal = wishlistItems.items?.reduce((sum: number, item: any) => sum + item.current_price, 0) || 0
      const abandonedTotal = abandonedCarts.items?.reduce((sum: number, item: any) => sum + item.total_value, 0) || 0
      const priceDrops = wishlistItems.items?.filter((item: any) => item.price_drop && item.price_drop > 0).length || 0

      setStats({
        cart_items_total: cartItems.items?.length || 0,
        wishlist_items_total: wishlistItems.items?.length || 0,
        abandoned_carts_count: abandonedCarts.items?.length || 0,
        total_cart_value: cartTotal,
        total_wishlist_value: wishlistTotal,
        total_abandoned_value: abandonedTotal,
        items_with_price_drop: priceDrops,
      })
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 sm:p-8 min-h-screen">
        <Loader />
      </div>
    )
  }

  const cards = [
    {
      title: "Cart Items",
      description: "Active shopping carts",
      icon: ShoppingCart,
      stats: {
        count: stats.cart_items_total,
        value: stats.total_cart_value,
        label: "items",
      },
      color: "blue",
      href: "/admin/cart-wishlist/cart-items",
    },
    {
      title: "Wishlist Items",
      description: "Saved for later",
      icon: Heart,
      stats: {
        count: stats.wishlist_items_total,
        value: stats.total_wishlist_value,
        label: "items",
        extra: `${stats.items_with_price_drop} price drops`,
      },
      color: "red",
      href: "/admin/cart-wishlist/wishlist-items",
    },
    {
      title: "Abandoned Carts",
      description: "Recovery opportunities",
      icon: AlertTriangle,
      stats: {
        count: stats.abandoned_carts_count,
        value: stats.total_abandoned_value,
        label: "recovery value",
      },
      color: "orange",
      href: "/admin/cart-wishlist/abandoned-carts",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Cart & Wishlist Management</h1>
        <p className="text-sm text-gray-600 mt-2">Manage customer shopping carts and wishlist items</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600 border-blue-200",
            red: "bg-red-50 text-red-600 border-red-200",
            orange: "bg-orange-50 text-orange-600 border-orange-200",
          }

          return (
            <Card
              key={card.title}
              className={`${colorClasses[card.color as keyof typeof colorClasses]} border rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => router.push(card.href)}
            >
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-xl font-semibold truncate">{card.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">{card.description}</CardDescription>
                  </div>
                  <Icon className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-t border-current opacity-20" />
                <div className="space-y-2">
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xs sm:text-sm font-medium opacity-75">Total</span>
                    <span className="text-2xl sm:text-3xl font-bold">{card.stats.count}</span>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xs sm:text-sm font-medium opacity-75">Value</span>
                    <span className="text-lg sm:text-xl font-semibold">${card.stats.value.toFixed(2)}</span>
                  </div>
                  {card.stats.extra && (
                    <div className="pt-2 text-xs sm:text-sm font-medium opacity-75">{card.stats.extra}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(card.href)
                  }}
                >
                  Manage <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl font-semibold">Quick Stats</CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1">Overview of cart and wishlist activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Items in Carts</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.cart_items_total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500 flex-shrink-0 opacity-20" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Wishlist Items</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.wishlist_items_total}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500 flex-shrink-0 opacity-20" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Abandoned Carts</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.abandoned_carts_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500 flex-shrink-0 opacity-20" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Items with Price Drops</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.items_with_price_drop}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-blue-50 border border-blue-200 rounded-2xl shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-blue-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Active Carts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            <p className="mb-4">Monitor active shopping carts and customer behavior to identify trends.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/cart-wishlist/cart-items")}
              className="text-xs sm:text-sm"
            >
              View All Carts
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border border-orange-200 rounded-2xl shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-orange-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recovery Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-800">
            <p className="mb-4">
              {stats.abandoned_carts_count} abandoned carts worth ${stats.total_abandoned_value.toFixed(2)} are waiting for recovery.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/cart-wishlist/abandoned-carts")}
              className="text-xs sm:text-sm"
            >
              Recover Carts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
