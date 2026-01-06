## Using Container/Presentational Pattern

The "Container/Presentational Pattern" is a method of designing components by dividing them into two types: "Container Components" and "Presentational Components". By clearly separating component responsibilities, we can improve code reusability and maintainability.

### Presentational Component

Presentational components primarily handle appearance (UI). These components do not directly manage state and focus on how to display data and how to handle user interactions. Generally, they receive data through props and display data without having any (or very little) knowledge. They also provide callbacks to send information to parent components or container components in response to user input and actions.

### Container Component

Container components are responsible for business logic and state management. These components determine how to operate, fetch necessary data, and supply that data to presentational components. Basically, they function as data sources and pass that data to child presentational components. This allows presentational components to focus purely on display roles.

### Characteristics

#### Add `Container` to the component name and file name of Container

Example:

```tsx
// File name: `login-page-container.tsx`

export const LoginPageContainer = () => {
  // ...
};
```

#### Presentational components don't have `Container` in their names

Example 1:

```tsx
// File name: `login-page.tsx`

export const LoginPage = () => {
  // ...
};
```

Example 2:

```tsx
// File name: `default-button.tsx`

export const DefaultButton = () => {
  // ...
};
```

#### Both Container and Presentational components can be used within Container

Example 1: Using only Presentational components

```tsx
export const LoginPageContainer = () => {
  return <LoginPage />;
};
```

Example 2:

```tsx
export const LoginPageContainer = () => {
  return (
    <>
      <LoginPage headerSlot={<HeaderContainer />} />
      <ConfirmExitModalContainer />
    </>
  );
};
```

Basically, limit the Presentational components that can be used within Container to one (`LoginPageContainer` should only use `LoginPage`). This is because Container's responsibility is not UI layout composition, but to express dependencies on Presentational components through imports. Place unnecessary Presentational components in Presentational components.

#### Presentational components can only use Presentational components

Example:

```tsx
export const LoginPage = () => {
  return (
    <div>
      <Text>Login</Text>
      <DefaultButton />
    </div>
  );
};
```

#### Business logic should only be written in Container

Example:

```tsx
// NG ❌
export const LoginPage = () => {
  const [loginMutation] = useLoginMutation();

  const setAuthTokens = useSetAtom(authTokensAtom);

  const navigate = useNavigate();

  const handleSubmit = (data: LoginFormSchema) => {
    // ...
  };

  return (
    <div>
      ...
      <Button onClick={handleSubmit}>Login</Button>
    </div>
  );
};
```

```tsx
// OK ✅
export const LoginPageContainer = () => {
  const [loginMutation] = useLoginMutation();

  const setAuthTokens = useSetAtom(authTokensAtom);

  const navigate = useNavigate();

  const handleSubmit = (data: LoginFormSchema) => {
    // ...
  };

  return <LoginPage onSubmit={handleSubmit} />;
};
```

### UI-related things should basically be written in Presentational components

Example:

```tsx
// File name: `login-page.tsx`

export const SomePresentationalComponent = ({ date }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formattedDate = date.toLocaleDateString('en-US', {
    // ...
  });

  const dynamicCssStyles: CSSProperties = {
    backgroundColor: isModalOpen ? 'red' : 'blue',
  };

  const handleOpenModalButtonClick = () => {
    // Asynchronous UI logic to open modal after 1 second
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setIsModalOpen(true);
        resolve();
      }, 1000);
    });
  };

  return (
      ...
  );
};
```

#### When you want to use Container within Presentational components, use slots

Example:

```tsx
// File name: `login-page.tsx`

type Props = {
  headerSlot: React.ReactNode;
};

export const LoginPage = ({ headerSlot }: Props) => {
  return (
    <div>
      {headerSlot}
      ...
    </div>
  );
};
```

```tsx
// File name: `login-page-container.tsx`

export const LoginPageContainer = () => {
  return <LoginPage headerSlot={<HeaderContainer />} />;
};
```

In the above example, `HeaderContainer` has UI necessary for the page, but since the component is a Container, it cannot be used directly within `LoginPage`. In this case, it can be resolved by passing it as a slot prop.

Adding `slot` to props names that receive Container components is a project convention.

## Add `page` to the component name of page (screen) components

Example:

```tsx
// File name: `first-login/ui/first-login-page.tsx`

export const FirstLoginPage = () => {
  // ...
};
```

Page components are placed at the top level that composes the UI.

## Use `Guard` component as a separate layer to check routing and navigation parameters

Example:

```tsx
// File name: `usage-sheet-page-guard.tsx`

export const UsageSheetPageGuard = () => {
  const { careReceiverId } = useParams<ParamParseKey<typeof paths.careReceiver.usageSheet>>();

  if (!careReceiverId) {
    return <Navigate to={paths.careReceiver.index} />;
  }

  return <UsageSheetPageContainer careReceiverId={careReceiverId} />;
};
```

The component name includes `Guard`.
