// resources/js/Pages/Documents/CreateDocumentModal.tsx
import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

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

interface CreateDocumentModalProps {
  categories: Category[];
  subcategories: Subcategory[];
  statuses: Status[]; // Add statuses to props
  languages: Language[]; // Add languages to props
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
}

export default function CreateDocumentModal({
  categories,
  subcategories,
  statuses, // Destructure statuses
  languages, // Destructure languages
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
  });

  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>(languages);
  const [createPerLanguage, setCreatePerLanguage] = useState<boolean>(true);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-200/80" onClick={onClose} />

      <div
        className="relative bg-white rounded-lg shadow-lg max-w-lg w-full p-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
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

        <form onSubmit={handleSubmit} className="space-y-3">
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

          {/* Buttons */}
          <div className="flex justify-between mt-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-300 rounded hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
            >
              {template ? 'Create Template' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
