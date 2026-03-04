'use client'

import { useState } from 'react'
import { Settings, RefreshCw, Trash2 } from 'lucide-react'

export default function CacheSettingsPage() {
  const [settings, setSettings] = useState({
    categoryTtl: 24,
    flashSalesProductsTtl: 15,
    flashSalesEventTtl: 5,
    alertThreshold: 70,
    storageLimit: 10,
    autoInvalidateOnUpdate: true,
  })

  const [saved, setSaved] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleSave = async () => {
    try {
      // TODO: Send settings to API
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const handleReset = async () => {
    if (!confirm('This will clear all cache data. Are you sure?')) return

    setResetting(true)
    try {
      // Clear browser caches
      sessionStorage.clear()
      localStorage.clear()

      // TODO: Call API to clear server cache
      alert('Cache cleared successfully')
    } catch (error) {
      alert('Error clearing cache')
      console.error(error)
    } finally {
      setResetting(false)
    }
  }

  return (
    <main className="flex-1">
      <div className="space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Cache Settings
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Configure cache behavior, TTL values, and performance thresholds
          </p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-800 dark:text-green-200">
            <p className="text-sm font-medium">Settings saved successfully</p>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Categories Cache */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Categories Cache</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Cache TTL (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.categoryTtl}
                  onChange={e =>
                    setSettings({ ...settings, categoryTtl: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How long to keep categories in cache (currently {settings.categoryTtl} hours)
                </p>
              </div>
            </div>
          </div>

          {/* Flash Sales Cache */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Flash Sales Cache</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Products Cache TTL (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.flashSalesProductsTtl}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      flashSalesProductsTtl: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cache TTL for flash sale products (currently {settings.flashSalesProductsTtl}
                  minutes)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Event Cache TTL (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.flashSalesEventTtl}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      flashSalesEventTtl: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cache TTL for flash sale events/countdown (currently {settings.flashSalesEventTtl}
                  minutes)
                </p>
              </div>
            </div>
          </div>

          {/* Performance Thresholds */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Performance Thresholds</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Alert Hit Rate Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.alertThreshold}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      alertThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when cache hit rate drops below {settings.alertThreshold}%
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Storage Limit (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.storageLimit}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      storageLimit: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum storage space for caches (currently {settings.storageLimit}MB)
                </p>
              </div>
            </div>
          </div>

          {/* Auto Invalidation */}
          <div className="bg-background border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Behavior</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoInvalidateOnUpdate}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      autoInvalidateOnUpdate: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">
                  Auto-invalidate cache when admins update data
                </span>
              </label>
              <p className="text-xs text-muted-foreground ml-7">
                Automatically clear caches when categories or flash sales are updated (recommended)
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-900 dark:text-red-100">
              Danger Zone
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  Clear all cached data (sessionStorage, localStorage, and server cache)
                </p>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {resetting ? 'Clearing...' : 'Clear All Caches'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-border">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Save Settings
          </button>
          <button
            onClick={() =>
              setSettings({
                categoryTtl: 24,
                flashSalesProductsTtl: 15,
                flashSalesEventTtl: 5,
                alertThreshold: 70,
                storageLimit: 10,
                autoInvalidateOnUpdate: true,
              })
            }
            className="px-4 py-2 border border-border hover:bg-muted rounded-md text-sm font-medium transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            About Cache Settings
          </h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>
              - <strong>Categories:</strong> Cached for 24 hours because they change infrequently
            </li>
            <li>
              - <strong>Flash Sales Products:</strong> 15 minutes TTL to balance performance with
              stock freshness
            </li>
            <li>
              - <strong>Flash Sale Events:</strong> 5 minutes TTL for accurate countdown timers
            </li>
            <li>
              - Changes to these settings apply to new cache entries only; existing caches keep
              their original TTL
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
