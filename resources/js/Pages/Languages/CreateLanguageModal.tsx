// resources/js/Pages/Languages/CreateLanguageModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

interface Company {
  id: number;
  name: string;
}

interface CreateLanguageProps {
  onClose: () => void;
  companies?: Company[];
}

interface FormDataShape {
  name: string;
  code: string;
  active: boolean;
  company_id?: number;
}

export default function CreateLanguageModal({ onClose, companies = [] }: CreateLanguageProps) {
  const { errors } = usePage().props as any;
  const page = usePage();
  const permissions = page.props.auth?.permissions || [];

  // Helper function to check if user has permission
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const [form, setForm] = useState<FormDataShape>({
    name: "",
    code: "",
    active: true,
    company_id: companies.length > 0 ? companies[0]?.id : undefined,
  });

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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post("/languages", { ...form }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Language</h2>
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
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., English, Dutch, French"
            />
            {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
          </div>
          
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={form.code}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., en, nl, fr"
              maxLength={10}
            />
            {errors.code && <div className="text-red-500 text-sm mt-1">{errors.code}</div>}
          </div>

          {/* Company Selection - Only visible to SuperAdmin users */}
          {hasPermission('superadmin') && companies.length > 0 && (
            <div className="mb-4">
              <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <select
                id="company_id"
                name="company_id"
                value={form.company_id || ''}
                onChange={(e) => setForm({ ...form, company_id: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.company_id && <div className="text-red-500 text-sm mt-1">{errors.company_id}</div>}
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={form.active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Inactive languages will not be available for selection in documents</p>
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}