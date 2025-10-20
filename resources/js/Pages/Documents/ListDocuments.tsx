import React, { useState, useEffect, useRef, useCallback } from "react";
import { FilterMatchMode } from 'primereact/api';
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
import { router, usePage } from "@inertiajs/react";
import { Calendar } from 'primereact/calendar';
import CreateDocumentModal from "./CreateDocumentModal";

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

interface Template {
  id: number;
  file_name: string;
}

interface Document {
  id: number;
  order_number: string;
  file_name: string;
  note: string;
  category: Category;
  subcategory: Subcategory;
  status: Status;
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
  templates: Template[]; // Add templates for document creation
  template?: boolean; // Add template parameter to determine context
  webeditorUrl: string; // Add webeditor base URL from environment
  webeditorDocumentPath: string; // Add webeditor document path from environment
}

interface FlashMessages {
  success?: string;
  error?: string;
}

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    order_number: { value: null, matchMode: FilterMatchMode.CONTAINS },
    file_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    note: { value: null, matchMode: FilterMatchMode.CONTAINS },
    category: { value: null, matchMode: FilterMatchMode.EQUALS },
    subcategory: { value: null, matchMode: FilterMatchMode.EQUALS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    modified_at: { value: null, matchMode: FilterMatchMode.DATE_IS }
};


