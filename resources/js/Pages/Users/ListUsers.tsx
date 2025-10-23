// resources/js/Pages/Users/ListUsers.tsx
import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";

interface Role {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
}

interface AppUser {
  id: number;
  name: string;
  email: string;
  company_id?: number;
  company?: Company;
  roles: Role[];
}

interface UsersData {
  data: AppUser[];
  current_page: number;
  total: number;
  per_page: number;
}

interface ListUsersProps {
  users: UsersData;
  roles: Role[];
  companies: Company[];
  filters?: { search?: string };
}

export default function ListUsers({ users, roles, companies = [], filters }: ListUsersProps) {
  const page = usePage();
  const userPermissions = page.props.auth?.permissions || [];
  const authUser = page.props.auth?.user;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [search, setSearch] = useState(filters?.search || "");

  // Filter users based on user permissions
  const filteredUsers = React.useMemo(() => {
    const isSuperAdmin = userPermissions.includes('superadmin');
    
    if (isSuperAdmin) {
      return users;
    }
    
    // Filter out users with SuperAdmin role if current user doesn't have superadmin permission
    return {
      ...users,
      data: users.data.filter(user => 
        !user.roles.some(role => role.name === 'SuperAdmin')
      )
    };
  }, [users, userPermissions]);

  // Helper function to check if user has permission
  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission);
  };

  // Helper function to check if user can be modified
  const canModifyUser = (user: AppUser) => {
    const isSuperAdmin = userPermissions.includes('superadmin');
    const userIsSuperAdmin = user.roles.some(role => role.name === 'SuperAdmin');
    
    // SuperAdmin can modify anyone, non-SuperAdmin cannot modify SuperAdmin users
    return isSuperAdmin || !userIsSuperAdmin;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/users', { search }, { replace: true });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      router.delete(`/users/${id}`);
    }
  };

  return (
    <AuthenticatedLayout header="User Management">
      <div className="mx-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 my-6">
          {hasPermission('user-create') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
            >
              Create User
            </button>
          )}
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
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Company</th>
                <th className="px-6 py-3 font-semibold">Roles</th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.data.length > 0 ? (
                filteredUsers.data.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.company ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.company.name}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">No Company</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.roles.map((role) => role.name).join(", ")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {hasPermission('user-edit') && canModifyUser(user) && (
                          <button
                            onClick={() => setEditingUser(user)}
                            className="bg-green-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-green-600 transition"
                          >
                            Edit
                          </button>
                        )}
                        {hasPermission('user-delete') && canModifyUser(user) && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                        )}
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
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        {showCreateModal && hasPermission('user-create') && (
          <CreateUserModal
            roles={roles}
            companies={companies}
            onClose={() => setShowCreateModal(false)}
          />
        )}
        {editingUser && hasPermission('user-edit') && (
          <EditUserModal
            user={editingUser}
            roles={roles}
            companies={companies}
            onClose={() => setEditingUser(null)}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
