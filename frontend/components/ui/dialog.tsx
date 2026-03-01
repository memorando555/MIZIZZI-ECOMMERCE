"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

// Premium overlay with smooth animation
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[999]",
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

// Modern responsive dialog - bottom sheet on mobile, centered on desktop
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Mobile-first positioning - bottom sheet
        "fixed bottom-0 left-0 right-0 w-full z-[1000]",
        "rounded-t-3xl sm:rounded-3xl",
        "bg-white dark:bg-slate-950",
        "shadow-xl dark:shadow-2xl",
        "border-t sm:border border-gray-200 dark:border-slate-800",
        
        // Desktop positioning - centered with proper spacing from top/bottom
        "sm:bottom-auto sm:left-[50%] sm:top-1/2",
        "sm:translate-x-[-50%] sm:translate-y-[-50%]",
        "sm:w-[calc(100%-2rem)] sm:max-w-2xl",
        
        // Height constraints - ensure content is visible with scrolling
        "max-h-[90vh] sm:max-h-[95vh]",
        "overflow-hidden flex flex-col",
        
        // Smooth animations
        "duration-300",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        
        // Mobile animations - slide up
        "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        "sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0",
        "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
        "sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-1/2",
        "sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-1/2",
        
        className,
      )}
      {...props}
    >
      {/* Mobile handle bar */}
      <div className="sm:hidden flex justify-center pt-2 pb-1">
        <div className="h-1 w-12 rounded-full bg-gray-300 dark:bg-slate-600" />
      </div>

      {children}

      {/* Close button */}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4 sm:right-6 sm:top-6",
          "p-1.5 rounded-lg",
          "bg-gray-100/50 dark:bg-slate-800/50",
          "hover:bg-gray-200 dark:hover:bg-slate-700",
          "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          "z-50",
        )}
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close dialog</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// Header with premium styling
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-shrink-0",
      "px-4 sm:px-6 py-5 sm:py-6",
      "border-b border-gray-100 dark:border-slate-800",
      "bg-white dark:bg-slate-950",
      "sm:rounded-t-3xl",
      className,
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

// Body with smooth scrolling
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto",
      "px-4 sm:px-6 py-4 sm:py-6",
      "bg-white dark:bg-slate-950",
      "[&::-webkit-scrollbar]:w-2",
      "[&::-webkit-scrollbar-track]:bg-transparent",
      "[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600",
      "[&::-webkit-scrollbar-thumb]:rounded-full",
      "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600",
      className,
    )}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

// Footer with responsive button layout
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-shrink-0",
      "px-4 sm:px-6 py-4 sm:py-5",
      "border-t border-gray-100 dark:border-slate-800",
      "bg-white/50 dark:bg-slate-950/50",
      "backdrop-blur-sm",
      "sm:rounded-b-3xl",
      "flex flex-col-reverse sm:flex-row",
      "items-center justify-end gap-3",
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

// Premium title styling
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl sm:text-2xl font-bold text-gray-900 dark:text-white",
      "tracking-tight leading-tight",
      "pr-8 sm:pr-0",
      className,
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

// Readable description
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
