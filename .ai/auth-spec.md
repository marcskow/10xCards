# Authentication Architecture Specification - 10xCards

## Overview

This document outlines the technical architecture for implementing user authentication in the 10xCards application using Supabase Auth with Astro SSR and React islands. The implementation follows M1 milestone requirements from the PRD.

## Architecture Decisions

Based on project requirements and technical discussion:

1. **Session Management**: Server-side session via Supabase SSR with client-side cookies
2. **Route Protection**: Centralized middleware approach
3. **State Management**: React store (Zustand) initialized from server-side user data passed as props
4. **Auth Monitoring**: On page load and backend requests (no real-time WebSocket)
5. **Password Recovery**: Deferred to M2/M3
6. **Post-Login Redirect**: Always redirect to `/` (sets list)

## 1. User Interface Architecture

### 1.1 New Pages

#### `/src/pages/login.astro`
- **Purpose**: Login and registration page (toggle between modes)
- **Rendering**: Server-side rendered Astro page
- **Behavior**: 
  - If user is already authenticated (via middleware check), redirect to `/`
  - Otherwise, render the authentication forms
- **Components Used**: `<AuthForm client:load />`

#### `/src/pages/register.astro`
- **Purpose**: Dedicated registration page (optional, can redirect to `/login?mode=register`)
- **Rendering**: Server-side rendered Astro page
- **Behavior**: Similar to login page but with registration form pre-selected

### 1.2 Modified Pages

#### `/src/pages/index.astro`
- **Changes**: 
  - Pass `user` from `Astro.locals` as prop to React components
  - Add middleware protection (redirect to `/login` if not authenticated)
  - Initialize auth store with server-side user data

#### `/src/pages/sets/[id].astro`
- **Changes**: 
  - Add middleware protection
  - Pass user data to React components

### 1.3 Layout Changes

#### `/src/layouts/Layout.astro`
- **Additions**:
  - Accept optional `user` prop
  - Pass user data to client-side components that need it
  - Add navigation bar with user menu (logout button)

#### New: `/src/layouts/AuthLayout.astro`
- **Purpose**: Layout for authentication pages (login/register)
- **Features**:
  - Minimal UI without navigation
  - Centered form container
  - Branding elements

### 1.4 React Components

#### New: `/src/components/AuthForm.tsx`
- **Purpose**: Client-side authentication form with toggle between login/register modes
- **Features**:
  - Email and password inputs with validation
  - Toggle between login and register modes
  - Form submission handling
  - Error message display
  - Loading states
- **Validation**:
  - Email: Valid email format (via zod)
  - Password: Minimum 8 characters, at least one uppercase, one lowercase, one number
  - Inline validation on blur
  - Form-level validation on submit
- **Error Scenarios**:
  - Invalid credentials (login)
  - Email already exists (register)
  - Network errors
  - Generic server errors

#### New: `/src/components/UserMenu.tsx`
- **Purpose**: Dropdown menu for authenticated users
- **Features**:
  - Display user email
  - Logout button
  - Dark mode toggle
- **Integration**: Uses `useAuthStore` to access user data and logout function

#### Modified: `/src/components/SetsList.tsx`
- **Changes**:
  - Remove client-side user fetching
  - Accept user from props/store
  - Handle unauthenticated state (should never occur due to middleware)

### 1.5 State Management

#### New: `/src/components/hooks/useAuthStore.ts`
- **Purpose**: Zustand store for authentication state
- **State**:
  ```typescript
  {
    user: User | null;
    isInitialized: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    initializeUser: (user: User | null) => void;
  }
  ```
- **Initialization**: Called from Astro pages with server-side user data
- **Persistence**: Handled by Supabase cookies (no localStorage needed)

### 1.6 Validation Rules

#### Email Validation
```typescript
z.string()
  .email("Please enter a valid email address")
  .min(1, "Email is required")
```

#### Password Validation (Register)
```typescript
z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
```

#### Password Validation (Login)
```typescript
z.string().min(1, "Password is required")
```

### 1.7 Error Messages

| Scenario | Message |
|----------|---------|
| Invalid email format | "Please enter a valid email address" |
| Empty email | "Email is required" |
| Weak password (register) | "Password must be at least 8 characters and contain uppercase, lowercase, and number" |
| Empty password | "Password is required" |
| Wrong credentials | "Invalid email or password" |
| Email already exists | "An account with this email already exists" |
| Network error | "Unable to connect. Please check your internet connection" |
| Server error | "Something went wrong. Please try again later" |
| Session expired | "Your session has expired. Please log in again" |

### 1.8 User Flow Scenarios

#### Scenario 1: New User Registration
1. User visits any protected page → redirected to `/login`
2. User clicks "Create an account" → switches to register mode
3. User enters email and password → client-side validation
4. User submits form → API call to Supabase Auth
5. Success → session created → redirected to `/`
6. User sees their empty sets list