const ListDocuments: React.FC<ListDocumentsProps> = ({ documents, statuses, categories, subcategories, templates, template = false, webeditorUrl, webeditorDocumentPath }) => {
    const { flash, errors } = usePage().props as any;
    const [loading, setLoading] = useState<boolean>(true);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        setLoading(false);
        initFilters();
        setCurrentPage(documents.current_page);
        
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

    const initFilters = () => {
        setFilters(defaultFilters);
        setGlobalFilterValue('');
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
        
        // Use Inertia to navigate to the new page
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
                    if (options.filterCallback) {
                        const selectedValue = e.value ? e.value : null; // Use the id property for filtering as status_id
                        options.filterCallback(selectedValue, options.index ?? 0); // Update the filter model
                        var statusId: number | null = null;
                        if (selectedValue) {
                            statusId = selectedValue.id;
                        }
                        // Update the filters state to ensure DataTable reflects the changes
                        setFilters((prevFilters) => ({
                            ...prevFilters,
                            status: { value: selectedValue, matchMode: FilterMatchMode.EQUALS }, // Use status for filtering
                            status_id: { value: statusId, matchMode: FilterMatchMode.EQUALS }, // Use status_id for filtering
                        }));
                    } else {
                        console.error('filterCallback is not defined');
                    }
                }}
                optionLabel="name" // Display the name property in the dropdown
                placeholder="" 
                className="p-column-filter" 
                showClear 
            />
        );
    };

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
                value={options.value} // Bind the selected value
                options={categories} 
                onChange={(e: DropdownChangeEvent) => {
                    if (options.filterCallback) {
                        const selectedValue = e.value ? e.value : null; // Use the id property for filtering as status_id
                        options.filterCallback(selectedValue, options.index ?? 0); // Update the filter model
                        var categoryId: number | null = null;
                        if (selectedValue) {
                            categoryId = selectedValue.id;
                        }
                        // Update the filters state to ensure DataTable reflects the changes
                        setFilters((prevFilters) => ({
                            ...prevFilters,
                            category: { value: selectedValue, matchMode: FilterMatchMode.EQUALS }, // Use status for filtering
                            category_id: { value: categoryId, matchMode: FilterMatchMode.EQUALS }, // Use status_id for filtering
                        }));
                    } else {
                        console.error('filterCallback is not defined');
                    }
                }}
                optionLabel="name" // Display the name property in the dropdown
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



    const subCategoryFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return (
            <Dropdown 
                value={options.value} // Bind the selected value
                options={subcategories} 
                onChange={(e: DropdownChangeEvent) => {
                    if (options.filterCallback) {
                        const selectedValue = e.value ? e.value : null; // Use the id property for filtering as status_id
                        options.filterCallback(selectedValue, options.index ?? 0); // Update the filter model
                        var subCategoryId: number | null = null;
                        if (selectedValue) {
                            subCategoryId = selectedValue.id;
                        }
                        // Update the filters state to ensure DataTable reflects the changes
                        setFilters((prevFilters) => ({
                            ...prevFilters,
                            subcategory: { value: selectedValue, matchMode: FilterMatchMode.EQUALS }, // Use status for filtering
                            sub_category_id: { value: subCategoryId, matchMode: FilterMatchMode.EQUALS }, // Use status_id for filtering
                        }));
                    } else {
                        console.error('filterCallback is not defined');
                    }
                }}
                optionLabel="name" // Display the name property in the dropdown
                placeholder="" 
                className="p-column-filter"
                showClear 
            />
        );
    };

    const renderHeader = () => {

        return (

            <div className="flex justify-between items-center">
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
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
                >
                  Create&nbsp;Document
                </button>
              )}
                <IconField iconPosition="right" className="w-64">
                    <InputIcon className="pi pi-search"  />
                    <InputText type="search" value={globalFilterValue || ''} onChange={(e) => onGlobalFilterChange(e)} placeholder="Search" className="text-sm" />
                </IconField>
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

    const dateBodyTemplate = (rowData: Document) => {
        return formatDate(new Date(rowData.modified_at!));
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

    const openUrlTemplate = (rowData: Document) => {
        return (
          <div>
            <Button
                label=""
                icon="pi pi-external-link"
                className="p-button-sm p-button-outlined"
                onClick={() => window.open(`${webeditorUrl}?document=${webeditorDocumentPath}/${rowData.category.name}/${rowData.subcategory.name}/${rowData.file_name}`, '_blank')}
            />            <Button
                label=""
                icon="pi pi-download"
                className="p-button-sm p-button-outlined"
                onClick={() => window.open(`/storage/${template ? 'templates' : 'documents'}/${rowData.file_name}`, '_blank')}
            />
            </div>
        );
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

        {showCreateModal && (
          <CreateDocumentModal
            categories={categories}
            subcategories={subcategories || []} // Ensure it's always an array
            statuses={statuses} // Pass statuses to CreateDocumentModal
            templates={templates || []} // Pass templates for selection
            template={template} // Pass template parameter
            onClose={() => setShowCreateModal(false)}
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
          paginator
          first={(documents.current_page - 1) * documents.per_page}
          rows={documents.per_page}
          totalRecords={documents.total}
          onPage={onPageChange}
          dataKey="id"
          filters={filters}
         // filterDisplay="row"
          globalFilterFields={template ? ['file_name', 'note'] : ['order_number', 'file_name', 'note']}
          emptyMessage="No documents found."
          onFilter={(e) => setFilters(e.filters)}
          onRowEditComplete={onRowEditComplete} 
          scrollable 
          scrollHeight="calc(100vh - 355px)"
          header={header}
          removableSort
          reorderableColumns
          stateStorage="session" stateKey="contentconnnect-dt-state" 
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} documents" 
        >
        {/*}  <Column field="id" header="ID" sortable filter filterPlaceholder="Search by ID" style={{ minWidth: '12rem' }}></Column> */}
          
          {!template && (
            <Column field="order_number" header="Order Number" filter sortable filterPlaceholder="" style={{ minWidth: '8rem' }} editor={(options) => textEditor(options)}></Column>
          )}
          <Column field="file_name" header="File Name" filter sortable filterPlaceholder="" style={{ minWidth: '12rem' }}></Column>
          <Column field="note" header="Note" filter sortable filterPlaceholder="" style={{ minWidth: '12rem' }} editor={(options) => textEditor(options)}></Column>
          <Column field="category" body={categoryBodyTemplate} header="Category" filter filterElement={categoryFilterTemplate} sortable filterPlaceholder="" style={{ minWidth: '9rem' }} showFilterMenu={false}></Column>
          <Column field="subcategory" body={subCategoryBodyTemplate} header="Subcategory" filter filterElement={subCategoryFilterTemplate} sortable filterPlaceholder="" style={{ minWidth: '9rem' }} showFilterMenu={false}></Column>
          <Column field="status" body={statusBodyTemplate} header="Status" sortable filter filterElement={statusFilterTemplate} filterPlaceholder="" showFilterMenu={false} editor={(options) => statusEditor(options)}  style={{ minWidth: '8rem' }}></Column>
        {/*  <Column field="created_by" header="Created By" sortable filter filterPlaceholder="Search by created by" style={{ minWidth: '12rem' }}></Column>
          <Column field="created_at" header="Created At" filter sortable filterPlaceholder="Search by created at" style={{ minWidth: '12rem' }}></Column>
          <Column field="modified_by" header="Modified By" filter sortable filterPlaceholder="Search by modified by" style={{ minWidth: '12rem' }}></Column>*/}
          <Column field="modified_at" body={dateBodyTemplate} header="Modified At" sortable filterPlaceholder="Search by modified at" style={{ minWidth: '12rem' }}  showFilterMenu={false} ></Column>
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
          <Button
            icon="pi pi-external-link"
            className="p-button-rounded p-button-outlined"
            onClick={() => window.open(`${webeditorUrl}?document=${webeditorDocumentPath}/${rowData.category.name}/${rowData.subcategory.name}/${rowData.file_name}`, '_blank')}
            tooltipOptions={{ position: "top" }}
            severity="info"
          />
          <Button
            icon="pi pi-download"
            className="p-button-rounded p-button-outlined"
            onClick={() => window.open(`/storage/${template ? 'templates' : 'documents'}/${rowData.file_name}`, '_blank')}
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
        </div>
      )}
    </>
  )}></Column>

        </DataTable>
      </div>

      <Toast ref={toast} position="top-right" />
    </AuthenticatedLayout>
  );
};

export default ListDocuments;