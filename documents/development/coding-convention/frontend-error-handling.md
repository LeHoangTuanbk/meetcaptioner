## Basically use `zod` `schema` for useForm hook

Example:

```tsx
export const ServiceRegisterForm = () => {
  const { ... } = useForm<ServiceRegisterFormSchema>({
    resolver: zodResolver(serviceRegisterFormSchema),
  });

  // ...
};
```
