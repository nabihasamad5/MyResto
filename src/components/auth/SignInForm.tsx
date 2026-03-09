"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Alert from "../ui/alert/Alert";
// next-auth signIn removed in favor of custom API login

interface SignInFormProps {
  onToggle?: () => void;
  isWrapper?: boolean;
}

export default function SignInForm({ onToggle, isWrapper = false }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState<"success" | "error" | "warning" | "info" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setAlertVariant(null);

    if (!email || !password) {
      setMessage("Please fill all fields");
      setAlertVariant("error");
      setLoading(false);
      return;
    }

    try {
      const csrfRes = await fetch("/api/auth/csrf", { method: "GET", credentials: "include" });
      const csrfJson = await csrfRes.json().catch(() => ({}));
      const csrfToken = csrfJson?.csrfToken || "";
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setMessage("Login successful! Redirecting...");
        setAlertVariant("success");
        router.replace("/dashboard");
      } else {
        setMessage(json?.error || "Invalid credentials. Please try again.");
        setAlertVariant("error");
      }
    } catch (err) {
      setMessage("Unexpected error occurred. Please try again.");
      setAlertVariant("error");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col flex-1 w-full ${!isWrapper ? 'lg:w-1/2' : 'h-full justify-center items-center px-8'}`}>
      {!isWrapper && (
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Back to dashboard
          </Link>
        </div>
      )}

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8 text-center">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          {alertVariant && (
            <Alert
              variant={alertVariant}
              title={alertVariant === "success" ? "Success" : alertVariant === "error" ? "Error" : "Info"}
              message={message}
            />
          )}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>Email <span className="text-error-500">*</span></Label>
                <Input
                  placeholder="info@gmail.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>Password <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>
                <Link
                  href="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>

              

              <div>
                <Button className="w-full" size="sm" type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Sign in"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm font-normal text-gray-700 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              {isWrapper && onToggle ? (
                <button
                  onClick={onToggle}
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
                >
                  Sign Up
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
