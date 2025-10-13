// resources/js/Pages/Categories/EditCategoryModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

interface Category {
  id: number;
  name: string;
}

interface EditCategoryProps {
  category: Category;
  onClose: () => void;
}

interface FormDataShape {
  name: string;
}

export default function EditCategoryModal({ category, onClose }: EditCategoryProps) {
  const { errors } = usePage().props as any;

  const [form, setForm] = useState<FormDataShape>({
    name: category.name,
  });

  // Update form if category changes
  useEffect(() => {
    setForm({
      name: category.name,
    });
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.put(`/categories/${category.id}`, { ...form }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white rounded-md px-4 py-2 mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-md px-4 py-2"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
