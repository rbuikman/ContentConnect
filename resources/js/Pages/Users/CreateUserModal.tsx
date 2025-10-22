// resources/js/Pages/Users/CreateUserModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

interface Role {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
}

interface CreateUserProps {
  roles?: Role[];
  companies?: Company[];
  onClose: () => void;
}

interface FormDataShape {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company_id: number | null;
  roles: number[];
}

export default function CreateUserModal({ roles = [], companies = [], onClose }: CreateUserProps) {
  const { errors } = usePage().props as any;
  const page = usePage();
  const userPermissions = page.props.auth?.permissions || [];
  const currentUser = page.props.auth?.user;

  // Filter companies based on user permissions
  const filteredCompanies = React.useMemo(() => {
    const canManageCompanies = userPermissions.includes('company-index');
    return canManageCompanies ? companies : [];
  }, [companies, userPermissions]);

  // Determine initial company_id based on user permissions
  const initialCompanyId = React.useMemo(() => {
    const isSuperAdmin = userPermissions.includes('superadmin');
    // If not SuperAdmin, auto-assign current user's company
    return isSuperAdmin ? null : (currentUser?.company_id || null);
  }, [userPermissions, currentUser]);

  // Filter roles based on user permissions
  const filteredRoles = React.useMemo(() => {
    const canManageCompanyPermissions = userPermissions.includes('superadmin');
    
    if (canManageCompanyPermissions) {
      return roles;
    }
    
    // Filter out SuperAdmin role if user doesn't have superadmin permission
    return roles.filter(role => role.name !== 'SuperAdmin');
  }, [roles, userPermissions]);

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

  const [form, setForm] = useState<FormDataShape>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    company_id: initialCompanyId,
    roles: [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, company_id: e.target.value ? Number(e.target.value) : null }));
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
    router.post("/users", form as any, {
      onSuccess: () => onClose(),
    });
  };

  const handleClose = () => onClose();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-200/80"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create User</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}  autoComplete="off" className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="off"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors?.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="new-email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors?.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors?.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              name="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={handleChange}
              autoComplete="new-password2"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors?.password_confirmation && (
              <p className="text-red-600 text-sm mt-1">{errors.password_confirmation}</p>
            )}
          </div>

          {/* Company */}
          {filteredCompanies.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={form.company_id || ""}
                onChange={handleCompanyChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a company</option>
                {filteredCompanies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors?.company_id && <p className="text-red-600 text-sm mt-1">{errors.company_id}</p>}
            </div>
          ) : (
            // Show company info when auto-assigned for non-SuperAdmin users
            initialCompanyId && currentUser?.company && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  <span className="text-gray-700">{currentUser.company.name}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">New user will be assigned to your company.</p>
              </div>
            )
          )}

          {/* Roles */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Roles</h4>
            <div className="flex flex-wrap gap-2">
              {filteredRoles.length > 0 ? (
                filteredRoles.map(role => (
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

          {/* Buttons: Cancel left, Submit right */}
          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
