import AuthWrapper from "@/components/auth/AuthWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up for MyResto",
  description: "Sign Up for MyResto to create your account",
};

export default function SignUp() {
  return <AuthWrapper initialView="signup" />;
}
