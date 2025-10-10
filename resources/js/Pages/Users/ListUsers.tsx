import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Pagination from "../../Shared/Pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";

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

interface UsersData {
  data: AppUser[];
  current_page: number;
  total: number;
  per_page: number;
}

interface ListUsersProps {
  users: UsersData;
  roles: Role[];
  filters?: { search?: string }; // optionele search query
}

export default function ListUsers({ users, roles, filters = {} }: ListUsersProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      router.get('/users', { search }, { replace: true });
  };

  const handlePaginate = (page: number) => {
      router.get('/users', { page, search }, { replace: true });
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


        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex space-x-2">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded border-gray-300 shadow-sm px-3 py-2"
          />

        </form>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
          >
            Create User
          </button>

        </div>


        {/* Table */}
        <div className="relative overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Roles</th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.data.length > 0 ? (
                users.data.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{user.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.roles.map((role) => role.name).join(", ")}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                            <button
                            onClick={() => setEditingUser(user)}
                            className="bg-green-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-green-600 transition"
                            >
                            Edit
                            </button>
                            <button
                            onClick={() => handleDelete(user.id)}
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
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="my-10">
          <Pagination
            current_page={users.current_page}
            total={users.total}
            per_page={users.per_page}
            onPaginate={handlePaginate}
          />
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateUserModal roles={roles} onClose={() => setShowCreateModal(false)} />
        )}
        {editingUser && (
          <EditUserModal user={editingUser} roles={roles} onClose={() => setEditingUser(null)} />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