#### Scenario 2: Existing User Login
1. User visits `/login`
2. User enters credentials → client-side validation
3. User submits form → API call to Supabase Auth
4. Success → session created → redirected to `/`
5. User sees their sets

#### Scenario 3: Logout
1. User clicks logout in UserMenu
2. Confirmation dialog (optional)
3. API call to Supabase Auth signOut
4. Session cleared → redirected to `/login`

#### Scenario 4: Session Expiry
1. User's session expires while browsing
2. Next API request returns 401
3. Middleware intercepts and redirects to `/login`
4. User sees "Session expired" message

## 2. Backend Logic

### 2.1 API Endpoints

#### `/api/auth/login` (POST)
- **Purpose**: Authenticate user and create session
- **Input**: `{ email: string, password: string }`
- **Validation**: Zod schema
- **Process**:
  1. Validate input
  2. Call `supabase.auth.signInWithPassword()`
  3. Set session cookie
  4. Return user data
- **Response**: `{ user: User }` or error
- **Errors**: 400 (validation), 401 (wrong credentials), 500 (server error)

#### `/api/auth/register` (POST)
- **Purpose**: Create new user account and session
- **Input**: `{ email: string, password: string }`
- **Validation**: Zod schema (stronger password rules)
- **Process**:
  1. Validate input
  2. Call `supabase.auth.signUp()`
  3. Set session cookie
  4. Return user data
- **Response**: `{ user: User }` or error
- **Errors**: 400 (validation/email exists), 500 (server error)

#### `/api/auth/logout` (POST)
- **Purpose**: End user session
- **Input**: None
- **Process**:
  1. Get session from cookie
  2. Call `supabase.auth.signOut()`
  3. Clear session cookie
- **Response**: `{ success: true }`
- **Errors**: 500 (server error)

### 2.2 Input Validation

All authentication endpoints use Zod schemas:

```typescript
// Login schema
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Register schema
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
});
```

### 2.3 Exception Handling

All endpoints follow consistent error handling:

```typescript
try {
  // Validation
  const validated = schema.parse(await request.json());
  
  // Business logic
  const { data, error } = await supabase.auth.signInWithPassword(validated);
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status || 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
  
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({ error: "Validation error", details: error.errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}
```

### 2.4 Middleware Updates

#### `/src/middleware/index.ts`
- **Current**: Sets hardcoded `DEFAULT_USER_ID`
- **Changes**:
  1. Create Supabase SSR client
  2. Get session from cookies
  3. Extract user from session
  4. Set `context.locals.user`
  5. Check if route is protected
  6. If protected and no user, redirect to `/login`
  7. If authenticated and accessing `/login`, redirect to `/`

Protected routes (require authentication):
- `/` (home/sets list)
- `/sets/*`
- All API routes except `/api/auth/*`

Public routes (no authentication required):
- `/login`
- `/register`
- `/api/auth/*`

### 2.5 Server-Side Rendering Updates

#### SSR Configuration
- Already configured in `astro.config.mjs` with `output: "server"`
- No changes needed to SSR settings

#### Page-Level Changes
All protected pages will:
1. Check `Astro.locals.user` (set by middleware)
2. Pass user to React components as props
3. Initialize client-side auth store with user data

Example pattern:
```astro
---
const user = Astro.locals.user;
// user is guaranteed to be non-null due to middleware redirect
---

<Layout user={user}>
  <ComponentWithAuth client:load user={user} />
</Layout>
```

## 3. Authentication System

### 3.1 Supabase Client Configuration

#### Server-Side Client (SSR)
```typescript
// /src/db/supabase.server.ts
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options) {
          cookies.set(key, value, options);
        },
        remove(key: string, options) {
          cookies.delete(key, options);
        },
      },
    }
  );
}
```

#### Client-Side Client
```typescript
// /src/db/supabase.client.ts (modified)
import { createBrowserClient } from '@supabase/ssr';

export const supabaseClient = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);
```

### 3.2 Authentication Flows

#### Registration Flow
1. User submits registration form
2. Client calls `/api/auth/register`
3. Server validates input
4. Server calls `supabase.auth.signUp({ email, password })`
5. Supabase creates user in `auth.users`
6. Session is created and stored in cookies
7. Server returns user data
8. Client updates auth store
9. Client redirects to `/`

#### Login Flow
1. User submits login form
2. Client calls `/api/auth/login`
3. Server validates input
4. Server calls `supabase.auth.signInWithPassword({ email, password })`
5. Supabase verifies credentials
6. Session is created and stored in cookies
7. Server returns user data
8. Client updates auth store
9. Client redirects to `/`

#### Logout Flow
1. User clicks logout
2. Client calls `/api/auth/logout`
3. Server calls `supabase.auth.signOut()`
4. Session is cleared from cookies
5. Server returns success
6. Client clears auth store
7. Client redirects to `/login`

