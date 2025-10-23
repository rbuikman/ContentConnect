// resources/js/Pages/Documents/CreateDocumentModal.tsx
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

interface Template {
  id: number;
  file_name: string;
  category_id: number;
  sub_category_id: number;
  languages?: Language[];
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

interface CreateDocumentModalProps {
  categories: Category[];
  subcategories: Subcategory[];
  statuses: Status[]; // Add statuses to props
  languages: Language[]; // Add languages to props
  contents: Content[]; // Add contents to props
  templates: Template[]; // Add templates for selection
  template?: boolean; // Add template parameter
  onClose: () => void;
}

interface FormDataShape {
  order_number: string;
  file_name: string;
  note: string;
  category_id: number | null;
  sub_category_id: number | null;
  status_id: number | null;
  template_id: number | null; // Add template_id field
  language_ids: number[]; // Add language_ids field
  content_ids: number[]; // Add content_ids field
}

export default function CreateDocumentModal({
  categories,
  subcategories,
  statuses, // Destructure statuses
  languages, // Destructure languages
  contents, // Destructure contents
  templates, // Destructure templates
  template = false, // Default to false for documents
  onClose,
}: CreateDocumentModalProps) {
  const { errors } = usePage().props as any;

  const [form, setForm] = useState<FormDataShape>({
    order_number: "",
    file_name: "",
    note: "",
    category_id: null,
    sub_category_id: null,
    status_id: null, // Don't pre-select status - make it required
    template_id: null, // Initialize template_id
    language_ids: [], // Initialize language_ids
    content_ids: [], // Initialize content_ids
  });

  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>(languages);
  const [createPerLanguage, setCreatePerLanguage] = useState<boolean>(true);
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

  // Update subcategories when category changes
  useEffect(() => {
    if (form.category_id && subcategories?.length) {
      setFilteredSubcategories(
        subcategories.filter((sc) => sc.category_id === form.category_id)
      );
      setForm((prev) => ({ ...prev, sub_category_id: null, template_id: null })); // Reset subcategory and template
    } else {
      setFilteredSubcategories([]);
      setForm((prev) => ({ ...prev, sub_category_id: null, template_id: null }));
    }
  }, [form.category_id, subcategories]);

  // Update templates when category or subcategory changes
  useEffect(() => {
    if (form.category_id && form.sub_category_id && templates?.length) {
      setFilteredTemplates(
        templates.filter((tmpl) => 
          tmpl.category_id === form.category_id && tmpl.sub_category_id === form.sub_category_id
        )
      );
    } else {
      setFilteredTemplates([]);
    }
    setForm((prev) => ({ ...prev, template_id: null })); // Reset template selection
  }, [form.category_id, form.sub_category_id, templates]);

  // Update available languages when template is selected
  useEffect(() => {
    if (form.template_id && templates?.length) {
      const selectedTemplate = templates.find(tmpl => tmpl.id === form.template_id);
      if (selectedTemplate && selectedTemplate.languages && selectedTemplate.languages.length > 0) {
        setAvailableLanguages(selectedTemplate.languages);
        // Reset language selection to only include template languages
        setForm((prev) => ({ ...prev, language_ids: [] }));
      } else {
        setAvailableLanguages(languages);
      }
    } else {
      setAvailableLanguages(languages);
      // Don't reset language selection when no template is selected
    }
  }, [form.template_id, templates, languages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "sub_category_id") {
      // Reset template when subcategory changes
      setForm(prev => ({
        ...prev,
        [name]: Number(value),
        template_id: null
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: name === "category_id" || name === "sub_category_id" || name === "status_id" || name === "template_id" ? Number(value) : value,
      }));
    }
  };

  const handleLanguageChange = (languageId: number) => {
    setForm(prev => ({
      ...prev,
      language_ids: prev.language_ids.includes(languageId)
        ? prev.language_ids.filter(id => id !== languageId)
        : [...prev.language_ids, languageId]
    }));
  };

  const handleContentChange = (selectedContents: Content[]) => {
    setForm(prev => ({
      ...prev,
      content_ids: selectedContents.map(content => content.id)
    }));
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
    console.log("Form submitted:", form); // Debug log
    
    // Validate required fields before submitting
    if (!form.order_number.trim()) {
      alert('Order number is required');
      return;
    }
    
    if (!form.file_name.trim()) {
      alert('File name is required');
      return;
    }
    
    if (!form.category_id) {
      alert('Category is required');
      return;
    }
    
    if (!form.sub_category_id) {
      alert('Subcategory is required');
      return;
    }
    
    // For documents (not templates), template is mandatory
    if (!template && !form.template_id) {
      alert('Template selection is required');
      return;
    }
    
    if (!form.status_id) {
      alert('Status is required');
      return;
    }
    
    const route = template ? "/templates" : "/documents";
    
    // If creating per language and multiple languages selected (for documents only)
    if (!template && createPerLanguage && form.language_ids.length > 1) {
      // Create documents sequentially to avoid overwhelming the server
      let currentIndex = 0;
      const totalDocuments = form.language_ids.length;
      
      const createNextDocument = () => {
        if (currentIndex >= totalDocuments) {
          onClose(); // All documents created successfully
          return;
        }
        
        const languageId = form.language_ids[currentIndex];
        const language = availableLanguages.find(lang => lang.id === languageId);
        const formData = {
          ...form,
          language_ids: [languageId], // Single language per document
          file_name: `${form.file_name}_${language?.code || languageId}`
        };
        
        router.post(route, formData as any, {
          onSuccess: () => {
            currentIndex++;
            createNextDocument(); // Create next document
          },
          onError: () => {
            console.error(`Failed to create document for language: ${language?.name || languageId}`);
            // Continue with next document even if one fails
            currentIndex++;
            createNextDocument();
          }
        });
      };
      
      createNextDocument(); // Start creating documents
    } else {
      // Create single document (original behavior)
      const formData = {
        ...form,
        ...(template && { template: true })
      };
      
      router.post(route, formData as any, {
        onSuccess: () => {
          console.log(`${template ? 'Template' : 'Document'} created successfully`);
          onClose();
        },
      });
    }
  };

  console.log("Errors:", errors);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-200/80" onClick={onClose} />

      <div
        className="relative bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {template ? 'Create Template' : 'Create Document'}
          </h3>
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
          <form id="document-form" onSubmit={handleSubmit}>
            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
              <TabPanel header="Document Details">
                <div className="space-y-3">
                  {/* Order Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Order Number *</label>
            <input
              name="order_number"
              value={form.order_number}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
            />
            {errors?.order_number && <p className="text-red-600 text-sm">{errors.order_number}</p>}
          </div>

          {/* File Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">File Name *</label>
            <input
              name="file_name"
              value={form.file_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
              rows={2}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select
              name="category_id"
              value={form.category_id ?? ""}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors?.category_id && <p className="text-red-600 text-sm">{errors.category_id}</p>}
          </div>          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Subcategory *</label>
            <select
              name="sub_category_id"
              value={form.sub_category_id ?? ""}
              onChange={handleChange}
              required
              disabled={!form.category_id || filteredSubcategories.length === 0}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
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

          {/* Template Selection - Only for documents, not templates */}
          {!template  && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Template *</label>
              <select
                name="template_id"
                value={form.template_id ?? ""}
                onChange={handleChange}
                required
                disabled={filteredTemplates.length === 0}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
              >
                <option value="">Select template</option>
                {filteredTemplates.map((tmpl: Template) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.file_name}
                  </option>
                ))}
              </select>
              {filteredTemplates.length === 0 && (
                <p className="text-yellow-600 text-sm mt-1">
                  Please select a category and subcategory to see available templates
                </p>
              )}
              {errors?.template_id && <p className="text-red-600 text-sm">{errors.template_id}</p>}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Status *</label>
            <select
              name="status_id"
              value={form.status_id ?? ""} // Ensure a default empty string if status is null
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
            >
              <option value="">Select status</option>
              {statuses.map((status: Status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
            {errors?.status_id && <p className="text-red-600 text-sm">{errors.status_id}</p>}
          </div>
                </div>
              </TabPanel>
              
              <TabPanel header="Languages & Content">
                <div className="space-y-3">
          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Languages
              {form.template_id && (
                <span className="text-xs text-gray-500 ml-2">
                  (Limited to template languages)
                </span>
              )}
            </label>
            <div className="space-y-1 max-h-24 overflow-y-auto border rounded-md p-2 bg-gray-50">
              {availableLanguages.map((language: Language) => (
                <label key={language.id} className="flex items-center space-x-2 py-0.5">
                  <input
                    type="checkbox"
                    checked={form.language_ids.includes(language.id)}
                    onChange={() => handleLanguageChange(language.id)}
                    className="rounded border-gray-300 w-3.5 h-3.5"
                  />
                  <span className="text-xs">
                    {language.name} ({language.code})
                  </span>
                </label>
              ))}
            </div>
            {availableLanguages.length === 0 && form.template_id && (
              <p className="text-sm text-gray-500 mt-1">
                Selected template has no associated languages
              </p>
            )}
            {errors?.language_ids && <p className="text-red-600 text-sm">{errors.language_ids}</p>}
          </div>


          {/* Create per language option - Only for documents */}
          {!template && form.language_ids.length > 1 && (
            <div className="mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={createPerLanguage}
                  onChange={(e) => setCreatePerLanguage(e.target.checked)}
                  className="rounded border-gray-300 w-3.5 h-3.5"
                />
                <span className="text-xs font-medium text-gray-700">
                  Create a document per language
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-0.5 ml-5">
                {createPerLanguage 
                  ? `Will create ${form.language_ids.length} separate documents, one for each selected language.`
                  : 'Will create one document associated with all selected languages.'
                }
              </p>
            </div>
          )}

          {/* Contents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Associated Content (Optional)
            </label>
            
            {/* Content Selection Grid */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {contents && contents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contents.map((content) => {
                    const isSelected = form.content_ids.includes(content.id);
                    const isExcelFile = content.mime_type?.includes('spreadsheet') || content.mime_type?.includes('excel');
                    const isImageFile = content.mime_type?.startsWith('image/');
                    
                    return (
                      <div
                        key={content.id}
                        onClick={() => {
                          const currentSelection = contents.filter(c => form.content_ids.includes(c.id));
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
                  <p>No contents available</p>
                  <p className="text-sm">Upload some content files first</p>
                </div>
              )}
            </div>
            
            {/* Selected Items Summary */}
            {form.content_ids.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <i className="pi pi-check-circle text-blue-600"></i>
                  <span className="text-sm font-medium text-blue-800">
                    {form.content_ids.length} content{form.content_ids.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {contents?.filter(c => form.content_ids.includes(c.id)).map((content) => (
                    <span key={content.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                      {content.name}
                      <button
                        type="button"
                        onClick={() => {
                          const newSelection = contents.filter(c => form.content_ids.includes(c.id) && c.id !== content.id);
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
            className="px-3 py-1.5 bg-gray-300 rounded hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="document-form"
            className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
          >
            {template ? 'Create Template' : 'Create Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
