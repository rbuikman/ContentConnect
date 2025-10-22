import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Pagination from "../../Shared/Pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CreateStatusModal from "@/Pages/Statuses/CreateStatusModal";
import EditStatusModal from "@/Pages/Statuses/EditStatusModal";

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
}

interface StatusesData {
  data: Status[];
  current_page: number;
  total: number;
  per_page: number;
}

interface ListStatusesProps {
  statuses: StatusesData;
  filters?: { search?: string };
  companies?: Company[];
}

export default function ListStatuses({ statuses, filters = {}, companies = [] }: ListStatusesProps) {
  const page = usePage();
  const permissions = page.props.auth?.permissions || [];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [search, setSearch] = useState(filters.search || '');

  // Helper function to check if user has permission
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      router.get('/statuses', { search }, { replace: true });
  };

  const handlePaginate = (page: number) => {
      router.get('/statuses', { page, search }, { replace: true });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this status?")) {
      router.delete(`/statuses/${id}`);
    }
  };

  const toggleActive = (id: number, currentActive: boolean) => {
    router.put(`/statuses/${id}`, { active: !currentActive }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout header="Status Management">
      <div className="mx-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 my-6">
          {hasPermission('status-create') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
            >
              Create Status
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
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                {hasPermission('superadmin') && (
                  <th className="px-6 py-3 font-semibold">Company</th>
                )}
                <th className="px-6 py-3 font-semibold text-center">Active</th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {statuses.data.length > 0 ? (
                statuses.data.map((status) => (
                  <tr key={status.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{status.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{status.name}</td>
                    {hasPermission('superadmin') && (
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {status.company?.name || 'N/A'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive(status.id, status.active)}
                        className={`text-lg ${status.active ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'} transition`}
                        title={status.active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {status.active ? '✓' : '✗'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                            {hasPermission('status-edit') && (
                              <button
                                onClick={() => setEditingStatus(status)}
                                className="bg-green-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-green-600 transition"
                              >
                                Edit
                              </button>
                            )}
                            {hasPermission('status-delete') && (
                              <button
                                onClick={() => handleDelete(status.id)}
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
                  <td colSpan={hasPermission('superadmin') ? 5 : 4} className="px-6 py-4 text-center text-gray-500">
                    No statuses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="my-10">
          <Pagination
            current_page={statuses.current_page}
            total={statuses.total}
            per_page={statuses.per_page}
            onPaginate={handlePaginate}
          />
        </div>

        {/* Modals */}
        {showCreateModal && hasPermission('status-create') && (
          <CreateStatusModal onClose={() => setShowCreateModal(false)} companies={companies} />
        )}
        {editingStatus && hasPermission('status-edit') && (
          <EditStatusModal status={editingStatus} onClose={() => setEditingStatus(null)} companies={companies} />
        )}
      </div>
    </AuthenticatedLayout>
  );
}