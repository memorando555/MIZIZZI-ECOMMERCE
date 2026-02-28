"use client"

import React from "react"
import { Clock, CheckCircle2, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface SyncStatusIndicatorProps {
  status: "idle" | "saving" | "saved" | "error" | "offline" | "queued"
  lastSaved?: string
  pendingChanges?: number
  isOnline?: boolean
  className?: string
}

/**
 * Real-time sync status indicator component
 * Shows the current synchronization status and pending changes
 */
export function SyncStatusIndicator({
  status,
  lastSaved,
  pendingChanges = 0,
  isOnline = true,
  className,
}: SyncStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "saving":
        return {
          icon: Clock,
          label: "Saving...",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          animate: true,
        }
      case "saved":
        return {
          icon: CheckCircle2,
          label: "Saved",
          color: "text-green-600",
          bgColor: "bg-green-50",
          animate: false,
        }
      case "error":
        return {
          icon: AlertCircle,
          label: "Save failed",
          color: "text-red-600",
          bgColor: "bg-red-50",
          animate: false,
        }
      case "offline":
        return {
          icon: WifiOff,
          label: "Offline",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          animate: false,
        }
      case "queued":
        return {
          icon: Clock,
          label: `${pendingChanges} change${pendingChanges !== 1 ? "s" : ""} pending`,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          animate: true,
        }
      default:
        return {
          icon: CheckCircle2,
          label: "All synced",
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          animate: false,
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", config.bgColor, className)}>
      <Icon className={cn("w-4 h-4", config.color, config.animate && "animate-spin")} />
      <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
      {lastSaved && status === "saved" && (
        <span className="text-xs text-gray-500 ml-1">at {lastSaved}</span>
      )}
      {!isOnline && (
        <span className="text-xs text-amber-600 ml-1">(network unavailable)</span>
      )}
    </div>
  )
}

/**
 * Compact version of sync status indicator
 */
export function CompactSyncStatus({
  status,
  pendingChanges = 0,
  className,
}: Omit<SyncStatusIndicatorProps, "lastSaved" | "isOnline">) {
  const getIcon = () => {
    switch (status) {
      case "saving":
        return <Clock className="w-3 h-3 animate-spin text-blue-600" />
      case "saved":
        return <CheckCircle2 className="w-3 h-3 text-green-600" />
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-600" />
      case "queued":
        return <Clock className="w-3 h-3 animate-pulse text-amber-600" />
      default:
        return null
    }
  }

  if (status === "idle" || status === "saved") {
    return null
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {getIcon()}
      {pendingChanges > 0 && (
        <span className="text-xs text-amber-600">{pendingChanges}</span>
      )}
    </div>
  )
}
