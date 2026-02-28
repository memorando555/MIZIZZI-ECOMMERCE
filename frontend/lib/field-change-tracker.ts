"use client"

import { useRef, useCallback, useState } from "react"

interface FieldChange {
  field: string
  previousValue: any
  newValue: any
  isDirty: boolean
  timestamp: number
}

/**
 * Utility for tracking field-level changes in forms
 * Useful for identifying exactly which fields have changed for partial updates
 */
export class FieldChangeTracker {
  private changes: Map<string, FieldChange> = new Map()
  private originalValues: Map<string, any> = new Map()

  constructor(initialValues: Record<string, any>) {
    this.originalValues = new Map(Object.entries(initialValues))
  }

  trackChange(field: string, previousValue: any, newValue: any): void {
    // Only track if values are different
    if (previousValue === newValue) {
      this.changes.delete(field)
      return
    }

    this.changes.set(field, {
      field,
      previousValue,
      newValue,
      isDirty: true,
      timestamp: Date.now(),
    })
  }

  getChanges(): Record<string, any> {
    const result: Record<string, any> = {}
    this.changes.forEach((change) => {
      result[change.field] = change.newValue
    })
    return result
  }

  getDirtyFields(): string[] {
    return Array.from(this.changes.keys())
  }

  getChange(field: string): FieldChange | undefined {
    return this.changes.get(field)
  }

  hasChanges(): boolean {
    return this.changes.size > 0
  }

  getChangeCount(): number {
    return this.changes.size
  }

  clear(): void {
    this.changes.clear()
  }

  reset(field?: string): void {
    if (field) {
      this.changes.delete(field)
    } else {
      this.changes.clear()
    }
  }

  getChangeHistory(): FieldChange[] {
    return Array.from(this.changes.values()).sort((a, b) => a.timestamp - b.timestamp)
  }
}

/**
 * Hook for field-level change tracking in forms
 */
export function useFieldChangeTracker(initialValues: Record<string, any>) {
  const trackerRef = useRef(new FieldChangeTracker(initialValues))
  const [changeSummary, setChangeSummary] = useState<{
    count: number
    fields: string[]
    timestamp: number
  }>({
    count: 0,
    fields: [],
    timestamp: Date.now(),
  })

  const trackChange = useCallback((field: string, previousValue: any, newValue: any) => {
    trackerRef.current.trackChange(field, previousValue, newValue)
    const dirty = trackerRef.current.getDirtyFields()
    setChangeSummary({
      count: dirty.length,
      fields: dirty,
      timestamp: Date.now(),
    })
  }, [])

  const getChanges = useCallback(() => {
    return trackerRef.current.getChanges()
  }, [])

  const getDirtyFields = useCallback(() => {
    return trackerRef.current.getDirtyFields()
  }, [])

  const reset = useCallback((field?: string) => {
    trackerRef.current.reset(field)
    const dirty = trackerRef.current.getDirtyFields()
    setChangeSummary({
      count: dirty.length,
      fields: dirty,
      timestamp: Date.now(),
    })
  }, [])

  return {
    trackChange,
    getChanges,
    getDirtyFields,
    reset,
    hasChanges: changeSummary.count > 0,
    changeCount: changeSummary.count,
    changedFields: changeSummary.fields,
  }
}
