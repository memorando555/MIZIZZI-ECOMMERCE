import { Skeleton } from "@/components/ui/skeleton"

export function HomeLoader() {
  return (
    <div className="w-full space-y-8 py-8">
      {/* Carousel skeleton */}
      <Skeleton className="h-64 w-full rounded-lg" />

      {/* Categories skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Product sections skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
