"use client";
import React, { useState, useEffect } from "react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import Image from "next/image";

interface AuthWrapperProps {
  initialView?: "signin" | "signup";
}

export default function AuthWrapper({ initialView = "signup" }: AuthWrapperProps) {
  const [isSignUp, setIsSignUp] = useState(initialView === "signup");
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include", cache: "no-store" });
        if (res.ok) {
          const url = new URL("/dashboard", window.location.href);
          // Preserve query params
          url.search = window.location.search;
          window.location.replace(url.toString());
        }
      } catch {
        // ignore
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setIsSignUp(initialView === "signup");
  }, [initialView]);

  const toggleView = () => {
    const newState = !isSignUp;
    setIsSignUp(newState);
    const newPath = newState ? "/signup" : "/signin";
    window.history.pushState({}, "", newPath);
  };

  return (
    <div className="relative w-full max-w-[1000px] min-h-[600px] bg-white dark:bg-gray-900 rounded-[20px] shadow-2xl overflow-hidden mx-auto">
      {/* Sign Up Container */}
      <div
        className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-full lg:w-1/2 ${isSignUp
          ? "lg:translate-x-full opacity-100 z-10"
          : "opacity-0 z-0"
          }`}
      >
        <SignUpForm onToggle={toggleView} isWrapper={true} />
      </div>

      {/* Sign In Container */}
      <div
        className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-full lg:w-1/2 ${isSignUp ? "lg:translate-x-full opacity-0 z-0" : "z-10 opacity-100"
          }`}
      >
        <SignInForm onToggle={toggleView} isWrapper={true} />
      </div>

      {/* Overlay Container (Only visible on Large Screens) */}
      <div
        className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-50 hidden lg:block ${isSignUp ? "-translate-x-full" : ""
          }`}
      >
        <div
          className={`relative -left-full h-full w-[200%] transform transition-transform duration-700 ease-in-out bg-brand-600 text-white ${isSignUp ? "translate-x-1/2" : "translate-x-0"
            }`}
        >
          {/* Overlay Left (For Sign In) */}
          <div
            className={`absolute top-0 flex flex-col items-center justify-center w-1/2 h-full px-10 text-center transition-transform duration-700 ease-in-out transform ${isSignUp ? "translate-x-0" : "-translate-x-[20%]"
              }`}
          >
            <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
            <p className="mb-8 text-lg font-light">
              To keep connected with us please login with your personal info
            </p>
            <button
              className="px-10 py-3 border border-white rounded-full font-semibold tracking-wider uppercase transition-transform transform hover:scale-105 focus:outline-none"
              onClick={toggleView}
            >
              Sign In
            </button>
          </div>

          {/* Overlay Right (For Sign Up) */}
          <div
            className={`absolute top-0 right-0 flex flex-col items-center justify-center w-1/2 h-full px-10 text-center transition-transform duration-700 ease-in-out transform ${isSignUp ? "translate-x-[20%]" : "translate-x-0"
              }`}
          >
            <h1 className="text-3xl font-bold mb-4">Hello, Friend!</h1>
            <p className="mb-8 text-lg font-light">
              Enter your personal details and start your journey with us
            </p>
            <button
              className="px-10 py-3 border border-white rounded-full font-semibold tracking-wider uppercase transition-transform transform hover:scale-105 focus:outline-none"
              onClick={toggleView}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