#### Session Management
- **Storage**: HTTP-only cookies managed by Supabase SSR
- **Duration**: Default Supabase session lifetime (1 hour access token, 7 days refresh token)
- **Refresh**: Automatic via Supabase client on API requests
- **Validation**: On every request via middleware

### 3.3 Security Considerations

#### Cookie Security
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag (HTTPS only in production)
- SameSite=Lax (CSRF protection)
- Appropriate expiration times

#### Password Security
- Handled entirely by Supabase Auth
- Bcrypt hashing with salt
- No plaintext password storage
- No password in client-side code after submission

#### Session Security
- Short-lived access tokens (1 hour)
- Automatic token refresh
- Server-side session validation on every request
- Logout invalidates all tokens

#### Error Message Security
- No information leakage (don't reveal if email exists)
- Generic error messages for authentication failures
- Detailed errors only in server logs

## 4. Implementation Checklist

### Phase 1: Dependencies and Configuration
- [ ] Install `@supabase/ssr` package
- [ ] Create environment variables for public Supabase credentials
- [ ] Create server-side Supabase client helper
- [ ] Update client-side Supabase client to use SSR

### Phase 2: Backend (API Endpoints)
- [ ] Create `/api/auth/login.ts`
- [ ] Create `/api/auth/register.ts`
- [ ] Create `/api/auth/logout.ts`
- [ ] Add Zod validation schemas
- [ ] Add error handling

### Phase 3: Middleware
- [ ] Update middleware to use Supabase SSR client
- [ ] Add route protection logic
- [ ] Add redirect logic (protected → login, login → home if authenticated)
- [ ] Remove hardcoded `DEFAULT_USER_ID`

### Phase 4: Frontend (Pages)
- [ ] Create `/pages/login.astro`
- [ ] Create `/layouts/AuthLayout.astro`
- [ ] Update `/pages/index.astro` to pass user prop
- [ ] Update `/pages/sets/[id].astro` to pass user prop

### Phase 5: Frontend (Components)
- [ ] Create `useAuthStore.ts` (Zustand)
- [ ] Create `AuthForm.tsx`
- [ ] Create `UserMenu.tsx`
- [ ] Update `Layout.astro` to include UserMenu
- [ ] Update `SetsList.tsx` to use auth store

### Phase 6: Testing
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test route protection (unauthenticated access)
- [ ] Test route protection (authenticated accessing /login)
- [ ] Test session persistence (page refresh)
- [ ] Test validation errors
- [ ] Test network errors
- [ ] Test wrong credentials

## 5. Data Flow Diagram

```
[Browser] → [Astro Page] → [Middleware] → [Supabase SSR]
    ↓            ↓              ↓
[React]    [Pass User]    [Check Session]
    ↓            ↓              ↓
[Auth Store] ← [Props]    [Set Locals]
    ↓
[Components]

Authentication Request Flow:
[Form] → [API Endpoint] → [Supabase Auth] → [Session Cookie] → [Redirect]
```

## 6. File Structure

```
src/
├── middleware/
│   └── index.ts (updated)
├── db/
│   ├── supabase.client.ts (updated)
│   └── supabase.server.ts (new)
├── pages/
│   ├── index.astro (updated)
│   ├── login.astro (new)
│   ├── sets/
│   │   └── [id].astro (updated)
│   └── api/
│       └── auth/
│           ├── login.ts (new)
│           ├── register.ts (new)
│           └── logout.ts (new)
├── layouts/
│   ├── Layout.astro (updated)
│   └── AuthLayout.astro (new)
└── components/
    ├── AuthForm.tsx (new)
    ├── UserMenu.tsx (new)
    ├── SetsList.tsx (updated)
    └── hooks/
        └── useAuthStore.ts (new)
```

## 7. Environment Variables

```env
# Existing (private, server-only)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhb...

# New (public, exposed to client)
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhb...
```

## 8. Success Criteria (from PRD)

### US-001: Registration
- [x] Form accepts valid email and password
- [x] Invalid input shows error message
- [x] Success logs user in and redirects to home
- [x] Password stored as hash (handled by Supabase)

### US-002: Login
- [x] Valid credentials log in and redirect
- [x] Invalid credentials show generic error
- [x] Session persists until logout/expiry

### US-003: Logout
- [x] Logout button invalidates session
- [x] Redirect to login page
- [x] Back/refresh doesn't restore session

### US-026: Data Isolation
- [x] All API requests include user ID
- [x] Unauthorized access returns 403/404
- [x] Unauthenticated users redirected to login
- [x] Expired session redirects to login with message

## 9. Future Enhancements (M2/M3)

- Password recovery (forgot password flow)
- Email verification
- Change password (authenticated)
- Delete account
- Social login (Google, GitHub)
- Two-factor authentication
- Session management UI (view active sessions, logout all)
