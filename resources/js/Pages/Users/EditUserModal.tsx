// resources/js/Pages/Users/EditUserModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

interface Role {
  id: number;
  name: string;
}

interface AppUser {
  id: number;
  name: string;
  email: string;
  roles: Role[];
}

interface EditUserProps {
  user: AppUser;
  roles?: Role[];
  onClose: () => void;
}

interface FormDataShape {
  name: string;
  email: string;
  roles: number[];
}

export default function EditUserModal({ user, roles = [], onClose }: EditUserProps) {
  const { errors } = usePage().props as any;

  const [form, setForm] = useState<FormDataShape>({
    name: user.name,
    email: user.email,
    roles: user.roles.map(r => r.id) || [],
  });

  // Update form if user changes
  useEffect(() => {
    setForm({
      name: user.name,
      email: user.email,
      roles: user.roles.map(r => r.id) || [],
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectRole = (roleId: number) => {
    setForm(prev =>
      prev.roles.includes(roleId)
        ? { ...prev, roles: prev.roles.filter(id => id !== roleId) }
        : { ...prev, roles: [...prev.roles, roleId] }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.put(`/users/${user.id}`, form as any, {
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
          <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors?.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors?.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Roles */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Roles</h4>
            <div className="flex flex-wrap gap-2">
              {roles.length > 0 ? (
                roles.map(role => (
                  <label key={role.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(role.id)}
                      onChange={() => handleSelectRole(role.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{role.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No roles available.</p>
              )}
            </div>
            {errors?.roles && <p className="text-red-600 text-sm mt-1">{errors.roles}</p>}
          </div>

          {/* Buttons: Cancel left, Save right */}
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
