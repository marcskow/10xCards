import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import type { AuthErrorDto } from "@/types";

interface AuthFormProps {
  initialMode?: "login" | "register";
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const isLogin = mode === "login";

  /**
   * Maps API error response to form field errors.
   */
  const mapErrorToFields = useCallback((errorDto: AuthErrorDto): FormErrors => {
    const { code, message, details } = errorDto.error;
    const formErrors: FormErrors = {};

    // Handle validation errors with field-specific details
    if (code === "validation_error" && details) {
      if (details.email) {
        formErrors.email = details.email[0];
      }
      if (details.password) {
        formErrors.password = details.password[0];
      }
      if (details.confirmPassword) {
        formErrors.confirmPassword = details.confirmPassword[0];
      }
      // If no specific field errors, show as general
      if (!formErrors.email && !formErrors.password && !formErrors.confirmPassword) {
        formErrors.general = message;
      }
    } else if (code === "invalid_credentials") {
      formErrors.general = message;
    } else if (code === "email_in_use") {
      formErrors.email = message;
    } else if (code === "rate_limit") {
      formErrors.general = message;
    } else {
      formErrors.general = message;
    }

    return formErrors;
  }, []);

  /**
   * Client-side validation before API call.
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!isLogin && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!isLogin) {
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, confirmPassword, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin ? { email, password } : { email, password, confirmPassword };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorResponse = data as AuthErrorDto;
        const formErrors = mapErrorToFields(errorResponse);
        setErrors(formErrors);
        return;
      }

      // Success - redirect to home page
      window.location.href = "/";
    } catch {
      setErrors({
        general: "Unable to connect. Please check your internet connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = isLogin ? "register" : "login";
    setMode(newMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
    // Update URL without reload for better UX
    window.history.replaceState(null, "", newMode === "login" ? "/login" : "/register");
  };

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (errors.email) {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    },
    [errors.email]
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      if (errors.password) {
        setErrors((prev) => ({ ...prev, password: undefined }));
      }
    },
    [errors.password]
  );

  const handleConfirmPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmPassword(e.target.value);
      if (errors.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      }
    },
    [errors.confirmPassword]
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{isLogin ? "Welcome back" : "Create an account"}</CardTitle>
        <CardDescription>
          {isLogin ? "Enter your credentials to access your flashcards" : "Enter your details to create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.general && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900"
            >
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={handleEmailChange}
              required
              disabled={isLoading}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={isLogin ? "Enter your password" : "Create a password (min. 8 characters)"}
              value={password}
              onChange={handlePasswordChange}
              required
              disabled={isLoading}
              autoComplete={isLogin ? "current-password" : "new-password"}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                disabled={isLoading}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="text-primary hover:underline font-medium"
            disabled={isLoading}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
