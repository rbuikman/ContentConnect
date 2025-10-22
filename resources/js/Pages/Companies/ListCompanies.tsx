import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Pagination from "../../Shared/Pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CreateCompanyModal from "@/Pages/Companies/CreateCompanyModal";
import EditCompanyModal from "@/Pages/Companies/EditCompanyModal";

interface Company {
  id: number;
  name: string;
  numberoflicences: number;
  created_at: string;
  updated_at: string;
}

interface CompaniesData {
  data: Company[];
  current_page: number;
  total: number;
  per_page: number;
}

interface ListCompaniesProps {
  companies: CompaniesData;
  filters?: { search?: string };
}

export default function ListCompanies({ companies, filters = {} }: ListCompaniesProps) {
  const page = usePage();
  const permissions = page.props.auth?.permissions || [];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState(filters.search || '');

  // Helper function to check if user has permission
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      router.get('/companies', { search }, { replace: true });
  };

  const handlePaginate = (page: number) => {
      router.get('/companies', { page, search }, { replace: true });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this company?")) {
      router.delete(`/companies/${id}`);
    }
  };

  return (
    <AuthenticatedLayout header="Company Management">
      <div className="mx-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 my-6">
          {hasPermission('company-create') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
            >
              Create Company
            </button>
          )}
          <form onSubmit={handleSearch} className="w-full sm:flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies..."
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
                <th className="px-6 py-3 font-semibold">Company Name</th>
                <th className="px-6 py-3 font-semibold">Number of Licences</th>
                <th className="px-6 py-3 font-semibold">Created</th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.data.length > 0 ? (
                companies.data.map((company) => (
                  <tr key={company.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{company.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{company.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {company.numberoflicences} licences
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(company.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                            {hasPermission('company-edit') && (
                              <button
                                onClick={() => setEditingCompany(company)}
                                className="bg-green-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-green-600 transition"
                              >
                                Edit
                              </button>
                            )}
                            {hasPermission('company-delete') && (
                              <button
                                onClick={() => handleDelete(company.id)}
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
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6">
          <Pagination
            current_page={companies.current_page}
            total={companies.total}
            per_page={companies.per_page}
            onPaginate={handlePaginate}
          />
        </div>

        {/* Modals */}
        {showCreateModal && hasPermission('company-create') && (
          <CreateCompanyModal
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {editingCompany && hasPermission('company-edit') && (
          <EditCompanyModal
            company={editingCompany}
            onClose={() => setEditingCompany(null)}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}