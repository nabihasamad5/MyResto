import AuthWrapper from "@/components/auth/AuthWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login to MyResto",
  description: "Login to MyResto to access your account",
};

export default function SignIn() {
  return <AuthWrapper initialView="signin" />;
}
