## Define functions and components as Arrow Functions

Example 1:

```tsx
// NG ❌
export function DefaultButton() {
  // ...
}

// OK ✅
export const DefaultButton = () => {
  // ...
};
```

Example 2:

```tsx
// NG ❌
export function calculateSum() {
  // ...
}

// OK ✅
export const calculateSum = () => {
  // ...
};
```
