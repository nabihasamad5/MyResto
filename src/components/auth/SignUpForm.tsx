"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import Select from "@/components/form/Select";
import { useRouter } from "next/navigation";

interface SignUpFormProps {
  onToggle?: () => void;
  isWrapper?: boolean;
}

export default function SignUpForm({ onToggle, isWrapper = false }: SignUpFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    address: "",
    avatar: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (formData.gender === "Male") {
      setFormData((prev) => ({ ...prev, avatar: "/images/user/male.jpg" }));
    } else if (formData.gender === "Female") {
      setFormData((prev) => ({ ...prev, avatar: "/images/user/female.jpg" }));
    } else {
      setFormData((prev) => ({ ...prev, avatar: "" }));
    }
  }, [formData.gender]);

  const handleSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (!isChecked) {
      setMessage("You must agree to Terms & Conditions");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Account created successfully! Redirecting...");
        setTimeout(() => router.push("/signin"), 1500);
      } else {
        setMessage(`❌ ${data.error || "Something went wrong"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

  return (
    <div className={`flex flex-col flex-1 w-full overflow-y-auto no-scrollbar ${!isWrapper ? 'lg:w-1/2' : 'h-full justify-center items-center px-8 py-8'}`}>
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
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up!
            </p>
          </div>

          <form onSubmit={handleSubmit as unknown as React.FormEventHandler<HTMLFormElement>}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <Label>First Name<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    id="fname"
                    name="fname"
                    placeholder="Enter your first name"
                    defaultValue={formData.fname}
                    onChange={handleChange}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label>Last Name<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    id="lname"
                    name="lname"
                    placeholder="Enter your last name"
                    defaultValue={formData.lname}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label>Email<span className="text-error-500">*</span></Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  defaultValue={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Phone<span className="text-error-500">*</span></Label>
                <Input
                  type="phone"
                  id="phone"
                  name="phone"
                  placeholder="Enter your phone"
                  defaultValue={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Gender</Label>
                  <Select
                    options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]}
                    placeholder="Select Gender"
                    defaultValue={formData.gender}
                    onChange={(value: string) => setFormData((prev) => ({ ...prev, gender: value }))}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="Enter your address"
                    defaultValue={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label>Password<span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    defaultValue={formData.password}
                    onChange={handleChange}
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

              <div className="flex items-center gap-3">
                <Checkbox
                  className="w-5 h-5"
                  checked={isChecked}
                  onChange={setIsChecked}
                />
                <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                  By creating an account you agree to our{" "}
                  <span className="text-gray-800 dark:text-white/90">
                    Terms & Conditions
                  </span>{" "}
                  and{" "}
                  <span className="text-gray-800 dark:text-white">
                    Privacy Policy
                  </span>
                </p>
              </div>

              {message && (
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  {message}
                </p>
              )}

              <div>
                <button
                  type="submit"
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm font-normal text-gray-700 dark:text-gray-400">
              Already have an account?{" "}
              {isWrapper && onToggle ? (
                <button
                  onClick={onToggle}
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
                >
                  Sign In
                </button>
              ) : (
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
