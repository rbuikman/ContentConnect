// resources/js/Pages/Roles/ListRoles.tsx
import React, { useState } from "react";
import { router } from "@inertiajs/react";
import Pagination from "../../Shared/Pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CreateRoleModal from "./CreateRoleModal";
import EditRoleModal from "./EditRoleModal";

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: Permission[];
}

interface RolesData {
  data: Role[];
  current_page: number;
  total: number;
  per_page: number;
}

interface ListRolesProps {
  roles: RolesData;
  permissions: Permission[];
  filters?: { search?: string };
}

export default function ListRoles({ roles, permissions, filters }: ListRolesProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [search, setSearch] = useState(filters?.search || "");

  const handlePaginate = (page: number) => {
    router.get(
      route("roles.index"),
      { page, search },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      router.delete(route("roles.destroy", id));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(
      route("roles.index"),
      { search },
      { preserveState: true, replace: true }
    );
  };

  return (
    <AuthenticatedLayout header="Role Management">
      <div className="mx-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 my-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
          >
            Create Role
          </button>
          <form onSubmit={handleSearch} className="w-full sm:flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="relative overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Guard</th>
                <th className="px-6 py-3 font-semibold">Permissions</th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.data.length > 0 ? (
                roles.data.map((role) => (
                  <tr
                    key={role.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">{role.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {role.name}
                    </td>
                    <td className="px-6 py-4">{role.guard_name}</td>
                    <td className="px-6 py-4">
                      {role.permissions.map((p) => p.name).join(", ")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setEditingRole(role)}
                          className="bg-green-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-green-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="bg-red-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="my-10">
          <Pagination
            current_page={roles.current_page}
            total={roles.total}
            per_page={roles.per_page}
            onPaginate={handlePaginate}
          />
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateRoleModal
            permissions={permissions}
            onClose={() => setShowCreateModal(false)}
          />
        )}
        {editingRole && (
          <EditRoleModal
            role={editingRole}
            permissions={permissions}
            onClose={() => setEditingRole(null)}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
