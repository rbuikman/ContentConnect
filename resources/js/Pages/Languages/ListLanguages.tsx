import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Pagination from "../../Shared/Pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CreateLanguageModal from "@/Pages/Languages/CreateLanguageModal";
import EditLanguageModal from "@/Pages/Languages/EditLanguageModal";

interface Company {
  id: number;
  name: string;
}

interface Language {
  id: number;
  name: string;
  code: string;
  active: boolean;
  company_id: number;
  company?: Company;
}

interface LanguagesData {
  data: Language[];
  current_page: number;
  total: number;
  per_page: number;
}

interface ListLanguagesProps {
  languages: LanguagesData;
  filters?: { search?: string };
  companies?: Company[];
}

export default function ListLanguages({ languages, filters = {}, companies = [] }: ListLanguagesProps) {
  const page = usePage();
  const permissions = page.props.auth?.permissions || [];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [search, setSearch] = useState(filters.search || '');

  // Helper function to check if user has permission
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      router.get('/languages', { search }, { replace: true });
  };

  const handlePaginate = (page: number) => {
      router.get('/languages', { page, search }, { replace: true });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this language?")) {
      router.delete(`/languages/${id}`);
    }
  };

  const toggleActive = (id: number, currentActive: boolean) => {
    router.put(`/languages/${id}`, { active: !currentActive }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout header="Language Management">
      <div className="mx-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 my-6">
          {hasPermission('language-create') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
            >
              Create Language
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
                <th className="px-6 py-3 font-semibold">Code</th>
                {hasPermission('superadmin') && (
                  <th className="px-6 py-3 font-semibold">Company</th>
                )}
                <th className="px-6 py-3 font-semibold text-center">Active</th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.data.length > 0 ? (
                languages.data.map((language) => (
                  <tr key={language.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{language.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{language.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {language.code}
                      </span>
                    </td>
                    {hasPermission('superadmin') && (
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {language.company?.name || 'N/A'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive(language.id, language.active)}
                        className={`text-lg ${language.active ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'} transition`}
                        title={language.active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {language.active ? '✓' : '✗'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                            {hasPermission('language-edit') && (
                              <button
                                onClick={() => setEditingLanguage(language)}
                                className="bg-green-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-green-600 transition"
                              >
                                Edit
                              </button>
                            )}
                            {hasPermission('language-delete') && (
                              <button
                                onClick={() => handleDelete(language.id)}
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
                  <td colSpan={hasPermission('superadmin') ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                    No languages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="my-10">
          <Pagination
            current_page={languages.current_page}
            total={languages.total}
            per_page={languages.per_page}
            onPaginate={handlePaginate}
          />
        </div>

        {/* Modals */}
        {showCreateModal && hasPermission('language-create') && (
          <CreateLanguageModal companies={companies} onClose={() => setShowCreateModal(false)} />
        )}
        {editingLanguage && hasPermission('language-edit') && (
          <EditLanguageModal language={editingLanguage} companies={companies} onClose={() => setEditingLanguage(null)} />
        )}
      </div>
    </AuthenticatedLayout>
  );
}