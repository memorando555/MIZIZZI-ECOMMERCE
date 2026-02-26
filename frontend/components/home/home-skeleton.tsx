'use client';

import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Carousel skeleton */}
      <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-4 py-4">
        <Skeleton className="h-[200px] sm:h-[400px] rounded-lg" />
      </div>

      {/* Categories skeleton */}
      <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-4 py-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] sm:h-[160px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Premium experiences skeleton */}
      <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-4 py-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[250px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
