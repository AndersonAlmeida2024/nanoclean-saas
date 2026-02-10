## 2025-02-10 - [Optimize React filtering with useMemo]
**Learning:** Even simple list filtering can be a bottleneck if it involves string operations like `.toLowerCase()` inside the loop. In React, filtering should always be memoized to avoid re-calculating on every render, especially when the list is expected to grow.
**Action:** Always wrap filter logic in `useMemo` and move O(1) operations (like pre-calculating search terms) outside the loop.

## 2025-02-10 - [React Rules of Hooks: Conditional Returns]
**Learning:** Returning `null` early in a component based on a prop (like `isOpen`) before calling all hooks (like `useState`, `useEffect`) causes a "Rendered more hooks than during the previous render" error when the state changes. This is a common cause of application crashes in modal components.
**Action:** Always ensure all hooks are called at the top level of the component, before any conditional return statements.
