import React, { useState, useEffect, useRef, useCallback } from "react";
import { FilterMatchMode, FilterService } from 'primereact/api';
import { DataTable, DataTableFilterMeta, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Button } from "primereact/button";
import { Column, ColumnEditorOptions, ColumnFilterElementTemplateOptions, ColumnBodyOptions } from 'primereact/column';
import { Toast } from 'primereact/toast';
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'; // Import ConfirmDialog
import { Tag } from 'primereact/tag';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Menu } from 'primereact/menu';
import { OverlayPanel } from 'primereact/overlaypanel';
import { router, usePage } from "@inertiajs/react";
import { Calendar } from 'primereact/calendar';
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

interface Document {
  id: number;
  order_number: string;
  file_name: string;
  note: string;
  category: Category;
  subcategory: Subcategory;
  status: Status;
  languages?: Language[]; // Add languages relationship
  contents?: Content[]; // Add contents relationship
  base_template?: Template; // Add baseTemplate relationship
  template_id?: number; // Add template_id field
  created_by: string;
  created_at: string;
  modified_by?: string;
  modified_at?: string;
}



interface DocumentsData {
  data: Document[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface ListDocumentsProps {
  documents: DocumentsData;
  categories: Category[];
  subcategories: Subcategory[];
  statuses: Status[]; // Add statuses to props
  languages: Language[]; // Add languages to props
  contents: Content[]; // Add contents to props
  templates: Template[]; // Add templates for document creation
  template?: boolean; // Add template parameter to determine context
  webeditorUrl: string; // Add webeditor base URL from environment
  webeditorDocumentPath: string; // Add webeditor document path from environment
}

interface FlashMessages {
  success?: string;
  error?: string;
}

interface ColumnConfig {
  field: string;
  header: string;
}

const defaultFilters: DataTableFilterMeta = {
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  order_number: { value: null, matchMode: FilterMatchMode.CONTAINS },
  file_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  note: { value: null, matchMode: FilterMatchMode.CONTAINS },
  category: { value: null, matchMode: FilterMatchMode.EQUALS },
  subcategory: { value: null, matchMode: FilterMatchMode.EQUALS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  languages: { value: null, matchMode: 'languageContains' as any },
  contents: { value: null, matchMode: 'contentContains' as any },
  modified_at: { value: null, matchMode: FilterMatchMode.DATE_IS }
};


const ListDocuments: React.FC<ListDocumentsProps> = ({ documents, statuses, categories, subcategories, languages, contents, templates, template = false, webeditorUrl, webeditorDocumentPath }) => {
    const { flash, errors } = usePage().props as any;
    const page = usePage();
    const permissions = page.props.auth?.permissions || [];
    const [loading, setLoading] = useState<boolean>(true);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [currentPage, setCurrentPage] = useState(documents.current_page);
    const [first, setFirst] = useState((documents.current_page - 1) * documents.per_page);
    const [expandedRows, setExpandedRows] = useState<any>(null);
    const toast = useRef<Toast>(null);
    const columnToggleRef = useRef<OverlayPanel>(null);
    // Track sort field and order for DataTable UI
  const [sortField, setSortField] = useState<string | undefined>(page.props.sortField as string | undefined);
  // Only allow 1 or -1 for sortOrder, default to 1 (asc)
  const initialSortOrder = typeof page.props.sortOrder === 'string' ? (page.props.sortOrder === 'asc' ? 1 : page.props.sortOrder === 'desc' ? -1 : 1) : 1;
  const [sortOrder, setSortOrder] = useState<1 | -1>(initialSortOrder);

    // Helper function to check if user has permission
    const hasPermission = (permission: string) => {
        return permissions.includes(permission);
    };

    // Column visibility state
    const allColumns: ColumnConfig[] = [
        { field: 'thumbnail', header: 'Thumbnail' },
        { field: 'order_number', header: 'Order Number' },
        { field: 'file_name', header: 'File Name' },
        { field: 'note', header: 'Note' },
        { field: 'category', header: 'Category' },
        { field: 'subcategory', header: 'Subcategory' },
        { field: 'status', header: 'Status' },
        { field: 'languages', header: 'Languages' },
        { field: 'contents', header: 'Contents' },
        { field: 'modified_at', header: 'Modified At' }
    ];

    // Initialize visible columns from localStorage (default), sessionStorage (current session), or use fallback default
    const getInitialVisibleColumns = (): ColumnConfig[] => {
        try {
            // First check localStorage for user's default preference
            const defaultState = localStorage.getItem('contentconnect-dt-default-columns');
            if (defaultState) {
                const parsedDefault = JSON.parse(defaultState);
                if (parsedDefault.visibleColumns) {
                    return parsedDefault.visibleColumns;
                }
            }
            
            // Then check sessionStorage for current session state
            const stateKey = 'contentconnect-dt-state';
            const storedState = sessionStorage.getItem(stateKey);
            if (storedState) {
                const parsedState = JSON.parse(storedState);
                if (parsedState.visibleColumns) {
                    return parsedState.visibleColumns;
                }
            }
        } catch (error) {
            console.warn('Error loading visible columns from storage:', error);
        }
        // Fallback: show all columns except note
        return allColumns.filter(col => col.field !== 'note');
    };

    const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>(getInitialVisibleColumns());

    useEffect(() => {
  setLoading(false);
  initFilters();
  setCurrentPage(documents.current_page);
  setFirst((documents.current_page - 1) * documents.per_page);
        
        // Register custom filter for languages
        FilterService.register('languageContains', (value: Language[], filter: Language) => {
            if (!filter) return true;
            if (!value || value.length === 0) return false;
            
            // Check if any document language matches the selected filter language
            return value.some(lang => lang.id === filter.id);
        });
        
        // Register custom filter for contents
        FilterService.register('contentContains', (value: Content[], filter: Content) => {
            if (!filter) return true;
            if (!value || value.length === 0) return false;
            
            // Check if any document content matches the selected filter content
            return value.some(content => content.id === filter.id);
        });
        
        // Get search value from URL parameters if it exists
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search');
        if (searchParam) {
            setGlobalFilterValue(searchParam);
        }
    }, []);

    // Show toast messages when flash messages change
    useEffect(() => {
        if (flash?.success) {
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: flash.success,
                life: 5000
            });
        }
        if (flash?.error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: flash.error,
                life: 5000
            });
        }
        if (errors?.error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: errors.error,
                life: 5000
            });
        }
    }, [flash, errors]);

    // Save visible columns to sessionStorage whenever they change
    useEffect(() => {
        try {
            const stateKey = 'contentconnect-dt-state';
            const existingState = sessionStorage.getItem(stateKey);
            let stateToSave = { visibleColumns };
            
            if (existingState) {
                const parsedState = JSON.parse(existingState);
                stateToSave = { ...parsedState, visibleColumns };
            }
            
            sessionStorage.setItem(stateKey, JSON.stringify(stateToSave));
        } catch (error) {
            console.warn('Error saving visible columns to storage:', error);
        }
    }, [visibleColumns]);

    // Save current column visibility as default to localStorage
    const saveAsDefault = () => {
        try {
            const defaultState = { visibleColumns };
            localStorage.setItem('contentconnect-dt-default-columns', JSON.stringify(defaultState));
            
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Column visibility saved as default',
                life: 3000
            });
        } catch (error) {
            console.warn('Error saving default column visibility:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to save default column visibility',
                life: 3000
            });
        }
    };

    const initFilters = () => {
        setFilters(defaultFilters);
        setGlobalFilterValue('');
    };

    // Custom filter function for languages
    const languagesFilterFunction = (value: Language[], filter: Language) => {
        console.log('Language filter called with:', { value, filter });
        if (!filter) return true;
        if (!value || value.length === 0) return false;
        const result = value.some(lang => lang.id === filter.id);
        console.log('Filter result:', result);
        return result;
    };

    // Custom filter function for contents
    const contentsFilterFunction = (value: Content[], filter: Content) => {
        console.log('Content filter called with:', { value, filter });
        if (!filter) return true;
        if (!value || value.length === 0) return false;
        const result = value.some(content => content.id === filter.id);
        console.log('Filter result:', result);
        return result;
    };

    const clearFilter = () => {
        initFilters();
    };

    const getSeverity = (value: Status) => {
        switch (value.name.toLowerCase()) {
            case 'design':
                return 'info';

            case 'review':
                return 'warning';

            case 'ready for production':
                return 'success';

            default:
                return null;
        }
    };

    const onPageChange = (event: any) => {
    const page = event.page + 1; // PrimeReact uses 0-based indexing, Laravel uses 1-based
    setCurrentPage(page);
    setFirst(event.first);
        router.get(window.location.pathname, { 
            page: page,
            search: globalFilterValue 
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
        let _documents = [...documents.data];
        let { newData, index } = e;

        newData.status_id = newData.status.id; // Ensure status_id is set correctly
        newData.category_id = newData.category?.id; // Ensure category_id is set correctly
        newData.sub_category_id = newData.subcategory?.id; // Ensure subcategory_id is set correctly
        
        // Handle language associations
        if (newData.languages) {
            newData.language_ids = newData.languages.map((lang: Language) => lang.id);
        }
        
        // Handle content associations
        if (newData.contents) {
            newData.content_ids = newData.contents.map((content: Content) => content.id);
        }
        
        // Ensure order_number exists for templates (set to empty string if not present)
        if (template && !newData.order_number) {
            newData.order_number = '';
        }

        _documents[index] = newData as Document;

        router.put(`/${template ? 'templates' : 'documents'}/${newData.id}`, newData, {
            onSuccess: () => {
                console.log(`${template ? 'Template' : 'Document'} updated successfully`);
                documents.data = _documents; // Update the current documents state
            },
            onError: (errors) => {
                console.error(`Error updating ${template ? 'template' : 'document'}:`, errors);
            }
        });
    };


    const statusEditor = (options: ColumnEditorOptions) => {
        return (
            <Dropdown
                value={options.value} // Pass the current value directly
                options={statuses}
                onChange={(e: DropdownChangeEvent) => options.editorCallback!(e.value)}
                placeholder="Select a Status"
                optionLabel="name" // Ensure the dropdown displays the status name
                itemTemplate={(option) => {
                    return <Tag value={option.name} severity={getSeverity(option)}></Tag>;
                }}
            />
        );
    };

    const languagesEditor = (options: ColumnEditorOptions) => {
        const currentLanguages = options.value || [];
        const selectedLanguageIds = currentLanguages.map((lang: Language) => lang.id);

        return (
            <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                {languages.map((language: Language) => (
                    <label key={language.id} className="flex items-center space-x-2 text-sm">
                        <input
                            type="checkbox"
                            checked={selectedLanguageIds.includes(language.id)}
                            onChange={(e) => {
                                let updatedLanguages;
                                if (e.target.checked) {
                                    // Add language if checked
                                    updatedLanguages = [...currentLanguages, language];
                                } else {
                                    // Remove language if unchecked
                                    updatedLanguages = currentLanguages.filter((lang: Language) => lang.id !== language.id);
                                }
                                options.editorCallback!(updatedLanguages);
                            }}
                            className="rounded border-gray-300"
                        />
                        <span>{language.name} ({language.code})</span>
                    </label>
                ))}
            </div>
        );
    };

    const statusBodyTemplate = (rowData: Document) => {
        return <Tag value={rowData.status.name} severity={getSeverity(rowData.status)} />;
    };

    const templateBodyTemplate = (rowData: Document) => {
        return rowData.base_template ? (
            <span className="text-blue-600">{rowData.base_template.file_name}</span>
        ) : (
            <span className="text-gray-400">No template</span>
        );
    };

    const statusFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <Dropdown 
                value={options.value} // Bind the selected value
                options={statuses} 
                onChange={(e: DropdownChangeEvent) => {
                    options.filterApplyCallback(e.value);
                }}
                optionLabel="name" // Display the name property in the dropdown
                placeholder="" 
                className="p-column-filter" 
                showClear 
            />
        );
    };

    const languagesBodyTemplate = (rowData: Document) => {
      if (rowData.languages && rowData.languages.length > 0) {
        return (
          <div className="flex flex-wrap gap-1">
            {rowData.languages.map((language: Language) => (
              <Tag key={language.id} value={language.code} className="text-xs" />
            ))}
          </div>
        );
      } else {
        return <span className="text-gray-400 text-xs">-</span>;
      }
    }

    const contentsBodyTemplate = (rowData: Document) => {
      if (rowData.contents && rowData.contents.length > 0) {
        return (
          <div className="flex flex-wrap gap-1">
            {rowData.contents.map((content: Content) => (
              <Tag 
                key={content.id} 
                value={`${content.is_network_path ? "📁" : "📄"} ${content.name}`} 
                className="text-xs" 
              />
            ))}
          </div>
        );
      } else {
        return <span className="text-gray-400 text-xs">-</span>;
      }
    }

    const categoryBodyTemplate = (rowData: Document) => {
      if (rowData.category) {
        return <Tag value={rowData.category.name}/>;
      } else {
        return null;
      }
    }

    const categoryFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
        <Dropdown 
            value={options.value}
            options={categories}
            onChange={(e: DropdownChangeEvent) => {
                    options.filterApplyCallback(e.value);
            }}
            optionLabel="name"
            placeholder=""
            className="p-column-filter"
            showClear
        />
        );
    };

    const subCategoryBodyTemplate = (rowData: Document) => {
      if (rowData.subcategory) {
        return <Tag value={rowData.subcategory.name}/>;
      } else {
        return null;
      }
    }

    const thumbnailBodyTemplate = (rowData: Document) => {
      // Construct thumbnail URL using the document ID
      const thumbnailUrl = `/documents/thumbnail/${rowData.id}`;
      
      return (
        <div className="flex justify-center items-center h-12">
          <img 
            src={thumbnailUrl} 
            alt={`Thumbnail for ${rowData.file_name}`}
            className="w-10 h-10 object-cover rounded shadow-sm border"
            onLoad={() => {
              console.log(`Thumbnail loaded for document ${rowData.id}: ${thumbnailUrl}`);
            }}
            onError={(e) => {
              console.log(`Thumbnail failed to load for document ${rowData.id}: ${thumbnailUrl}`);
              // Show a simple placeholder
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = '<div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">📄</div>';
              }
            }}
          />
        </div>
      );
    }



    const subCategoryFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <Dropdown 
                value={options.value} // Bind the selected value
                options={subcategories} 
                onChange={(e: DropdownChangeEvent) => {
                    options.filterApplyCallback(e.value);
                }}
                optionLabel="name" // Display the name property in the dropdown
                placeholder="" 
                className="p-column-filter"
                showClear 
            />
            /*
            <MultiSelect
                value={options.value}
                options={subcategories}
                itemTemplate={subCategoryBodyTemplate}
                onChange={(e: MultiSelectChangeEvent) => options.filterApplyCallback(e.value)}
                optionLabel="name"
                placeholder="Any"
                className="p-column-filter"
                maxSelectedLabels={1}
                style={{ minWidth: '14rem' }}
                showClear
            />
*/

        );
    };

    const languagesFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <Dropdown 
                value={options.value} // Bind the selected value
                options={languages} 
                onChange={(e: DropdownChangeEvent) => {
                    options.filterApplyCallback(e.value);
                }}
                optionLabel="name" // Display the name property in the dropdown
                placeholder="" 
                className="p-column-filter"
                showClear 
            />
        );
    };

    const contentsFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <Dropdown 
                value={options.value} // Bind the selected value
                options={contents} 
                onChange={(e: DropdownChangeEvent) => {
                    options.filterApplyCallback(e.value);
                }}
                optionLabel="name" // Display the name property in the dropdown
                placeholder="" 
                className="p-column-filter"
                showClear 
            />
        );
    };

    const contentsEditor = (options: ColumnEditorOptions) => {
        const currentContents = options.value || [];
        const selectedContentIds = currentContents.map((content: Content) => content.id);

        return (
            <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                {contents.map((content: Content) => (
                    <label key={content.id} className="flex items-center space-x-2 text-sm">
                        <input
                            type="checkbox"
                            checked={selectedContentIds.includes(content.id)}
                            onChange={(e) => {
                                let updatedContents;
                                if (e.target.checked) {
                                    // Add content if checked
                                    updatedContents = [...currentContents, content];
                                } else {
                                    // Remove content if unchecked
                                    updatedContents = currentContents.filter((cont: Content) => cont.id !== content.id);
                                }
                                options.editorCallback!(updatedContents);
                            }}
                            className="rounded border-gray-300"
                        />
                        <span>{content.is_network_path ? "📁" : "📄"} {content.name}</span>
                    </label>
                ))}
            </div>
        );
    };

    const renderHeader = () => {

        return (

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {template ? (
                  <button
                    onClick={() => {
                      router.post('/templates/read-from-storage', {}, {
                        onSuccess: () => {
                          // Template import completed successfully
                        },
                        onError: (errors) => {
                          console.error('Error reading templates from storage:', errors);
                        }
                      });
                    }}
                    className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
                  >
                    Update Templates from storage
                  </button>
                ) : (
                  hasPermission('document-create') && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
                    >
                      Create&nbsp;Document
                    </button>
                  )
                )}

              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                    <InputText 
                        type="search" 
                        value={globalFilterValue || ''} 
                        onChange={(e) => onGlobalFilterChange(e)} 
                        placeholder="Search" 
                        className="text-sm pl-10 w-full" 
                    />
                </div>
                <Button
                  icon="pi pi-bars"
                  className="p-button-rounded p-button-outlined p-button-sm"
                  onClick={(e) => columnToggleRef.current?.toggle(e)}
                  tooltip="Column Visibility"
                  tooltipOptions={{ position: 'left' }}
                />
              </div>
            </div>
        );
    };

    // Simple debounce function
    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    };

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((searchValue: string) => {
            router.get(window.location.pathname, { 
                search: searchValue,
                page: 1 // Reset to first page when searching
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500),
        []
    );

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGlobalFilterValue(value);
        
        // Use debounced search for better performance
        debouncedSearch(value);
    };

    const textEditor = (options: ColumnEditorOptions) => {
        return <InputText type="text" value={options.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => options.editorCallback!(e.target.value)} />;
    };

    const formatDate = (value: Date) => {
        return value.toLocaleString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Helper function to format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
    };

    const dateBodyTemplate = (rowData: Document) => {
        return formatDate(new Date(rowData.modified_at!));
    };

    const rowExpansionTemplate = (data: Document) => {
        return (
            <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Document Details Section */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Document Details</h4>
                        <div className="space-y-1">
                            <p className="text-sm"><span className="font-medium">Order Number:</span> {data.order_number}</p>
                            <p className="text-sm"><span className="font-medium">File Name:</span> {data.file_name}</p>
                            {data.note && <p className="text-sm"><span className="font-medium">Note:</span> {data.note}</p>}
                            {data.base_template && (
                                <p className="text-sm">
                                    <span className="font-medium">Used template:</span> {data.base_template.file_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Category & Status Section */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Classification</h4>
                        <div className="space-y-1">
                            {data.category && <p className="text-sm"><span className="font-medium">Category:</span> {data.category.name}</p>}
                            {data.subcategory && <p className="text-sm"><span className="font-medium">Subcategory:</span> {data.subcategory.name}</p>}
                            {data.status && (
                                <p className="text-sm">
                                    <span className="font-medium">Status:</span> 
                                    <Tag value={data.status.name} severity={getSeverity(data.status)} className="ml-2" />
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Languages & Timestamps Section */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Additional Info</h4>
                        <div className="space-y-1">
                            {data.languages && data.languages.length > 0 && (
                                <div className="text-sm">
                                    <span className="font-medium">Languages:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {data.languages.map((language: Language) => (
                                            <Tag key={language.id} value={language.code} className="text-xs" />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {data.contents && data.contents.length > 0 && (
                                <div className="text-sm">
                                    <span className="font-medium">Content:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {data.contents.map((content: Content) => (
                                            <Tag key={content.id} value={content.name} className="text-xs" />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <p className="text-sm"><span className="font-medium">Created:</span> {formatDate(new Date(data.created_at!))}</p>
                            <p className="text-sm"><span className="font-medium">Created by:</span> {data.created_by}</p>
                            <p className="text-sm"><span className="font-medium">Modified:</span> {formatDate(new Date(data.modified_at!))}</p>
                            <p className="text-sm"><span className="font-medium">Modified by:</span> {data.modified_by}</p>
                        </div>
                    </div>
                </div>



                {/* Large Thumbnail Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">Preview</h4>
                    <div className="flex justify-center">
                        <img 
                            src={`/documents/thumbnail/${data.id}`} 
                            alt={`Preview of ${data.file_name}`}
                            className="max-w-xs max-h-48 object-contain rounded shadow-lg"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const dateFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <Calendar
                value={options.value ? new Date(options.value) : null} // Convert the value to a Date object if it exists
                onChange={(e) => {
                    const selectedDate = e.value ? new Date(e.value).toISOString().split('T')[0] : null; // Format date to match `modified_at`
                    options.filterCallback(selectedDate, options.index);
                }}
                dateFormat="yyyy-mm-dd" // Match the format of `modified_at`
                placeholder="yyyy-mm-dd"
                mask="9999-99-99"
            />
        );
    };

    // Handle file download with proper error handling
    const handleDownload = async (documentId: number, fileName: string) => {
        try {
            const downloadUrl = `/${template ? 'templates' : 'documents'}/download/${documentId}`;
            const response = await fetch(downloadUrl);
            
            if (!response.ok) {
                let errorMessage = 'Download failed';
                
                if (response.status === 404) {
                    errorMessage = 'File not found. The document may have been moved or deleted.';
                } else if (response.status === 403) {
                    errorMessage = 'Access denied. You do not have permission to download this file, or the file is not accessible due to server permissions.';
                } else if (response.status === 500) {
                    errorMessage = 'Server error occurred while trying to download the file.';
                } else {
                    errorMessage = `Download failed with status ${response.status}`;
                }
                
                toast.current?.show({
                    severity: 'error',
                    summary: 'Download Error',
                    detail: errorMessage,
                    life: 5000
                });
                return;
            }
            
            // Get the file blob and create a download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Show success message
            toast.current?.show({
                severity: 'success',
                summary: 'Download Started',
                detail: `${fileName} download has started`,
                life: 3000
            });
            
        } catch (error) {
            console.error('Download error:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Download Error',
                detail: 'An unexpected error occurred while downloading the file. Please try again.',
                life: 5000
            });
        }
    };

    const openUrlTemplate = (rowData: Document) => {
        return (
          <div>
            {!template && (
              <Button
                  label=""
                  icon="pi pi-external-link"
                  className="p-button-sm p-button-outlined"
                  onClick={() => window.open(`${webeditorUrl}?document=${webeditorDocumentPath}/${rowData.category.name}/${rowData.subcategory.name}/${rowData.file_name}`, '_blank')}
              />
            )}
            <Button
                label=""
                icon="pi pi-download"
                className="p-button-sm p-button-outlined"
                onClick={() => handleDownload(rowData.id, rowData.file_name)}
            />
            </div>
        );
    };



    const handleEdit = (document: Document) => {
        setSelectedDocument(document);
        setShowEditModal(true);
    };

    const handleDelete = (id: number) => {

        router.delete(`/${template ? 'templates' : 'documents'}/${id}`, {
            onSuccess: () => {
                console.log(`${template ? 'Template' : 'Document'} with ID ${id} deleted successfully.`);
            },
            onError: (errors) => {
                console.error(`Error deleting ${template ? 'template' : 'document'} with ID ${id}:`, errors);
            }
        });
    };

    const header = renderHeader();
 
  return (
    <AuthenticatedLayout header={template ? "Template Management" : "Document Management"}>

        <ConfirmDialog /> {/* Ensure ConfirmDialog is rendered */}

        {showCreateModal && hasPermission('document-create') && (
          <CreateDocumentModal
            categories={categories}
            subcategories={subcategories || []} // Ensure it's always an array
            statuses={statuses} // Pass statuses to CreateDocumentModal
            languages={languages} // Pass languages to CreateDocumentModal
            contents={contents || []} // Pass contents to CreateDocumentModal
            templates={templates || []} // Pass templates for selection
            template={template} // Pass template parameter
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {showEditModal && selectedDocument && hasPermission('document-edit') && (
          <EditDocumentModal
            document={{
              id: selectedDocument.id,
              order_number: selectedDocument.order_number,
              file_name: selectedDocument.file_name,
              note: selectedDocument.note,
              category_id: selectedDocument.category?.id || null,
              sub_category_id: selectedDocument.subcategory?.id || null,
              status_id: selectedDocument.status?.id || null,
              languages: selectedDocument.languages,
              contents: selectedDocument.contents
            }}
            categories={categories}
            subcategories={subcategories || []} // Ensure it's always an array
            statuses={statuses} // Pass statuses to EditDocumentModal
            languages={languages} // Pass languages to EditDocumentModal
            contents={contents || []} // Pass contents to EditDocumentModal
            template={template} // Pass template mode to EditDocumentModal
            onClose={() => {
              setShowEditModal(false);
              setSelectedDocument(null);
            }}
          />
        )}

      <div className="card p-fluid">
        <DataTable
          filterDisplay="row" 
          loading={loading}
          stripedRows
          size="small"
          className="compact-table"
          tableStyle={{ minWidth: '50rem' }}
          rowClassName={() => 'compact-row'}
          value={documents.data}
          editMode="row"
          resizableColumns
          paginator={true}
          lazy={true}
          first={(documents.current_page - 1) * documents.per_page}
          rows={documents.per_page}
          totalRecords={documents.total}
          onPage={onPageChange}
          dataKey="id"
          filters={filters}
          globalFilterFields={template ? ['file_name', 'note'] : ['order_number', 'file_name', 'note']}
          emptyMessage="No documents found."
          onFilter={(e) => {
            setFilters(e.filters);
            const filterParams: any = {
              page: 1,
              search: globalFilterValue,
            };
            const getFilterValue = (filter: any) => {
              if (filter && typeof filter === 'object' && 'value' in filter) {
                return filter.value;
              }
              return undefined;
            };
            // Text filters for order_number, file_name, note
            const orderNumberValue = getFilterValue(e.filters.order_number);
            if (orderNumberValue) filterParams.order_number = orderNumberValue;
            const fileNameValue = getFilterValue(e.filters.file_name);
            if (fileNameValue) filterParams.file_name = fileNameValue;
            const noteValue = getFilterValue(e.filters.note);
            if (noteValue) filterParams.note = noteValue;
            // Dropdown filters
            const categoryValue = getFilterValue(e.filters.category);
            if (categoryValue) filterParams.category_id = categoryValue.id || categoryValue;
            const subcategoryValue = getFilterValue(e.filters.subcategory);
            if (subcategoryValue) filterParams.sub_category_id = subcategoryValue.id || subcategoryValue;
            const statusValue = getFilterValue(e.filters.status);
            if (statusValue) filterParams.status_id = statusValue.id || statusValue;
            const languageValue = getFilterValue(e.filters.languages);
            if (languageValue) filterParams.language_id = languageValue.id || languageValue;
            const contentValue = getFilterValue(e.filters.contents);
            if (contentValue) filterParams.content_id = contentValue.id || contentValue;
            const modifiedAtValue = getFilterValue(e.filters.modified_at);
            if (modifiedAtValue) filterParams.modified_at = modifiedAtValue;
            // Debug: log outgoing filter params
            if (typeof router !== 'undefined' && router.get) {
              router.get(window.location.pathname, filterParams, {
                preserveState: true,
                preserveScroll: true,
              });
            }
          }}
          onSort={(e) => {
            // Server-side sorting handler
            setSortField(e.sortField);
            setSortOrder(e.sortOrder === 1 ? 1 : -1);
            const sortParams: any = {
              page: documents.current_page,
              search: globalFilterValue,
              sortField: e.sortField,
              sortOrder: e.sortOrder === 1 ? 'asc' : 'desc',
            };
            // Include filters in sort request
            Object.keys(filters).forEach((key) => {
              const filter = filters[key];
              if (filter && typeof filter === 'object' && 'value' in filter && filter.value) {
                sortParams[key] = filter.value;
              }
            });
            router.get(window.location.pathname, sortParams, {
              preserveState: true,
              preserveScroll: true,
            });
          }}
          sortField={sortField}
          sortOrder={sortOrder as 1 | -1}
          onRowEditComplete={onRowEditComplete}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          scrollable
          scrollHeight="calc(100vh - 294px)"
          header={header}
          removableSort
          reorderableColumns
          stateStorage="session" stateKey="contentconnect-dt-state"
          currentPageReportTemplate={`Showing {first} to {last} of ${documents.total} documents`}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        >
        {/*}  <Column field="id" header="ID" sortable filter filterPlaceholder="Search by ID" style={{ minWidth: '12rem' }}></Column> */}
          <Column expander={true} style={{ width: '3rem', minWidth: '3rem', maxWidth: '3rem' }} />
          {visibleColumns.some(col => col.field === 'thumbnail') && (
            <Column 
              field="thumbnail" 
              body={thumbnailBodyTemplate} 
              header="" 
              style={{ 
                width: '5rem', 
                minWidth: '5rem', 
                maxWidth: '5rem', 
                textAlign: 'center' 
              }}
            ></Column>
          )}

          
          {!template && visibleColumns.some(col => col.field === 'order_number') && (
            <Column field="order_number" header="Order Number" filter sortable filterPlaceholder="" style={{ minWidth: '8rem' }} editor={(options) => textEditor(options)}></Column>
          )}
          {visibleColumns.some(col => col.field === 'file_name') && (
            <Column field="file_name" header="File Name" filter sortable filterPlaceholder="" style={{ minWidth: '12rem' }}></Column>
          )}
          {visibleColumns.some(col => col.field === 'note') && (
            <Column field="note" header="Note" filter sortable filterPlaceholder="" style={{ minWidth: '18rem' }} editor={(options) => textEditor(options)}></Column>
          )}
          {visibleColumns.some(col => col.field === 'category') && (
            <Column field="category" body={categoryBodyTemplate} header="Category" filter filterElement={categoryFilterTemplate} filterPlaceholder="" style={{ minWidth: '9rem' }} showFilterMenu={false}></Column>
          )}
          {visibleColumns.some(col => col.field === 'subcategory') && (
            <Column field="subcategory" body={subCategoryBodyTemplate} header="Subcategory" filter filterElement={subCategoryFilterTemplate} filterPlaceholder="" style={{ minWidth: '9rem' }} showFilterMenu={false}></Column>
          )}
          {visibleColumns.some(col => col.field === 'status') && (
            <Column field="status" body={statusBodyTemplate} header="Status" filter filterElement={statusFilterTemplate} filterPlaceholder="" showFilterMenu={false} editor={(options) => statusEditor(options)}  style={{ minWidth: '8rem' }}></Column>
          )}
          {visibleColumns.some(col => col.field === 'languages') && (
            <Column field="languages" body={languagesBodyTemplate} header="Languages" filter filterElement={languagesFilterTemplate} editor={(options) => languagesEditor(options)} showFilterMenu={false} style={{ minWidth: '10rem' }}></Column>
          )}
          {visibleColumns.some(col => col.field === 'contents') && (
            <Column field="contents" body={contentsBodyTemplate} header="Contents" filter filterElement={contentsFilterTemplate} editor={(options) => contentsEditor(options)} showFilterMenu={false} style={{ minWidth: '12rem' }}></Column>
          )}
        {/*  <Column field="created_by" header="Created By" sortable filter filterPlaceholder="Search by created by" style={{ minWidth: '12rem' }}></Column>
          <Column field="created_at" header="Created At" filter sortable filterPlaceholder="Search by created at" style={{ minWidth: '12rem' }}></Column>
          <Column field="modified_by" header="Modified By" filter sortable filterPlaceholder="Search by modified by" style={{ minWidth: '12rem' }}></Column>*/}
          {visibleColumns.some(col => col.field === 'modified_at') && (
            <Column field="modified_at" body={dateBodyTemplate} header="Modified At" sortable filterPlaceholder="Search by modified at" style={{ minWidth: '12rem' }}  showFilterMenu={false} ></Column>
          )}
          <Column alignFrozen="right" frozen={true} rowEditor={true} header="Actions" headerStyle={{ width: '15%', minWidth: '12rem' }} bodyStyle={{ textAlign: 'center' }} body={(rowData: any, options: ColumnBodyOptions) => (
    <>
      {options.rowEditor?.editing ? (
        <div className="flex gap-1 justify-center">
          <Button
            icon="pi pi-save"
            className="p-button-rounded p-button-outlined"
            onClick={(e) =>
              options.rowEditor?.onSaveClick &&
              options.rowEditor?.onSaveClick(e)
            }
            tooltipOptions={{ position: "top" }}
          />
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-outlined"
            onClick={(e) =>
              options.rowEditor?.onCancelClick &&
              options.rowEditor?.onCancelClick(e)
            }
            tooltipOptions={{ position: "top" }}
            severity="warning"
          />
        </div>
      ) : (
        <div className="flex gap-1 justify-center">
          {!template && (
            <Button
              icon="pi pi-external-link"
              className="p-button-rounded p-button-outlined"
              onClick={() => window.open(`${webeditorUrl}?document=${webeditorDocumentPath}/${rowData.category.name}/${rowData.subcategory.name}/${rowData.file_name}`, '_blank')}
              tooltipOptions={{ position: "top" }}
              severity="info"
            />
          )}
          <Button
            icon="pi pi-download"
            className="p-button-rounded p-button-outlined"
            onClick={() => handleDownload(rowData.id, rowData.file_name)}
            tooltipOptions={{ position: "top" }}
            severity="help"
          />
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-outlined"
            onClick={(e) =>
              options.rowEditor?.onInitClick &&
              options.rowEditor?.onInitClick(e)
            }
            tooltipOptions={{ position: "top" }}
            severity="success"
          />
          {hasPermission('document-edit') && (
            <Button
              icon="pi pi-pen-to-square"
              className="p-button-rounded p-button-outlined"
              onClick={() => handleEdit(rowData)}
              tooltipOptions={{ position: "top" }}
              severity="secondary"
            />
          )}
          {hasPermission('document-delete') && (
            <Button
              icon="pi pi-trash"
              className="p-button-rounded p-button-outlined"
              tooltipOptions={{ position: "top" }}
              severity="danger"
              onClick={() =>
                confirmDialog({
                  message: "Are you sure you want to delete?",
                  header: "Confirmation",
                  icon: "pi pi-exclamation-triangle",
                  accept: () => handleDelete(rowData.id),
                })
              }
            />
          )}
        </div>
      )}
    </>
  )}></Column>

        </DataTable>
      </div>

      <OverlayPanel ref={columnToggleRef} className="w-80">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-700">Column Visibility</h4>
            <button
              type="button"
              onClick={() => columnToggleRef.current?.hide()}
              className="text-gray-500 hover:text-gray-800 transition-colors duration-200"
              aria-label="Close dialog"
            >
              <i className="pi pi-times text-lg"></i>
            </button>
          </div>
          <div className="space-y-2">
            {allColumns.map((column) => {
              const isVisible = visibleColumns.some(col => col.field === column.field);
              return (
                <label key={column.field} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setVisibleColumns([...visibleColumns, column]);
                      } else {
                        setVisibleColumns(visibleColumns.filter(col => col.field !== column.field));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{column.header}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
            <div className="flex gap-2">
              <Button
                label="Show All"
                icon="pi pi-check"
                size="small"
                outlined
                onClick={() => setVisibleColumns([...allColumns])}
                className="flex-1"
              />
              <Button
                label="Hide All"
                icon="pi pi-times"
                size="small"
                outlined
                severity="secondary"
                onClick={() => setVisibleColumns([])}
                className="flex-1"
              />
            </div>
            <Button
              label="Use as default"
              icon="pi pi-save"
              size="small"
              outlined
              severity="help"
              onClick={saveAsDefault}
              className="w-full"
            />
          </div>
        </div>
      </OverlayPanel>

      <Toast ref={toast} position="top-right" />
    </AuthenticatedLayout>
  );
};

export default ListDocuments;