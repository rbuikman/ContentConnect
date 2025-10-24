// resources/js/Pages/Statuses/EditStatusModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

interface Company {
  id: number;
  name: string;
}

interface Status {
  id: number;
  name: string;
  active: boolean;
  company_id: number;
  company?: Company;
  sortorder: number;
}

interface EditStatusProps {
  status: Status;
  onClose: () => void;
  companies?: Company[];
}

interface FormDataShape {
  name: string;
  active: boolean;
  company_id?: number;
  sortorder: number;
}

export default function EditStatusModal({ status, onClose, companies = [] }: EditStatusProps) {
  const { errors } = usePage().props as any;
  const page = usePage();
  const permissions = page.props.auth?.permissions || [];
  const currentCompanyId = page.props.auth?.user?.company_id;

  // Helper function to check if user has permission
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const [form, setForm] = useState<FormDataShape>({
    name: status.name,
    active: status.active,
    company_id: currentCompanyId ?? status.company_id,
    sortorder: status.sortorder ?? 0,
  });

  // Update form if status changes
  useEffect(() => {
    setForm({
      name: status.name,
      active: status.active,
      company_id: currentCompanyId ?? status.company_id,
      sortorder: status.sortorder ?? 0,
    });
  }, [status, currentCompanyId]);

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
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.put(`/statuses/${status.id}`, { ...form }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Status</h2>
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
            />
            {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
          </div>
          <div className="mb-4">
            <label htmlFor="sortorder" className="block text-sm font-medium text-gray-700">
              Sort Order
            </label>
            <input
              type="number"
              id="sortorder"
              name="sortorder"
              value={form.sortorder}
              onChange={handleChange}
              min={0}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.sortorder && <div className="text-red-500 text-sm mt-1">{errors.sortorder}</div>}
          </div>

          {/* Company Selection - Always shown, always disabled, preselected to current user's company */}
          {companies.length > 0 && (
            <div className="mb-4">
              <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <select
                id="company_id"
                name="company_id"
                value={form.company_id || ''}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
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
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Inactive statuses will not be available for selection in documents</p>
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