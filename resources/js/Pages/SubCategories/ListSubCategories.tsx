import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import Pagination from "../../Shared/Pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CreateSubCategoryModal from "../../Pages/SubCategories/CreateSubCategoryModal";
import EditSubCategoryModal from "../../Pages/SubCategories/EditSubCategoryModal";

interface SubCategory {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
}

interface SubCategoriesData {
  data: SubCategory[];
  current_page: number;
  total: number;
  per_page: number;
}

interface ListSubCategoriesProps {
  subcategories: SubCategoriesData;
  filters?: { search?: string };
  categories: Category[]; // Added categories prop
}

interface Category {
  id: number;
  name: string;
}

export default function ListSubCategories({ subcategories, filters = {}, categories }: ListSubCategoriesProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/subcategories', { search }, { replace: true });
  };

  const handlePaginate = (page: number) => {
    router.get('/subcategories', { page, search }, { replace: true });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this subcategory?")) {
      router.delete(`/subcategories/${id}`);
    }
  };

  return (
    <AuthenticatedLayout header="SubCategory Management">
      <div className="mx-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 my-6">
          {/* Search */}
          <form onSubmit={handleSearch} className="mb-4 flex space-x-2">
            <input
              type="text"
              placeholder="Search subcategories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 rounded border-gray-300 shadow-sm px-3 py-2"
            />
          </form>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
          >
            Create SubCategory
          </button>
        </div>

        {/* Table */}
        <div className="relative overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.data.length > 0 ? (
                subcategories.data.map((subcategory) => (
                  <tr key={subcategory.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{subcategory.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{subcategory.name}</td>
                    <td className="px-6 py-4">{subcategory.category?.name || "No category"}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setEditingSubCategory(subcategory)}
                          className="bg-green-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-green-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subcategory.id)}
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
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No subcategories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="my-10">
          <Pagination
            current_page={subcategories.current_page}
            total={subcategories.total}
            per_page={subcategories.per_page}
            onPaginate={handlePaginate}
          />
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateSubCategoryModal
            onClose={() => setShowCreateModal(false)}
            categories={categories} // Pass categories to the modal
          />
        )}
        {editingSubCategory && (
          <EditSubCategoryModal
            subcategory={{ ...editingSubCategory, category_id: editingSubCategory.category?.id || 0 }}
            categories={categories} // Pass categories to the modal
            onClose={() => setEditingSubCategory(null)}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}