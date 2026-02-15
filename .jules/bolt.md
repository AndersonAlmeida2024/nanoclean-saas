## 2025-02-10 - [Optimize React filtering with useMemo]
**Learning:** Even simple list filtering can be a bottleneck if it involves string operations like `.toLowerCase()` inside the loop. In React, filtering should always be memoized to avoid re-calculating on every render, especially when the list is expected to grow.
**Action:** Always wrap filter logic in `useMemo` and move O(1) operations (like pre-calculating search terms) outside the loop.
