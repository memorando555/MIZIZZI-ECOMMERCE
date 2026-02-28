import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInventoryStats } from "@/lib/server-inventory"
import { Package, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Clock } from "lucide-react"

export async function InventoryStatsServer() {
  const stats = await getInventoryStats()

  const statCards = [
    {
      title: "Total Items",
      value: stats.total_items.toLocaleString(),
      icon: Package,
      color: "from-blue-50 to-blue-100",
      textColor: "text-blue-600",
    },
    {
      title: "In Stock",
      value: stats.in_stock.toLocaleString(),
      icon: TrendingUp,
      color: "from-green-50 to-green-100",
      textColor: "text-green-600",
    },
    {
      title: "Low Stock",
      value: stats.low_stock.toLocaleString(),
      icon: AlertTriangle,
      color: "from-orange-50 to-orange-100",
      textColor: "text-orange-600",
    },
    {
      title: "Out of Stock",
      value: stats.out_of_stock.toLocaleString(),
      icon: TrendingDown,
      color: "from-red-50 to-red-100",
      textColor: "text-red-600",
    },
    {
      title: "Reserved",
      value: stats.reserved_quantity.toLocaleString(),
      icon: Clock,
      color: "from-purple-50 to-purple-100",
      textColor: "text-purple-600",
    },
    {
      title: "Total Value",
      value: `KSh ${(stats.total_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "from-indigo-50 to-indigo-100",
      textColor: "text-indigo-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className={`bg-gradient-to-br ${stat.color} border-0 shadow-sm`}>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
