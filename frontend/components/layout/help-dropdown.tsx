"use client"

import type React from "react"
import { HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function HelpDropdown({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter()

  const handleHelp = () => {
    router.push("/help")
  }

  return (
    <>
      {trigger ? (
        <div onClick={handleHelp} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant="ghost"
          onClick={handleHelp}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="text-sm font-medium hidden lg:inline">Help</span>
        </Button>
      )}
    </>
  )
}
