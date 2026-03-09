"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

export default function AddStaffPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "",
        phone: "",
        gender: "",
        avatar: "",
        address: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Auto-set image path when gender changes
    useEffect(() => {
        if (form.gender === "Male") {
            setForm((prev) => ({ ...prev, avatar: "/images/user/male.jpg" }));
        } else if (form.gender === "Female") {
            setForm((prev) => ({ ...prev, avatar: "/images/user/female.jpg" }));
        } else {
            setForm((prev) => ({ ...prev, avatar: "" }));
        }
    }, [form.gender]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (field: "role") => (value: string) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        // Basic client-side validation
        if (!form.name || !form.email || !form.password || !form.role || !form.gender) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/admin/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to register staff");
            }

            // Clear form after successful submission
            setForm({
                name: "",
                email: "",
                password: "",
                role: "",
                phone: "",
                gender: "",
                avatar: "",
                address: "",
            });

            // Reset form fields in the DOM
            const formElement = e.target as HTMLFormElement;
            formElement.reset();

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { value: "Waiter", label: "Waiter" },
        { value: "Delivery", label: "Delivery" },
        { value: "Manager", label: "Manager" },
    ];
    const gender = [
        {
            value: "Male", label: "Male"
        },
        {
            value: "Female", label: "Female"
        }
    ]

    

    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            <PageBreadcrumb pageTitle="Add Staff" />
            <div className="space-y-6">
                <ComponentCard title="Add Staff">
                    {error && (<Alert
                        variant="error"
                        title="Error"
                        message={error}
                        showLink={false}
                        linkHref=""
                        linkText=""
                    />
                    )}
                    {success && (
                        <Alert
                            variant="success"
                            title="Staff Added"
                            message="The staff member has been successfully registered."
                                showLink={true}
                            linkHref="/staff"
                            linkText="Go to Staff List"
                        />
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1  lg:grid-cols-2 gap-3 lg:gap-4">
                            <div>
                                <Label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name</Label>
                                <Input
                                    name="name"
                                    type="text"
                                    defaultValue={form.name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                />
                            </div>

                            <div>
                                <Label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</Label>
                                <Input
                                    name="email"
                                    type="email"
                                    defaultValue={form.email}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                />
                            </div>

                            <div>
                                <Label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</Label>
                                <Input
                                    name="password"
                                    type="password"
                                    defaultValue={form.password}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                />
                            </div>

                            <div>
                                <Label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone Number</Label>
                                <Input
                                    name="phone"
                                    type="tel"
                                    defaultValue={form.phone}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                />
                            </div>

                            <div>
                                <Label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Address</Label>
                                <Input
                                    name="address"
                                    type="text"
                                    defaultValue={form.address}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                />
                            </div>

                            
                            <div>
                                <Label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Gender</Label>
                                <Select
                                    options={gender}
                                    placeholder="Select Gender"
                                    defaultValue={form.gender}
                                    onChange={(value) => setForm((prev) => ({ ...prev, gender: value }))}
                                    className="dark:bg-dark-900"
                                />
                            </div>
                            <div>
                                <Label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role</Label>
                                <Select
                                    options={roles}
                                    placeholder="Select Role"
                                    defaultValue={form.role}
                                    onChange={handleSelectChange("role")}
                                    className="dark:bg-dark-900"
                                />
                            </div>

                        </div>
                        <div className="flex items-center gap-4">
                            <Button disabled={loading} type="submit">
                                {loading ? "Submitting..." : "Add Staff"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </ComponentCard>
            </div>
        </div>
    );
}
