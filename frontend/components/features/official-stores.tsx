import Link from "next/link"
import { UniversalImage } from "@/components/shared/universal-image"

// Optimized store logos with Cloudinary URLs or placeholder fallbacks
// Each logo is pre-optimized for fast loading with proper sizing
const officialStores = [
  {
    name: "Pandora",
    logo: "https://res.cloudinary.com/mizizzi/image/upload/w_100,h_100,c_fill,q_75,f_auto/stores/pandora-logo",
    href: "/store/pandora",
  },
  {
    name: "Swarovski",
    logo: "https://res.cloudinary.com/mizizzi/image/upload/w_100,h_100,c_fill,q_75,f_auto/stores/swarovski-logo",
    href: "/store/swarovski",
  },
  {
    name: "Zara",
    logo: "https://res.cloudinary.com/mizizzi/image/upload/w_100,h_100,c_fill,q_75,f_auto/stores/zara-logo",
    href: "/store/zara",
  },
  {
    name: "H&M",
    logo: "https://res.cloudinary.com/mizizzi/image/upload/w_100,h_100,c_fill,q_75,f_auto/stores/hm-logo",
    href: "/store/hm",
  },
  {
    name: "Cartier",
    logo: "https://res.cloudinary.com/mizizzi/image/upload/w_100,h_100,c_fill,q_75,f_auto/stores/cartier-logo",
    href: "/store/cartier",
  },
  {
    name: "Tiffany & Co",
    logo: "https://res.cloudinary.com/mizizzi/image/upload/w_100,h_100,c_fill,q_75,f_auto/stores/tiffany-logo",
    href: "/store/tiffany",
  },
]

export function OfficialStores() {
  return (
    <div className="rounded-lg bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Official Stores</h2>
        <a href="/official-stores" className="text-sm font-medium text-primary hover:underline">
          SEE ALL
        </a>
      </div>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {officialStores.map((store) => (
          <Link
            key={store.name}
            href={store.href}
            className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full border">
              <UniversalImage
                src={store.logo || "/placeholder.svg"}
                alt={store.name}
                width={100}
                height={100}
                objectFit="cover"
                quality={75}
                sizes="100px"
              />
            </div>
            <span className="text-center text-sm font-medium">{store.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
