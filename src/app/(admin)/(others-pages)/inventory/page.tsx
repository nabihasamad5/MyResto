"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import Select from "@/components/form/Select";

type MenuItem = {
  id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  is_available: number;
  image: string | null;
  prep_time_minutes: number | null;
  popularity: number | null;
  created_at: string;
  updated_at: string;
};

type MenuCategory = {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    description: "",
    price: "",
    is_available: "1",
    prep_time_minutes: "",
    popularity: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catForm, setCatForm] = useState({
    name: "",
    description: "",
    sort_order: "",
  });

  const baseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL as string;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  }, []);

  const categoryOptions = useMemo(() => {
    return categories.map((c) => ({ value: String(c.id), label: c.name }));
  }, [categories]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resItems, resCats] = await Promise.all([
        fetch(`${baseUrl}/api/menu/items`, { cache: "no-store" }),
        fetch(`${baseUrl}/api/menu/categories`, { cache: "no-store" })
      ]);
      const jsonItems = await resItems.json();
      const jsonCats = await resCats.json();

      if (resItems.ok) setItems(jsonItems?.data || []);
      if (resCats.ok) setCategories(jsonCats?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [baseUrl]);

  const openModal = () => { setIsOpen(true); setEditingId(null); setForm({ name: "", category_id: "", description: "", price: "", is_available: "1", prep_time_minutes: "", popularity: "" }); setImageFile(null); setIsCustomCategory(false); };
  const closeModal = () => setIsOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const handleEdit = (it: MenuItem) => {
    setEditingId(it.id);
    setForm({
      name: it.name || "",
      category_id: String(it.category_id ?? ""),
      description: String(it.description || ""),
      price: String(it.price ?? ""),
      is_available: String(it.is_available ?? 1),
      prep_time_minutes: String(it.prep_time_minutes ?? ""),
      popularity: String(it.popularity ?? ""),
    });
    setImageFile(null);
    setIsCustomCategory(false);
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.category_id) fd.append("category_id", form.category_id);
      if (form.description) fd.append("description", form.description);
      if (form.price) fd.append("price", form.price);
      if (form.is_available) fd.append("is_available", form.is_available);
      if (form.prep_time_minutes) fd.append("prep_time_minutes", form.prep_time_minutes);
      if (form.popularity) fd.append("popularity", form.popularity);
      if (imageFile) fd.append("image", imageFile);

      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${baseUrl}/api/menu/items/${editingId}` : `${baseUrl}/api/menu/items`;

      const res = await fetch(url, { method, body: fd });
      if (res.ok) {
        await fetchData();
        closeModal();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${baseUrl}/api/menu/items/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        if (data.softDelete) {
          alert(data.message || "Item marked as unavailable (soft deleted) because it has existing orders.");
          setItems((prev) => prev.map((x) => (x.id === id ? { ...x, is_available: 0 } : x)));
        } else {
          setItems((prev) => prev.filter((x) => x.id !== id));
        }
      } else {
        alert(data.error || "Failed to delete item");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    }
  };

  const triggerFilePick = () => {
    fileInputRef.current?.click();
  };

  // --- CATEGORY HANDLERS ---
  const openCatModal = () => { setIsCatOpen(true); setEditingCatId(null); setCatForm({ name: "", description: "", sort_order: "" }); };
  const closeCatModal = () => setIsCatOpen(false);

  const handleCatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCatForm((f) => ({ ...f, [name]: value }));
  };

  const handleEditCat = (cat: MenuCategory) => {
    setEditingCatId(cat.id);
    setCatForm({
      name: cat.name,
      description: cat.description || "",
      sort_order: String(cat.sort_order ?? 0),
    });
    setIsCatOpen(true);
  };

  const handleSaveCat = async () => {
    try {
      setSubmitting(true);
      const body = {
        name: catForm.name,
        description: catForm.description,
        sort_order: Number(catForm.sort_order),
      };

      const method = editingCatId ? "PUT" : "POST";
      const url = editingCatId ? `${baseUrl}/api/menu/categories/${editingCatId}` : `${baseUrl}/api/menu/categories`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchData();
        closeCatModal();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!confirm("Are you sure? This might affect items in this category.")) return;
    const res = await fetch(`${baseUrl}/api/menu/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Inventory Management" />

      <div className="mb-6 flex space-x-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("items")}
          className={`pb-2 text-sm font-medium transition-all ${activeTab === "items" ? "border-b-2 border-brand-500 text-brand-500" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
        >
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`ml-3 lg:ml-5 pb-2 text-sm font-medium transition-all ${activeTab === "categories" ? "border-b-2 border-brand-500 text-brand-500" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
        >
          Categories
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {activeTab === "items" ? "Menu Items" : "Menu Categories"}
          </h3>
          <Button size="sm" onClick={activeTab === "items" ? openModal : openCatModal}>
            {activeTab === "items" ? "Add Item" : "Add Category"}
          </Button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">Loading…</div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            {activeTab === "items" ? (
              <div className="min-w-[1000px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Image</TableCell>
                      <TableCell isHeader>Name</TableCell>
                      <TableCell isHeader>Category</TableCell>
                      <TableCell isHeader>Price</TableCell>
                      <TableCell isHeader>Available</TableCell>
                      <TableCell isHeader>Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => {
                      const catName = categories.find(c => c.id === it.category_id)?.name || "—";
                      return (
                        <TableRow key={it.id}>
                          <TableCell>
                            <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                              <Image src={it.image || "/images/logo/logo.png"} alt={it.name} width={48} height={48} className="w-12 h-12 object-cover" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="block font-medium text-gray-800 dark:text-white">{it.name}</span>
                          </TableCell>
                          <TableCell>{catName}</TableCell>
                          <TableCell>{Number(it.price).toFixed(2)}</TableCell>
                          <TableCell>{it.is_available ? "Yes" : "No"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(it)}>Edit</Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(it.id)}>Delete</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>ID</TableCell>
                      <TableCell isHeader>Name</TableCell>
                      <TableCell isHeader>Description</TableCell>
                      <TableCell isHeader>Sort Order</TableCell>
                      <TableCell isHeader>Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.id}</TableCell>
                        <TableCell>
                          <span className="block font-medium text-gray-800 dark:text-white">{c.name}</span>
                        </TableCell>
                        <TableCell>{c.description || "—"}</TableCell>
                        <TableCell>{c.sort_order}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditCat(c)}>Edit</Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteCat(c.id)}>Delete</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ITEMS MODAL */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white">{editingId ? "Update Menu Item" : "Add Menu Item"}</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">{editingId ? "Update existing item" : "Create a new item"}</p>
          </div>
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input name="name" value={form.name} onChange={handleChange} />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  options={categoryOptions}
                  value={form.category_id}
                  onChange={(val) => handleSelectChange("category_id", val)}
                  placeholder="Select category"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input name="description" value={form.description} onChange={handleChange} />
              </div>
              <div>
                <Label>Price</Label>
                <Input name="price" type="number" value={form.price} onChange={handleChange} />
              </div>
              <div>
                <Label>Available (1/0)</Label>
                <Input name="is_available" value={form.is_available} onChange={handleChange} />
              </div>
              <div>
                <Label>Prep Time (min)</Label>
                <Input name="prep_time_minutes" value={form.prep_time_minutes} onChange={handleChange} />
              </div>
              <div>
                <Label>Popularity</Label>
                <Input name="popularity" value={form.popularity} onChange={handleChange} />
              </div>
              <div className="lg:col-span-2">
                <Label>Image</Label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                {(() => {
                  const currentImage = editingId ? (items.find((x) => x.id === editingId)?.image || null) : null;
                  const display = imagePreview || currentImage;
                  return (
                    <div className="mt-3">
                      <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                        {display ? (
                          <img src={display} alt="Selected" className="w-40 h-40 object-cover" />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button size="sm" variant="outline" onClick={triggerFilePick}>Upload</Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>Close</Button>
              <Button size="sm" onClick={handleSave} disabled={submitting}>Save</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* CATEGORY MODAL */}
      <Modal isOpen={isCatOpen} onClose={closeCatModal} className="max-w-[500px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white">{editingCatId ? "Update Category" : "Add Category"}</h4>
          </div>
          <form className="flex flex-col gap-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={catForm.name} onChange={handleCatChange} />
            </div>
            <div>
              <Label>Description</Label>
              <Input name="description" value={catForm.description} onChange={handleCatChange} />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input name="sort_order" type="number" value={catForm.sort_order} onChange={handleCatChange} />
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeCatModal}>Close</Button>
              <Button size="sm" onClick={handleSaveCat} disabled={submitting}>Save</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
