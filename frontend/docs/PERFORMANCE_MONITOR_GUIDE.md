# Performance Monitor Guide

## Overview

The Performance Monitor Widget is an in-app debugging tool that displays real-time cache status, performance metrics, and storage statistics. It appears in the bottom-right corner of the page in development mode only.

## Features

### 1. Real-Time Cache Status
- **sessionStorage**: Shows cached categories count and size (same session only)
- **localStorage**: Shows persistent cache count, size, and expiry countdown (24h TTL)
- **Server Cache**: Shows server-side cache status (3600s TTL)

### 2. Performance Metrics
- **Page Load Time**: Total time for page to fully load
- **Cache Hits**: Number of times data was served from cache
- **Cache Misses**: Number of times data was fetched from API
- **API Calls**: Total number of API requests made
- **Avg API Time**: Average response time for API calls

### 3. Cache Layers Information
- **Layer 1 (sessionStorage)**: <50ms retrieval, same session only
- **Layer 2 (localStorage)**: <100ms retrieval, persists 24 hours
- **Layer 3 (Server)**: <500ms retrieval, revalidated every 1 hour

## Using the Monitor

### Location
- **Position**: Bottom-right corner of screen
- **Availability**: Development mode only (`NODE_ENV === "development"`)
- **Size**: 384px wide, collapsible

### Controls

**Expand/Collapse**
- Click the header to expand/collapse the full monitor panel
- Shows/hides detailed cache and performance information

**Hide Monitor**
- Click the eye icon (top-right) to hide the monitor
- A floating eye button appears to show it again

**Reload Button**
- Reloads the page (Ctrl+R equivalent)
- Useful for testing cache between page loads

**Clear Cache Button**
- Clears sessionStorage, localStorage, and all cache data
- Useful for testing fresh data fetch from API
- Monitor updates automatically after clearing

### Real-Time Updates
- Monitor updates every 2 seconds
- Automatically reflects cache changes
- Shows live expiry countdown for localStorage

## Testing Scenarios

### Test 1: Fresh Page Load
1. Clear cache using "Clear Cache" button
2. Reload page
3. **Expected**: Cache Miss - shows "✗" in localStorage/sessionStorage
4. **Result**: Data fetches from API (takes 400-600ms first time)

### Test 2: Same Session Reload
1. Reload page (Ctrl+R) after first load
2. **Expected**: Cache Hit - shows "✓" in sessionStorage
3. **Result**: Data loads in <50ms from sessionStorage

### Test 3: Cross-Session Persistence
1. Load page (cache populated)
2. Close browser tab/window completely
3. Reopen the site
4. **Expected**: Cache Hit - shows "✓" in localStorage
5. **Result**: Data loads in <100ms from localStorage

### Test 4: Cache Expiry (24 hours)
1. Check localStorage "Expires: Xh Xm" countdown
2. After 24 hours, expiry time shows "Expired"
3. Next page load will fetch fresh data
4. **Expected**: New data from API, cache resets

## Interpreting the Indicator Lights

### Checkmark (✓)
- Green checkmark = Cache is populated and ready
- Data is available without API calls

### X Mark (✗)
- Red X mark = Cache is empty
- Next request will fetch from API

### Status Colors

**Blue (sessionStorage)**
- Active cache for current session
- Fastest retrieval (<50ms)

**Green (localStorage)**
- Persistent cache across sessions
- Survives browser closes
- Expires after 24 hours

**Purple (Server Cache)**
- Server-side cache state
- Revalidates every 1 hour (3600s)
- Shared across all users

## Performance Optimization Tips

### Optimal Cache Behavior
1. **First load**: MISS (API fetch 400-600ms)
2. **Reload**: HIT (sessionStorage <50ms)
3. **Next day**: HIT (localStorage <100ms)
4. **After 24h**: MISS (fresh fetch from API)

### What Should You See?
- Cache Hit rate > 95% for normal usage
- Most page reloads showing <50ms load time
- API calls only on first visit or cache expiry

### Performance Issues to Look For
- Multiple API calls for same endpoint
- High API response times (>500ms)
- Cache not persisting (always showing MISS)
- Memory usage growing rapidly

## Troubleshooting

### Monitor Not Appearing
- Check `NODE_ENV` is set to "development"
- Ensure development mode is running
- Check browser console for errors

### Cache Not Populating
- Check localStorage/sessionStorage are enabled
- Verify API responses are successful
- Look for network errors in browser DevTools

### Performance Still Slow
- Check Network tab for slow API requests
- Monitor CPU usage during page load
- Check for render blocking JavaScript
- Verify images are optimized (WebP, proper sizes)

## API Response Verification

When cache is working correctly, you should see:
```
[v0] Cache HIT: sessionStorage (0.09ms) - 16 categories
```

If fetching fresh data:
```
[v0] Cache MISS: Using fresh server data (425.67ms) - 16 categories cached
```

## Advanced Debugging

### Console Commands
Open DevTools (F12) and run:

```javascript
// Get current cache status
const cache = sessionStorage.getItem('mizizzi_categories_cache')
console.log(JSON.parse(cache))

// Check localStorage expiry
const expiry = localStorage.getItem('mizizzi_categories_cache_expiry')
console.log(new Date(parseInt(expiry)))

// Clear all caches
sessionStorage.clear()
localStorage.clear()
```

## Production Considerations

- Monitor is **development-only** and doesn't appear in production
- No performance overhead in production builds
- Cache strategy remains active in production
- All metrics collection is transparent to users
