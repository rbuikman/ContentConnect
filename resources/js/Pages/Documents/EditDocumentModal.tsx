// resources/js/Pages/Documents/EditDocumentModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { MultiSelect } from "primereact/multiselect";
import { TabView, TabPanel } from 'primereact/tabview';

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
  file_path: string | null;
  mime_type: string | null;
  original_filename: string | null;
  file_size: number | null;
  is_network_path: boolean;
  active: boolean;
  created_by: string;
  modified_by: string | null;
  created_at: string;
  updated_at: string;
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
  template?: boolean; // Add template parameter to determine context
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
  template = false, // Destructure template with default value
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
  const [contentSearchTerm, setContentSearchTerm] = useState<string>("");
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

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

  // Filter content based on search term
  const getFilteredContents = () => {
    if (!contentSearchTerm.trim()) {
      return contents;
    }
    return contents.filter(content => 
      content.name.toLowerCase().includes(contentSearchTerm.toLowerCase()) ||
      (content.original_filename && content.original_filename.toLowerCase().includes(contentSearchTerm.toLowerCase()))
    );
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-200/80" onClick={onClose} />

      <div
        className="relative bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
                {/* Header - Fixed */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{template ? 'Edit Template' : 'Edit Document'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="edit-document-form" onSubmit={handleSubmit}>
            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
              <TabPanel header="Document Details">
                <div className="space-y-4">
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
                </div>
              </TabPanel>
              
              <TabPanel header="Languages & Content">
                <div className="space-y-4">
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
              Associated Content (Optional)
            </label>
            
            {/* Content Search Bar */}
            {contents && contents.length > 0 && (
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search content by name or filename..."
                    value={contentSearchTerm}
                    onChange={(e) => setContentSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <i className="pi pi-search absolute left-2.5 top-2.5 text-gray-400 text-sm"></i>
                  {contentSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setContentSearchTerm("")}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <i className="pi pi-times text-sm"></i>
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Content Selection Grid */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {(() => {
                const filteredContents = getFilteredContents();
                return filteredContents && filteredContents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredContents.map((content) => {
                      const isSelected = selectedContentIds.includes(content.id);
                      const isExcelFile = content.mime_type?.includes('spreadsheet') || content.mime_type?.includes('excel');
                      const isImageFile = content.mime_type?.startsWith('image/');
                      
                      return (
                        <div
                          key={content.id}
                          onClick={() => {
                            const currentSelection = contents.filter(c => selectedContentIds.includes(c.id));
                            if (isSelected) {
                              // Remove from selection
                              const newSelection = currentSelection.filter(c => c.id !== content.id);
                              handleContentChange(newSelection);
                            } else {
                              // Add to selection
                              handleContentChange([...currentSelection, content]);
                            }
                          }}
                          className={`
                            cursor-pointer border-2 rounded-lg p-3 transition-all duration-200 hover:shadow-md
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-50 shadow-sm' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            {/* Thumbnail/Icon Area */}
                            <div className={`flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-100 overflow-hidden ${
                              isImageFile && content.file_path ? 'w-16 h-16' : 'w-12 h-12'
                            }`}>
                              {isImageFile && content.file_path ? (
                                <img 
                                  src={`/contents/preview/${content.id}`}
                                  alt={content.name}
                                  className="w-full h-full object-cover rounded-lg shadow-sm"
                                  onError={(e) => {
                                    // Fallback to icon if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.className = 'flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100';
                                      parent.innerHTML = `
                                        <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded flex items-center justify-center">
                                          <i class="pi pi-image text-white text-lg"></i>
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                              ) : isExcelFile ? (
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded flex items-center justify-center">
                                  <i className="pi pi-file-excel text-white text-lg"></i>
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded flex items-center justify-center">
                                  <i className="pi pi-file text-white text-lg"></i>
                                </div>
                              )}
                            </div>
                            
                            {/* Content Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-medium text-gray-900 truncate pr-2">
                                  {content.name}
                                </h4>
                                {isSelected && (
                                  <i className="pi pi-check-circle text-blue-500 flex-shrink-0"></i>
                                )}
                              </div>
                              
                              <div className="mt-1 space-y-1">
                                {content.original_filename && (
                                  <p className="text-xs text-gray-500 truncate">
                                    📄 {content.original_filename}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                    ${content.is_network_path 
                                      ? 'bg-orange-100 text-orange-800' 
                                      : 'bg-blue-100 text-blue-800'
                                    }
                                  `}>
                                    <i className={`pi ${content.is_network_path ? 'pi-link' : 'pi-desktop'} text-xs`}></i>
                                    {content.is_network_path ? 'Network' : 'Local'}
                                  </span>
                                  {content.file_size && (
                                    <span className="text-gray-400">
                                      {formatFileSize(content.file_size)}
                                    </span>
                                  )}
                                </div>
                                
                                {isImageFile && (
                                  <div className="text-xs text-purple-600 font-medium">
                                    🖼️ Image File
                                  </div>
                                )}
                                {isExcelFile && (
                                  <div className="text-xs text-green-600 font-medium">
                                    📊 Excel File
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="pi pi-inbox text-3xl mb-2 block"></i>
                    {contentSearchTerm ? (
                      <>
                        <p>No content found for "{contentSearchTerm}"</p>
                        <p className="text-sm">Try a different search term</p>
                      </>
                    ) : (
                      <>
                        <p>No contents available</p>
                        <p className="text-sm">Upload some content files first</p>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
            
            {/* Selected Items Summary */}
            {selectedContentIds.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <i className="pi pi-check-circle text-blue-600"></i>
                  <span className="text-sm font-medium text-blue-800">
                    {selectedContentIds.length} content{selectedContentIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {contents?.filter(c => selectedContentIds.includes(c.id)).map((content) => (
                    <span key={content.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                      {content.name}
                      <button
                        type="button"
                        onClick={() => {
                          const newSelection = contents.filter(c => selectedContentIds.includes(c.id) && c.id !== content.id);
                          handleContentChange(newSelection);
                        }}
                        className="ml-1 hover:text-blue-600"
                      >
                        <i className="pi pi-times text-xs"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {errors?.content_ids && <p className="text-red-600 text-sm mt-2">{errors.content_ids}</p>}
          </div>
                </div>
              </TabPanel>
            </TabView>
          </form>
        </div>
        
        {/* Fixed Buttons */}
        <div className="flex justify-between p-4 pt-2 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-document-form"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
