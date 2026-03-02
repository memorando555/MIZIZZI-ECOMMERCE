"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

// Enhanced overlay with proper z-index and visibility
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/50 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "transition-opacity duration-300",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// Responsive dialog content - centered and visible on all screen sizes
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Fixed positioning centered on screen
        "fixed left-1/2 top-1/2 z-50",
        "translate-x-[-50%] translate-y-[-50%]",
        
        // Size and max constraints
        "w-full mx-4 max-w-2xl",
        "rounded-2xl",
        "bg-white dark:bg-slate-950",
        "shadow-2xl dark:shadow-2xl",
        "border border-gray-200 dark:border-slate-800",
        
        // Content layout - flex column for proper stacking
        "flex flex-col max-h-[90vh]",
        "overflow-hidden",
        
        // Smooth animations
        "duration-300",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        
        className,
      )}
      {...props}
    >
      {children}

      {/* Close button - always visible and accessible */}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4",
          "p-2 rounded-lg",
          "bg-gray-100/50 dark:bg-slate-800/50",
          "hover:bg-gray-200 dark:hover:bg-slate-700",
          "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          "z-50",
        )}
      >
   
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// Header with clear separation
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-shrink-0",
      "px-6 py-5 sm:px-8 sm:py-6",
      "border-b border-gray-100 dark:border-slate-800",
      "bg-white dark:bg-slate-950",
      className,
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

// Scrollable body
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto",
      "px-6 py-4 sm:px-8 sm:py-6",
      "bg-white dark:bg-slate-950",
      "[&::-webkit-scrollbar]:w-2",
      "[&::-webkit-scrollbar-track]:bg-transparent",
      "[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600",
      "[&::-webkit-scrollbar-thumb]:rounded-full",
      className,
    )}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

// Footer with proper spacing
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-shrink-0",
      "px-6 py-4 sm:px-8 sm:py-5",
      "border-t border-gray-100 dark:border-slate-800",
      "bg-gray-50/50 dark:bg-slate-950/50",
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-3",
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

// Title styling
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl sm:text-2xl font-bold text-gray-900 dark:text-white",
      "tracking-tight leading-tight",
      className,
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

// Description styling
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm sm:text-base text-gray-600 dark:text-gray-400",
      "leading-relaxed mt-2",
      className,
    )}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
