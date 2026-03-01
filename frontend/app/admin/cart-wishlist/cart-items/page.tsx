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
  ShoppingCart,
  Clock,
  DollarSign,
  Loader2,
  AlertCircle,
  Mail,
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

interface CartItem {
  id: string
  user_id: string
  user_name: string
  user_email: string
  product_name: string
  product_id: string
  quantity: number
  price: number
  total_price: number
  added_at: string
  updated_at: string
}

interface CartItemsResponse {
  items: CartItem[]
  total: number
  page: number
  limit: number
}

export default function CartItemsPage() {
  const router = useRouter()
  const { user } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<CartItem[]>([])
  const [filteredItems, setFilteredItems] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!user) {
      router.push("/admin/login")
      return
    }
    fetchCartItems()
  }, [user, router])

  const fetchCartItems = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminService.getCartItems()
      setItems(response.items || [])
    } catch (error) {
      console.error("[v0] Error fetching cart items:", error)
      toast({ title: "Error", description: "Failed to fetch cart items", variant: "destructive" })
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

  const handleDeleteClick = (item: CartItem) => {
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await adminService.deleteCartItem(itemToDelete.id)
      toast({ title: "Success", description: "Cart item deleted successfully" })
      setItems(items.filter((i) => i.id !== itemToDelete.id))
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error("[v0] Error deleting cart item:", error)
      toast({ title: "Error", description: "Failed to delete cart item", variant: "destructive" })
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedItems.size === 0) return
    try {
      await Promise.all(
        Array.from(selectedItems).map((itemId) =>
          adminService.deleteCartItem(itemId)
        )
      )
      toast({ title: "Success", description: `${selectedItems.size} cart items deleted` })
      setItems(items.filter((i) => !selectedItems.has(i.id)))
      setSelectedItems(new Set())
    } catch (error) {
      console.error("[v0] Error deleting cart items:", error)
      toast({ title: "Error", description: "Failed to delete some cart items", variant: "destructive" })
    }
  }

  const viewItemDetails = (item: CartItem) => {
    setSelectedItem(item)
    setDetailsOpen(true)
  }

  const totalCartValue = items.reduce((sum, item) => sum + item.total_price, 0)

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cart Items</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{items.length} items • Total value: ${totalCartValue.toFixed(2)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCartItems}
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
                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Qty</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Price</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold">Added</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs sm:text-sm text-gray-500">
                      No cart items found
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
                      <TableCell className="text-xs sm:text-sm text-right font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-right font-semibold">${item.total_price.toFixed(2)}</TableCell>
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
            <SheetTitle>Cart Item Details</SheetTitle>
            <SheetDescription>View and manage cart item information</SheetDescription>
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
                      <p className="text-xs text-gray-600">Quantity</p>
                      <p className="text-sm font-medium">{selectedItem.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Unit Price</p>
                      <p className="text-sm font-medium">${selectedItem.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Price</p>
                    <p className="text-lg font-semibold text-green-600">${selectedItem.total_price.toFixed(2)}</p>
                  </div>
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
                    <p className="text-xs text-gray-600">Added to Cart</p>
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
            <DialogTitle>Delete Cart Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this cart item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {itemToDelete && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{itemToDelete.product_name}</p>
                <p className="text-xs text-gray-600 mt-1">{itemToDelete.user_name}</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">${itemToDelete.total_price.toFixed(2)}</p>
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
