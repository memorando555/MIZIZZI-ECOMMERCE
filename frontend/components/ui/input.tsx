import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, value, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-14 w-full rounded-none border-none bg-transparent px-0 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none border-b-2 border-b-gray-200 focus-visible:border-b-cherry-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus-visible:bg-transparent",
        className,
      )}
      ref={ref}
      value={value !== undefined && value !== null ? value : undefined}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
