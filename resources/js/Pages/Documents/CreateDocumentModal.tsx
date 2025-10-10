// resources/js/Pages/Documents/CreateDocumentModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

interface Status {
  id: number;
  name: string;
}

interface CreateDocumentModalProps {
  categories: Category[];
  subcategories: Subcategory[];
  statuses: Status[]; // Add statuses to props
  onClose: () => void;
}

interface FormDataShape {
  order_number: string;
  file_name: string;
  note: string;
  category_id: number | null;
  sub_category_id: number | null;
  status_id: number | null;
}

export default function CreateDocumentModal({
  categories,
  subcategories,
  statuses, // Destructure statuses
  onClose,
}: CreateDocumentModalProps) {
  const { errors } = usePage().props as any;

  const [form, setForm] = useState<FormDataShape>({
    order_number: "",
    file_name: "",
    note: "",
    category_id: null,
    sub_category_id: null,
    status_id: statuses[0]?.id || null,
  });

  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);

  // Update subcategories when category changes
  useEffect(() => {
    if (form.category_id && subcategories?.length) {
      setFilteredSubcategories(
        subcategories.filter((sc) => sc.category_id === form.category_id)
      );
      setForm((prev) => ({ ...prev, sub_category_id: null })); // Reset subcategory
    } else {
      setFilteredSubcategories([]);
      setForm((prev) => ({ ...prev, sub_category_id: null }));
    }
  }, [form.category_id, subcategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "category_id" || name === "sub_category_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", form); // Debug log
    router.post("/documents", form as any, {
      onSuccess: () => {
        console.log("Form submitted successfully");
        onClose();
      },
    });
  };

  console.log("Errors:", errors);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-200/80" onClick={onClose} />

      <div
        className="relative bg-white rounded-lg shadow-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create Document</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Order Number</label>
            <input
              name="order_number"
              value={form.order_number}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
            {errors?.order_number && <p className="text-red-600 text-sm">{errors.order_number}</p>}
          </div>

          {/* File Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">File Name</label>
            <input
              name="file_name"
              value={form.file_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
            {errors?.file_name && <p className="text-red-600 text-sm">{errors.file_name}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category_id"
              value={form.category_id ?? ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors?.category_id && <p className="text-red-600 text-sm">{errors.category_id}</p>}
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Subcategory</label>
            <select
              name="sub_category_id"
              value={form.sub_category_id ?? ""}
              onChange={handleChange}
              disabled={!form.category_id || filteredSubcategories.length === 0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            >
              <option value="">Select subcategory</option>
              {filteredSubcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
            {errors?.sub_category_id && <p className="text-red-600 text-sm">{errors.sub_category_id}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status_id"
              value={form.status_id ?? ""} // Ensure a default empty string if status is null
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            >
              {statuses.map((status: Status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
            {errors?.status_id && <p className="text-red-600 text-sm">{errors.status_id}</p>}
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Create Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
