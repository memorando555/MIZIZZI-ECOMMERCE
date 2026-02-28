"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  MoreHorizontal,
  Heart,
  Clock,
  DollarSign,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { adminService } from "@/services/admin"
import { toast } from "@/components/ui/use-toast"
import { useAdminAuth } from "@/contexts/admin/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface WishlistItem {
  id: string
  user_id: string
  user_name: string
  user_email: string
  product_id: string
  product_name: string
  product_image?: string
  original_price: number
  current_price: number
  price_drop?: number
  added_at: string
  updated_at: string
}

interface WishlistItemsResponse {
  items: WishlistItem[]
  total: number
  page: number
  limit: number
}

export default function WishlistItemsPage() {
  const router = useRouter()
  const { user } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<WishlistItem[]>([])
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!user) {
      router.push("/admin/login")
      return
    }
    fetchWishlistItems()
  }, [user, router])

  const fetchWishlistItems = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminService.getWishlistItems()
      setItems(response.items || [])
    } catch (error) {
      console.error("[v0] Error fetching wishlist items:", error)
      toast({ title: "Error", description: "Failed to fetch wishlist items", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter items based on search query
  useEffect(() => {
    const filtered = items.filter(
      (item) =>
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user_email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredItems(filtered)
    setCurrentPage(1)
  }, [searchQuery, items])

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, currentPage])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(paginatedItems.map((item) => item.id)))
    }
  }

  const handleDeleteClick = (item: WishlistItem) => {
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await adminService.deleteWishlistItem(itemToDelete.id)
      toast({ title: "Success", description: "Wishlist item deleted successfully" })
      setItems(items.filter((i) => i.id !== itemToDelete.id))
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error("[v0] Error deleting wishlist item:", error)
      toast({ title: "Error", description: "Failed to delete wishlist item", variant: "destructive" })
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedItems.size === 0) return
    try {
      await Promise.all(
        Array.from(selectedItems).map((itemId) =>
          adminService.deleteWishlistItem(itemId)
        )
      )
      toast({ title: "Success", description: `${selectedItems.size} wishlist items deleted` })
      setItems(items.filter((i) => !selectedItems.has(i.id)))
      setSelectedItems(new Set())
    } catch (error) {
      console.error("[v0] Error deleting wishlist items:", error)
      toast({ title: "Error", description: "Failed to delete some wishlist items", variant: "destructive" })
    }
  }

  const viewItemDetails = (item: WishlistItem) => {
    setSelectedItem(item)
    setDetailsOpen(true)
  }

  const itemsWithPriceDrop = items.filter((item) => item.price_drop && item.price_drop > 0).length
  const totalWishlistValue = items.reduce((sum, item) => sum + item.current_price, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 sm:p-8 min-h-screen">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wishlist Items</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {items.length} items • {itemsWithPriceDrop} price drops • Total value: ${totalWishlistValue.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWishlistItems}
            className="text-xs sm:text-sm gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase truncate">Total Items</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">{items.length}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase truncate">Price Drops</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">{itemsWithPriceDrop}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase truncate">Total Value</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">${totalWishlistValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by product name, customer name, or email..."
                className="pl-10 text-xs sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMultiple}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedItems.size} Items
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-8 text-xs">
                    <Checkbox
                      checked={selectedItems.size === paginatedItems.length && paginatedItems.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold">Product</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold">Customer</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Original</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Current</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Drop</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold">Added</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs sm:text-sm text-gray-500">
                      No wishlist items found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => handleSelectItem(item.id)}
                        />
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm font-medium truncate">{item.product_name}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="truncate">{item.user_name}</div>
                        <div className="text-xs text-gray-500 truncate">{item.user_email}</div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-right">${item.original_price.toFixed(2)}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-right font-semibold">${item.current_price.toFixed(2)}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-right">
                        {item.price_drop ? (
                          <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                            -{(item.price_drop * 100).toFixed(0)}%
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-gray-600">
                        {new Date(item.added_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs sm:text-sm">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewItemDetails(item)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <Pagination>
                <PaginationContent className="gap-1">
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(currentPage - 1)} className="cursor-pointer text-xs sm:text-sm">
                        Previous
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer text-xs sm:text-sm"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(currentPage + 1)} className="cursor-pointer text-xs sm:text-sm">
                        Next
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-md max-h-screen overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Wishlist Item Details</SheetTitle>
            <SheetDescription>View and manage wishlist item information</SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <div className="space-y-6 mt-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Product Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Product Name</p>
                    <p className="text-sm font-medium">{selectedItem.product_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Product ID</p>
                    <p className="text-sm font-medium">{selectedItem.product_id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Original Price</p>
                      <p className="text-sm font-medium">${selectedItem.original_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Current Price</p>
                      <p className="text-sm font-medium">${selectedItem.current_price.toFixed(2)}</p>
                    </div>
                  </div>
                  {selectedItem.price_drop && (
                    <div>
                      <p className="text-xs text-gray-600">Price Drop</p>
                      <p className="text-sm font-semibold text-green-600">{(selectedItem.price_drop * 100).toFixed(1)}% off</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Customer Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Customer Name</p>
                    <p className="text-sm font-medium">{selectedItem.user_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm font-medium break-all">{selectedItem.user_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">User ID</p>
                    <p className="text-sm font-medium">{selectedItem.user_id}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Timeline</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Added to Wishlist</p>
                    <p className="text-sm font-medium">{formatDate(selectedItem.added_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Last Updated</p>
                    <p className="text-sm font-medium">{formatDate(selectedItem.updated_at)}</p>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  handleDeleteClick(selectedItem)
                  setDetailsOpen(false)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Item
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Wishlist Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this wishlist item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {itemToDelete && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{itemToDelete.product_name}</p>
                <p className="text-xs text-gray-600 mt-1">{itemToDelete.user_name}</p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs font-semibold text-gray-500 line-through">${itemToDelete.original_price.toFixed(2)}</span>
                  <span className="text-sm font-semibold text-gray-900">${itemToDelete.current_price.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
