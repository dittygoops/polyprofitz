# Dual Window SVC - Comparison & Changes

## Key Differences

### 1. SVC (Search Volume Change) - MAJOR CHANGE

**Current Implementation (Single Window):**
```typescript
SVC = (Trends_Current - Trends_7d_Ago) / Trends_7d_Ago
```

**New Spec (Dual Window):**
```typescript
SVC_24h = (Trends_Current - Trends_24h_Ago) / Trends_24h_Ago
SVC_7d = (Trends_Current - Trends_7d_Ago) / Trends_7d_Ago
SVC = (SVC_24h × 0.6) + (SVC_7d × 0.4)
```

**Impact:**
- Catches **24h viral spikes** faster (60% weight)
- Validates with **7-day context** (40% weight)
- More precise timing for "just peaked" moments
- Better differentiates fresh spikes from sustained trends

**Required Changes:**
- Add `Trends_24h_Ago` data point
- Calculate SVC as weighted composite

---

### 2. RW (Recency Weight) - REVERTED

**Current Implementation:**
```typescript
// Check if current is at exact peak of last 24h
const last24h = trends.history.filter(point => point.t >= now - 24 * 60 * 60 * 1000);
const maxLast24h = Math.max(...last24h.map(p => p.v));
const RW = trends.current >= maxLast24h ? 1.0 : 0.5;
```

**New Spec:**
```typescript
// Check if current is within 90% of max over entire 7 days
const allTrendValues = timelineData.map(t => t.value[0]);
const maxTrend = Math.max(...allTrendValues);
const RW = Trends_Current >= maxTrend * 0.9 ? 1.0 : 0.5;
```

**Impact:**
- More lenient - allows RW = 1.0 if near peak (not just at peak)
- Uses 7-day window instead of 24h window
- Better for markets that stay hot for multiple days

---

### 3. Division by Zero Handling

**Current (Our Addition):**
```typescript
if (trends.sevenDaysAgo === 0) {
  SVC = trends.current > 0 ? 10.0 : 0;
}
```

**New Spec:**
```typescript
const SVC_24h = (Trends_Current - Trends_24h_Ago) / (Trends_24h_Ago || 1); // Prevent div by 0
const SVC_7d = (Trends_Current - Trends_7d_Ago) / (Trends_7d_Ago || 1);
```

**Impact:**
- New spec uses `|| 1` fallback instead of capping at 10.0
- More conservative: 0 → 48 becomes `48/1 = 48` for that window
- After weighting: could be even higher than our 10.0 cap

**Decision:** Use spec's approach (`|| 1` fallback)

---

## Example: Viral Spike

### Scenario
- **Trends_Current** = 85
- **Trends_24h_Ago** = 15
- **Trends_7d_Ago** = 12

### Old Calculation (Single Window)
```typescript
SVC = (85 - 12) / 12 = 6.08
```

### New Calculation (Dual Window)
```typescript
SVC_24h = (85 - 15) / 15 = 4.67  // 467% spike in 24h
SVC_7d = (85 - 12) / 12 = 6.08    // 608% over 7 days
SVC = (4.67 × 0.6) + (6.08 × 0.4)
    = 2.80 + 2.43
    = 5.23
```

**Result:** Slightly lower (5.23 vs 6.08) because the 24h window dampens the 7d trend when it was already elevated

### Scenario 2: Fresh Spike from Low Base
- **Trends_Current** = 80
- **Trends_24h_Ago** = 10
- **Trends_7d_Ago** = 50

```typescript
SVC_24h = (80 - 10) / 10 = 7.0    // 700% in 24h!
SVC_7d = (80 - 50) / 50 = 0.6     // Only 60% over 7 days
SVC = (7.0 × 0.6) + (0.6 × 0.4)
    = 4.2 + 0.24
    = 4.44
```

**Interpretation:** High 24h spike (7.0) is dampened by moderate 7d change (0.6), giving 4.44 - this catches "just now going viral" better than single window.

---

## Implementation Checklist

- [ ] Update `TrendsResult` interface to include `twentyFourHoursAgo: number`
- [ ] Update `TrendsService.getGoogleTrends()` to extract 24h ago value
- [ ] Update `TrendsInput` interface to include `twentyFourHoursAgo: number`
- [ ] Update SVC calculation to use dual window formula
- [ ] Update RW to use 90% of 7-day max (instead of 24h exact peak)
- [ ] Update controller to pass `twentyFourHoursAgo` to metrics service
- [ ] Use `|| 1` fallback instead of capping at 10.0

---

## Benefits of Dual Window

1. **Faster reaction**: 60% weight on 24h catches viral moments immediately
2. **Noise reduction**: 40% weight on 7d filters out one-day flukes
3. **Better timing**: Identifies "peak right now" vs "was trending all week"
4. **More accurate scores**: Distinguishes quality of hype spike

This makes the fade strategy **more precise** and **better timed**! 🎯

