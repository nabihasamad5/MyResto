"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useUser } from "@/hooks/useUser";

export default function AddRestaurantPage() {
    const router = useRouter();
    const { userData } = useUser();
    const [created_by, setCreatedBy] = useState("");
    const [status, setStatus] = useState("");
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState("low");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (userData?.id) {
            setCreatedBy(String(userData.id));
            setStatus("Pending");
            console.log("The User ID: ", userData.id);
        }
    }, [userData]);
    const categoryOptions = [
        { value: "academic", label: "Academic" },
        { value: "facilities", label: "Facilities" },
        { value: "finance", label: "Finance" },
        { value: "hostel", label: "Hostel" },
        { value: "transport", label: "Transport" },
        { value: "technical", label: "Technical" },
        { value: "billing", label: "Billing" },
        { value: "service", label: "Service" },
        { value: "administrative", label: "Administrative" },
        { value: "product", label: "Product" },
        { value: "other", label: "Other" },
    ];

    const priorityOptions = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        // Basic validation
        if (!title.trim() || !description.trim() || !category) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        const payload = { title, category, priority, description, image, status, created_by };

        try {
            const res = await fetch("/api/complaint/add-complaint", {

                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                // Safely parse error response as JSON; fallback to status text
                let message = res.statusText;
                try {
                    const data = await res.json();
                    if (data.message) message = data.message;
                } catch {
                    // If response is not JSON (e.g., 404 HTML), keep statusText
                }
                throw new Error(message || "Failed to post complaint");
            }

            // Reset form state
            setTitle("");
            setCategory("");
            setPriority("low");
            setDescription("");
            setImage("");
            setStatus("Pending"); // ensure status is reset to default
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <PageBreadcrumb pageTitle="Add New Restaurant" />
            <div className="space-y-6">
                <ComponentCard title="Restaurant Form">
                    {error && (
                        <Alert
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
                            title="Restaurant Submitted"
                            message="Your complaint has been successfully submitted."
                            showLink={true}
                            linkHref="/Restaurants"
                            linkText="Go to Restaurants"
                        />
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                placeholder="Brief title of the complaint"
                                defaultValue={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                options={categoryOptions}
                                placeholder="Select Category"
                                defaultValue={category}
                                onChange={(val) => setCategory(val)}
                                className="dark:bg-dark-900"
                            />
                        </div>

                        {/* Priority */}
                        <div>
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                options={priorityOptions}
                                placeholder="Select Priority"
                                defaultValue={priority}
                                onChange={(val) => setPriority(val)}
                                className="dark:bg-dark-900"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description">Description *</Label>
                            <TextArea
                                placeholder="Detailed description of the issue"
                                rows={5}
                                value={description}
                                onChange={(value) => setDescription(value)}
                            />
                        </div>

                        {/* Image (optional) */}
                        <div>
                            <Label htmlFor="image">Image URL (optional)</Label>
                            <Input
                                id="image"
                                placeholder="https://example.com/image.jpg"
                                defaultValue={image}
                                onChange={(e) => setImage(e.target.value)}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <Button disabled={loading}>
                                {loading ? "Submitting..." : "Submit Restaurant"}
                            </Button>
                            <Button variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </ComponentCard>
            </div>
        </div>
    );
}
