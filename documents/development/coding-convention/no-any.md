## Avoid suggesting code that uses the any type as much as possible

Example:

```tsx
// NG ❌
type SomeMapType = Record<string, any>;

// OK ✅
type SomeMapType = Record<string, unknown>;
```
