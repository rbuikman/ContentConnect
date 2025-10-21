// resources/js/Pages/Documents/EditDocumentModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { MultiSelect } from "primereact/multiselect";

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

interface Content {
  id: number;
  name: string;
  excel_file_path: string | null;
  is_network_path: boolean;
}

interface Document {
  id: number;
  order_number: string;
  file_name: string;
  note: string;
  category_id: number | null;
  sub_category_id: number | null;
  status_id: number | null;
  languages?: Language[];
  contents?: Content[];
}

interface EditDocumentModalProps {
  document: Document;
  categories: Category[];
  subcategories: Subcategory[];
  statuses: Status[]; // Add statuses to props
  languages: Language[]; // Add languages to props
  contents: Content[]; // Add contents to props
  onClose: () => void;
}

// Custom debounce function
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export default function EditDocumentModal({
  document,
  categories,
  subcategories,
  statuses, // Destructure statuses
  languages, // Destructure languages
  contents, // Destructure contents
  onClose,
}: EditDocumentModalProps) {
  const { errors } = usePage().props as any;

  const [form, setForm] = useState<Document>({
    ...document,
    status_id: document.status_id || null, // Use status_id directly
  });
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>(
    document.languages?.map(lang => lang.id) || []
  );
  const [selectedContentIds, setSelectedContentIds] = useState<number[]>(
    document.contents?.map(content => content.id) || []
  );
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (form.category_id && subcategories?.length) {
      setFilteredSubcategories(
        subcategories.filter((sc) => sc.category_id === form.category_id)
      );
    } else {
      setFilteredSubcategories([]);
      setForm((prev) => ({ ...prev, sub_category_id: null }));
    }
  }, [form.category_id, subcategories]);

  // Use the custom debounce function
  const debouncedHandleChange = debounce((name: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [name]: name === "category_id" || name === "sub_category_id" || name === "status_id" ? Number(value) : value,
    }));
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setForm((prev) => {
        // Reset sub_category_id only when category_id changes
        if (name === "category_id") {
            return {
                ...prev,
                [name]: Number(value),
                sub_category_id: null, // Reset subcategory when category changes
            };
        }

        return {
            ...prev,
            [name]: name === "sub_category_id" || name === "status_id" ? Number(value) : value,
        };
    });
  };

  const handleLanguageChange = (languageId: number) => {
    setSelectedLanguageIds(prev => 
      prev.includes(languageId)
        ? prev.filter(id => id !== languageId)
        : [...prev, languageId]
    );
  };

  const handleContentChange = (selectedContents: Content[]) => {
    setSelectedContentIds(selectedContents.map(content => content.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      ...form,
      language_ids: selectedLanguageIds,
      content_ids: selectedContentIds
    };
    router.put(`/documents/${document.id}`, formData as any, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-200/80" onClick={onClose} />

      <div
        className="relative bg-white rounded-lg shadow-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Document</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Order Number</label>
            <input
              name="order_number"
              value={form.order_number}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
            {errors?.order_number && <p className="text-red-600 text-sm">{errors.order_number}</p>}
          </div>

          {/* File Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">File Name</label>
            <input
              name="file_name"
              value={form.file_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
            {errors?.file_name && <p className="text-red-600 text-sm">{errors.file_name}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category_id"
              value={form.category_id ?? ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors?.category_id && <p className="text-red-600 text-sm">{errors.category_id}</p>}
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Subcategory</label>
            <select
              name="sub_category_id"
              value={form.sub_category_id ?? ""}
              onChange={handleChange}
              disabled={!form.category_id || filteredSubcategories.length === 0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            >
              <option value="">Select subcategory</option>
              {filteredSubcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
            {errors?.sub_category_id && <p className="text-red-600 text-sm">{errors.sub_category_id}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status_id"
              value={form.status_id || ""} // Use status_id for the value
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            >
              {statuses.map((status: Status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {languages.map((language: Language) => (
                <label key={language.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedLanguageIds.includes(language.id)}
                    onChange={() => handleLanguageChange(language.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">
                    {language.name} ({language.code})
                  </span>
                </label>
              ))}
            </div>
            {errors?.language_ids && <p className="text-red-600 text-sm">{errors.language_ids}</p>}
          </div>

          {/* Contents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Associated Contents (Optional)
            </label>
            <MultiSelect
              value={contents?.filter(content => selectedContentIds.includes(content.id)) || []}
              onChange={(e) => handleContentChange(e.value)}
              options={contents || []}
              optionLabel="name"
              filter
              placeholder="Select contents to associate with this document"
              maxSelectedLabels={3}
              className="w-full"
              itemTemplate={(option) => (
                <div className="flex items-center gap-2">
                  <i className={`pi ${option?.is_network_path ? 'pi-link' : 'pi-file-excel'} text-sm`}></i>
                  <span>{option?.name || 'Unknown'}</span>
                  <span className="text-xs text-gray-500">
                    ({option?.is_network_path ? 'Network' : 'Local'})
                  </span>
                </div>
              )}
              selectedItemTemplate={(option) => (
                <div className="flex items-center gap-1">
                  <i className={`pi ${option?.is_network_path ? 'pi-link' : 'pi-file-excel'} text-xs`}></i>
                  <span>{option?.name || 'Unknown'}</span>
                </div>
              )}
            />
            {errors?.content_ids && <p className="text-red-600 text-sm">{errors.content_ids}</p>}
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
