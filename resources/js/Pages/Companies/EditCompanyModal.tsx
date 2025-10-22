// resources/js/Pages/Companies/EditCompanyModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

interface Company {
  id: number;
  name: string;
  numberoflicences: number;
  created_at: string;
  updated_at: string;
}

interface EditCompanyProps {
  company: Company;
  onClose: () => void;
}

interface FormDataShape {
  name: string;
  numberoflicences: string;
}

export default function EditCompanyModal({ company, onClose }: EditCompanyProps) {
  const { errors } = usePage().props as any;

  const [form, setForm] = useState<FormDataShape>({
    name: company.name,
    numberoflicences: company.numberoflicences.toString(),
  });

  // Update form if company changes
  useEffect(() => {
    setForm({
      name: company.name,
      numberoflicences: company.numberoflicences.toString(),
    });
  }, [company]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.put(`/companies/${company.id}`, { 
      name: form.name,
      numberoflicences: parseInt(form.numberoflicences) || 0
    }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Company</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
            {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
          </div>
          
          <div className="mb-4">
            <label htmlFor="numberoflicences" className="block text-sm font-medium text-gray-700">
              Number of Licences
            </label>
            <input
              type="number"
              id="numberoflicences"
              name="numberoflicences"
              value={form.numberoflicences}
              onChange={handleChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
            {errors.numberoflicences && <div className="text-red-500 text-sm mt-1">{errors.numberoflicences}</div>}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white rounded-md px-4 py-2 mr-2 hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white rounded-md px-4 py-2 hover:bg-indigo-700 transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}