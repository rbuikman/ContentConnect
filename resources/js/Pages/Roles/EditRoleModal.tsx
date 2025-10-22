// resources/js/Pages/Roles/EditRoleModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import { router, usePage } from "@inertiajs/react";

interface Permission {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
  active: boolean;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
  company_id?: number;
  company?: Company;
}

interface EditRoleProps {
  role: Role;
  permissions?: Permission[];
  companies?: Company[];
  onClose: () => void;
}

interface FormDataShape {
  name: string;
  permissions: number[];
  company_id?: number;
}

export default function EditRoleModal({ role, permissions = [], companies = [], onClose }: EditRoleProps) {
  const { errors } = usePage().props as any;
  const page = usePage();
  const userPermissions = page.props.auth?.permissions || [];

  const [form, setForm] = useState<FormDataShape>({
    name: role.name,
    permissions: role.permissions.map(p => p.id),
    company_id: role.company_id,
  });

  // Filter permissions based on user's access to company permissions
  const filteredPermissions = useMemo(() => {
    const canManageCompanyPermissions = userPermissions.includes('superadmin');
    
    if (canManageCompanyPermissions) {
      return permissions;
    }
    
    // Filter out company-related permissions and superadmin permission if user doesn't have superadmin permission
    return permissions.filter(permission => 
      !permission.name.startsWith('company-') && permission.name !== 'superadmin'
    );
  }, [permissions, userPermissions]);

  // Group permissions by module (first part before dash)
  const groupedPermissions = useMemo(() => {
    const groups: { [key: string]: Permission[] } = {};
    
    filteredPermissions.forEach(permission => {
      const module = permission.name.split('-')[0];
      const moduleKey = module.charAt(0).toUpperCase() + module.slice(1);
      
      if (!groups[moduleKey]) {
        groups[moduleKey] = [];
      }
      groups[moduleKey].push(permission);
    });
    
    return groups;
  }, [filteredPermissions]);

  // Update form if role changes
  useEffect(() => {
    setForm({
      name: role.name,
      permissions: role.permissions.map(p => p.id),
      company_id: role.company_id,
    });
  }, [role]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value: string | number | undefined = e.target.value;
    
    if (e.target.name === 'company_id') {
      value = e.target.value === '' ? undefined : Number(e.target.value);
    }
    
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSelectPermission = (id: number) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter(pid => pid !== id)
        : [...prev.permissions, id]
    }));
  };

  const handleSelectAllForModule = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map(p => p.id);
    const allSelected = moduleIds.every(id => form.permissions.includes(id));
    
    setForm(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(id => !moduleIds.includes(id))
        : [...new Set([...prev.permissions, ...moduleIds])]
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
        className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
                {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Edit Role</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl font-bold w-8 h-8 flex items-center justify-center"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Role Name */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter role name"
              />
              {errors?.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Company Selection (SuperAdmin only) */}
            {userPermissions.includes('superadmin') && companies.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <select
                  key={`company-select-${role.id}`}
                  name="company_id"
                  value={form.company_id ? String(form.company_id) : ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Global Role (All Companies)</option>
                  {companies.map((company) => (
                    <option key={company.id} value={String(company.id)}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors?.company_id && <p className="text-red-600 text-sm mt-1">{errors.company_id}</p>}
              </div>
            )}

            {/* Permissions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Permissions</h4>
              
              {Object.keys(groupedPermissions).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                    const allSelected = modulePermissions.every(p => form.permissions.includes(p.id));
                    const someSelected = modulePermissions.some(p => form.permissions.includes(p.id));
                    
                    return (
                      <div key={module} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-800 text-base">{module}</h5>
                          <button
                            type="button"
                            onClick={() => handleSelectAllForModule(modulePermissions)}
                            className={`text-xs px-2 py-1 rounded ${
                              allSelected 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {modulePermissions.map(permission => {
                            const action = permission.name.split('-').slice(1).join('-');
                            const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
                            
                            return (
                              <label key={permission.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={form.permissions.includes(permission.id)}
                                  onChange={() => handleSelectPermission(permission.id)}
                                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">{actionLabel}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No permissions available.</p>
              )}
              
              {errors?.permissions && <p className="text-red-600 text-sm mt-1">{errors.permissions}</p>}
            </div>
          </div>

          {/* Fixed Footer Buttons */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
