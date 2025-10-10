// resources/js/Pages/Roles/EditRoleModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

interface EditRoleProps {
  role: Role;
  permissions?: Permission[];
  onClose: () => void;
}

interface FormDataShape {
  name: string;
  permissions: number[];
}

export default function EditRoleModal({ role, permissions = [], onClose }: EditRoleProps) {
  const { errors } = usePage().props as any;

  const [form, setForm] = useState<FormDataShape>({
    name: role.name,
    permissions: role.permissions.map(p => p.id) || [],
  });

  useEffect(() => {
    setForm({
      name: role.name,
      permissions: role.permissions.map(p => p.id) || [],
    });
  }, [role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectPermission = (id: number) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter(pid => pid !== id)
        : [...prev.permissions, id]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.put(`/roles/${role.id}`, form as any, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-200/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-lg max-w-lg w-full p-6"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Role</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Role Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors?.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Permissions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
            <div className="flex flex-wrap gap-2">
              {permissions.length > 0 ? (
                permissions.map(p => (
                  <label key={p.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(p.id)}
                      onChange={() => handleSelectPermission(p.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{p.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No permissions available.</p>
              )}
            </div>
            {errors?.permissions && <p className="text-red-600 text-sm mt-1">{errors.permissions}</p>}
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
