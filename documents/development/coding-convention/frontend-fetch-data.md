## Use `refetchQueries` to fetch new data after mutation execution

Example:

```tsx
onSaveUserInfo({
  variables: {
    // ...
  },
  // ...
  refetchQueries: ['fetchUserInfo'],
});
```

## Use loading, error, refetch from data fetching hooks and display loading and error states with DefaultSkeleton and ErrorStub

Example:

```tsx
// File name: `usage-sheet-page-container.tsx`

export const UsageSheetPageContainer = () => {
  const { loading, error, refetch } = useFetchUsageSheetQuery();

  return <UsageSheetPage isLoading={loading} isError={Boolean(error)} onRefetch={refetch} />;
};
```

```tsx
// File name: `usage-sheet-page.tsx`

export const UsageSheetPage = ({ isLoading, isError, onRefetch }: Props) => {
  return (
    <DefaultSkeleton isLoading={isLoading}>
      {isError ? (
        <ErrorStub refetch={onRefetch} />
      ) : (
        <div>Main content displayed when there's no loading or error</div>
      )}
    </DefaultSkeleton>
  );
};
```
