## React component props types should always be named `Props`

Example:

```tsx
type Props = {
  // ...
};

export const DefaultTable = ({ ... }: Props) => {
  // ...
};
```

## React boolean type props should have `is` prefix

Example:

```tsx
type Props = {
  isModalOpen: boolean;
  isLoading: boolean;
  isDisabled: boolean;
};
```

## React props functions should have `on` prefix

Example:

```tsx
type Props = {
  onCancel: () => void;
  onSubmit: () => void;
};

export const LoginPage = ({ onCancel, onSubmit }: Props) => {
  // ...
};
```

## Handler functions passed to React props should have `handle` prefix

Example:

```tsx
export const LoginPageContainer = () => {
  const handleCancel = () => {
    // ...
  };

  const handleSubmit = () => {
    // ...
  };

  return <LoginPage onCancel={handleCancel} onSubmit={handleSubmit} />;
};
```
