// resources/js/Pages/Documents/ListDocuments.tsx
import React, { useState } from "react";
import { router } from "@inertiajs/react";
import Pagination from "../../Shared/Pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import CreateDocumentModal from "./CreateDocumentModal";
import EditDocumentModal from "./EditDocumentModal";

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

interface Status {
  id: number;
  name: string;
}

interface Language {
  id: number;
  name: string;
  code: string;
}

export interface DocumentData {
  id: number;
  order_number: string;
  file_name: string;
  note: string;
  category_id: number;
  sub_category_id: number;
  status_id: number; // Changed from `status` to `status_id`
  created_by: string;
  created_at: string;
  modified_by?: string;
  modified_at?: string;
}

interface DocumentsData {
  data: DocumentData[];
  current_page: number;
  total: number;
  per_page: number;
}

interface ListDocumentsProps {
  documents: DocumentsData;
  categories: Category[];
  subcategories: Subcategory[];
  statuses: Status[]; // Add statuses to props
  languages: Language[]; // Add languages to props
}

export default function ListDocuments({
  documents,
  categories,
  subcategories,
  statuses, // Destructure statuses
  languages, // Destructure languages
}: ListDocumentsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentData | null>(null);
  const [search, setSearch] = useState("");

  const handlePaginate = (page: number) => {
    router.get(`/documents?page=${page}&search=${search}`, {}, { replace: true });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      router.delete(`/documents/${id}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(`/documents?search=${search}`, {}, { replace: true });
  };

  const safeDocuments = documents?.data ?? [];

  // Transform `editingDocument` to match the `Document` type expected by `EditDocumentModal`
  const transformedEditingDocument = editingDocument
    ? {
        ...editingDocument,
        status: statuses.find((s) => s.id === editingDocument.status_id) || null, // Map status_id to Status object
      }
    : null;

  return (
    <AuthenticatedLayout header="Document Management">
      <div className="mx-5">
        {/* Header + Search */}
        <div className="flex justify-between items-center my-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
          >
            Create Document
          </button>
          <form onSubmit={handleSearchSubmit} className="ml-4 flex items-center">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search documents..."
              className="px-3 py-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="ml-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="relative overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Order Number</th>
                <th className="px-6 py-3 font-semibold">File Name</th>
                <th className="px-6 py-3 font-semibold">Note</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Subcategory</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Created By</th>
                <th className="px-6 py-3 font-semibold">Created At</th>
                <th className="px-6 py-3 font-semibold">Modified By</th>
                <th className="px-6 py-3 font-semibold">Modified At</th>
                <th className="px-6 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeDocuments.length > 0 ? (
                safeDocuments.map((doc) => {
                  const category = categories.find((c) => c.id === doc.category_id)?.name ?? "";
                  const subcategory = subcategories.find((sc) => sc.id === doc.sub_category_id)?.name ?? "";
                  const status = statuses.find((s) => s.id === doc.status_id)?.name ?? ""; // Map status_id to status name
                  return (
                    <tr key={doc.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">{doc.id}</td>
                      <td className="px-6 py-4">{doc.order_number}</td>
                      <td className="px-6 py-4">{doc.file_name}</td>
                      <td className="px-6 py-4">{doc.note}</td>
                      <td className="px-6 py-4">{category}</td>
                      <td className="px-6 py-4">{subcategory}</td>
                      <td className="px-6 py-4">{status}</td>
                      <td className="px-6 py-4">{doc.created_by || "-"}</td>
                      <td className="px-6 py-4">{doc.created_at ? new Date(doc.created_at).toLocaleString() : "-"}</td>
                      <td className="px-6 py-4">{doc.modified_by || "-"}</td>
                      <td className="px-6 py-4">{doc.modified_at ? new Date(doc.modified_at).toLocaleString() : "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setEditingDocument(doc)}
                            className="bg-green-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-green-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="bg-red-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="my-10">
          <Pagination
            current_page={documents?.current_page ?? 1}
            total={documents?.total ?? 0}
            per_page={documents?.per_page ?? 10}
            onPaginate={handlePaginate}
          />
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateDocumentModal
            categories={categories}
            subcategories={subcategories || []} // Ensure it's always an array
            statuses={statuses} // Pass statuses to CreateDocumentModal
            languages={languages} // Pass languages to CreateDocumentModal
            templates={[]} // Pass empty templates array
            onClose={() => setShowCreateModal(false)}
          />
        )}
        {transformedEditingDocument && (
          <EditDocumentModal
            document={transformedEditingDocument}
            categories={categories}
            subcategories={subcategories}
            statuses={statuses} // Pass statuses to EditDocumentModal
            languages={languages} // Pass languages to EditDocumentModal
            onClose={() => setEditingDocument(null)}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
