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
  Send,
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface AbandonedCart {
  id: string
  user_id: string
  user_name: string
  user_email: string
  items_count: number
  total_value: number
  abandoned_at: string
  last_activity: string
  recovery_emails_sent: number
}

interface AbandonedCartsResponse {
  items: AbandonedCart[]
  total: number
  page: number
  limit: number
}

export default function AbandonedCartsPage() {
  const router = useRouter()
  const { user } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<AbandonedCart[]>([])
  const [filteredItems, setFilteredItems] = useState<AbandonedCart[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<AbandonedCart | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<AbandonedCart | null>(null)
  const [recoveryEmailOpen, setRecoveryEmailOpen] = useState(false)
  const [emailContent, setEmailContent] = useState("")
  const [emailRecipient, setEmailRecipient] = useState<AbandonedCart | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!user) {
      router.push("/admin/login")
      return
    }
    fetchAbandonedCarts()
  }, [user, router])

  const fetchAbandonedCarts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminService.getAbandonedCarts()
      setItems(response.items || [])
    } catch (error) {
      console.error("[v0] Error fetching abandoned carts:", error)
      toast({ title: "Error", description: "Failed to fetch abandoned carts", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter items based on search query
  useEffect(() => {
    const filtered = items.filter(
      (item) =>
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

  const handleDeleteClick = (item: AbandonedCart) => {
    setItemToDelete(item)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await adminService.deleteAbandonedCart(itemToDelete.id)
      toast({ title: "Success", description: "Abandoned cart deleted successfully" })
      setItems(items.filter((i) => i.id !== itemToDelete.id))
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error("[v0] Error deleting abandoned cart:", error)
      toast({ title: "Error", description: "Failed to delete abandoned cart", variant: "destructive" })
    }
  }

  const handleDeleteMultiple = async () => {
    if (selectedItems.size === 0) return
    try {
      await Promise.all(
        Array.from(selectedItems).map((itemId) =>
          adminService.deleteAbandonedCart(itemId)
        )
      )
      toast({ title: "Success", description: `${selectedItems.size} abandoned carts deleted` })
      setItems(items.filter((i) => !selectedItems.has(i.id)))
      setSelectedItems(new Set())
    } catch (error) {
      console.error("[v0] Error deleting abandoned carts:", error)
      toast({ title: "Error", description: "Failed to delete some abandoned carts", variant: "destructive" })
    }
  }

  const viewItemDetails = (item: AbandonedCart) => {
    setSelectedItem(item)
    setDetailsOpen(true)
  }

  const handleSendRecoveryEmail = (item: AbandonedCart) => {
    setEmailRecipient(item)
    setEmailContent(
      `Hi ${item.user_name},\n\nWe noticed you left some items in your cart. Here's a quick reminder of what you wanted:\n\n${item.items_count} items worth $${item.total_value.toFixed(2)}\n\nDon't miss out! Complete your purchase now.\n\nBest regards,\nMizizzi Team`
    )
    setRecoveryEmailOpen(true)
  }

  const handleSendEmail = async () => {
    if (!emailRecipient) return
    try {
      await adminService.sendRecoveryEmail(emailRecipient.id, emailContent)
      toast({ title: "Success", description: "Recovery email sent successfully" })
      setRecoveryEmailOpen(false)
      setEmailRecipient(null)
      setEmailContent("")
      // Update the recovery email count
      setItems(
        items.map((item) =>
          item.id === emailRecipient.id
            ? { ...item, recovery_emails_sent: item.recovery_emails_sent + 1 }
            : item
        )
      )
    } catch (error) {
      console.error("[v0] Error sending recovery email:", error)
      toast({ title: "Error", description: "Failed to send recovery email", variant: "destructive" })
    }
  }

  const totalAbandonedValue = items.reduce((sum, item) => sum + item.total_value, 0)
  const daysSinceAbandonment = (item: AbandonedCart) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(item.abandoned_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Abandoned Carts</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {items.length} abandoned • Total value: ${totalAbandonedValue.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAbandonedCarts}
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
                <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase truncate">Total Abandoned</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">{items.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase truncate">Total Value</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">${totalAbandonedValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase truncate">Avg Recovery Emails</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">
                  {items.length > 0 
                    ? (items.reduce((sum, item) => sum + item.recovery_emails_sent, 0) / items.length).toFixed(1)
                    : "0"}
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-500 flex-shrink-0" />
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
                placeholder="Search by customer name or email..."
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
                Delete {selectedItems.size} Carts
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
                  <TableHead className="text-xs sm:text-sm font-semibold">Customer</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Items</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-right">Value</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold">Abandoned</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-center">Emails</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs sm:text-sm text-gray-500">
                      No abandoned carts found
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
                      <TableCell className="text-xs sm:text-sm">
                        <div className="font-medium truncate">{item.user_name}</div>
                        <div className="text-xs text-gray-500 truncate">{item.user_email}</div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm text-right font-medium">{item.items_count}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-right font-semibold">${item.total_value.toFixed(2)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge variant="outline" className="text-xs">
                          {daysSinceAbandonment(item)}d ago
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs sm:text-sm font-medium">{item.recovery_emails_sent}</span>
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
                            <DropdownMenuItem onClick={() => handleSendRecoveryEmail(item)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Recovery Email
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
            <SheetTitle>Abandoned Cart Details</SheetTitle>
            <SheetDescription>View and manage abandoned cart information</SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <div className="space-y-6 mt-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Cart Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Items in Cart</p>
                    <p className="text-sm font-medium">{selectedItem.items_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Cart Total Value</p>
                    <p className="text-lg font-semibold text-green-600">${selectedItem.total_value.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Days Since Abandoned</p>
                    <p className="text-sm font-medium">{daysSinceAbandonment(selectedItem)} days</p>
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
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Recovery Attempts</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Recovery Emails Sent</p>
                    <p className="text-sm font-medium">{selectedItem.recovery_emails_sent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Abandoned At</p>
                    <p className="text-sm font-medium">{formatDate(selectedItem.abandoned_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Last Activity</p>
                    <p className="text-sm font-medium">{formatDate(selectedItem.last_activity)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleSendRecoveryEmail(selectedItem)
                    setDetailsOpen(false)
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Recovery Email
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    handleDeleteClick(selectedItem)
                    setDetailsOpen(false)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Recovery Email Dialog */}
      <Dialog open={recoveryEmailOpen} onOpenChange={setRecoveryEmailOpen}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Recovery Email</DialogTitle>
            <DialogDescription>
              Send a recovery email to {emailRecipient?.user_name} to remind them about their abandoned cart.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {emailRecipient && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Recipient</p>
                    <p className="text-sm font-medium">{emailRecipient.user_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Cart Value</p>
                    <p className="text-sm font-medium">${emailRecipient.total_value.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email-content" className="text-sm font-semibold mb-2 block">
                Email Content
              </Label>
              <Textarea
                id="email-content"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Enter the email content..."
                className="min-h-40 text-xs sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecoveryEmailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Abandoned Cart</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this abandoned cart? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {itemToDelete && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">{itemToDelete.user_name}</p>
                <p className="text-xs text-gray-600 mt-1">{itemToDelete.user_email}</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">${itemToDelete.total_value.toFixed(2)} • {itemToDelete.items_count} items</p>
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
