export default function NewArrivalsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container py-8 px-4 sm:px-6 lg:px-8">
        <div className="h-[300px] bg-neutral-200 animate-pulse mb-8 rounded-2xl"></div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="bg-white rounded-2xl p-3 shadow-sm">
              <div className="aspect-square bg-neutral-100 animate-pulse rounded-xl mb-3"></div>
              <div className="h-3 w-16 bg-neutral-100 rounded-full animate-pulse mb-2"></div>
              <div className="h-4 w-full bg-neutral-100 rounded-full animate-pulse mb-2"></div>
              <div className="h-5 w-20 bg-neutral-100 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
