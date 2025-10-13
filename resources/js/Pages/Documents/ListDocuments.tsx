import React, { useState, useEffect } from "react";
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Button } from "primereact/button";
import { Column, ColumnEditorOptions, ColumnFilterElementTemplateOptions, ColumnBodyOptions } from 'primereact/column';
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
import { router } from "@inertiajs/react";
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

interface Document {
  id: number;
  order_number: string;
  file_name: string;
  note: string;
  category: Category;
  subcategory: Subcategory;
  status: Status;
  created_by: string;
  created_at: string;
  modified_by?: string;
  modified_at?: string;
}



interface DocumentsData {
  data: Document[];
}

interface ListDocumentsProps {
  documents: DocumentsData;
  categories: Category[];
  subcategories: Subcategory[];
  statuses: Status[]; // Add statuses to props
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


const ListDocuments: React.FC<ListDocumentsProps> = ({ documents, statuses, categories, subcategories }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        setLoading(false);
        initFilters();
    }, []);

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

    const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
        let _documents = [...documents.data];
        let { newData, index } = e;

        newData.status_id = newData.status.id; // Ensure status_id is set correctly
        newData.category_id = newData.category?.id; // Ensure category_id is set correctly
        newData.sub_category_id = newData.subcategory?.id; // Ensure subcategory_id is set correctly

        _documents[index] = newData as Document;

        router.put(`/documents/${newData.id}`, newData, {
            onSuccess: () => {
                console.log('Document updated successfully');
                documents.data = _documents; // Update the current documents state
            },
            onError: (errors) => {
                console.error('Error updating document:', errors);
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
                placeholder="Filter Status" 
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

    const categoryEditor = (options: ColumnEditorOptions) => {
        return (
            <Dropdown
                value={options.value} // Pass the current value directly
                options={categories}
                onChange={(e: DropdownChangeEvent) => {
                    options.editorCallback!(e.value); // Update the category value

                    // Trigger an update to the subcategories when the category changes
                    const updatedSubcategories = subcategories.filter(
                        (subcategory) => subcategory.category_id === e.value?.id
                    );

                }}
                placeholder="Select a Category"
                optionLabel="name" // Ensure the dropdown displays the category name
                itemTemplate={(option) => {
                    return <p>{option.name}</p>;
                }}
            />
        );
    };

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
                placeholder="Filter Category" 
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

    const getFilteredSubcategories = (categoryId: number | undefined) => {
        return subcategories.filter(
            (subcategory) => subcategory.category_id === categoryId // Filter by the current category
        );
    };

    const subCategoryEditor = (options: ColumnEditorOptions) => {
        const filteredSubcategories = getFilteredSubcategories(options.rowData.category?.id); // Get filtered subcategories

        return (
            <Dropdown
                value={options.value} // Pass the current value directly
                options={filteredSubcategories} // Use filtered subcategories
                onChange={(e: DropdownChangeEvent) => options.editorCallback!(e.value)}
                placeholder="Select a Sub category"
                optionLabel="name" // Ensure the dropdown displays the subcategory name
                itemTemplate={(option) => {
                    return <p>{option.name}</p>;
                }}
            />
        );
    };

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
                placeholder="Filter Sub Category" 
                className="p-column-filter" 
                showClear 
            />
        );
    };

    const renderHeader = () => {

        return (
          
            <div className="flex justify-content-end" style={{ textAlign: 'right' }}>
              <button
            onClick={() => setShowCreateModal(true)}
            className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
          >
            Create&nbsp;Document
            </button>
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText type="search" value={globalFilterValue || ''} onChange={(e) => onGlobalFilterChange(e)} placeholder="Search" />
                </IconField>
            </div>
        );
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };

        // @ts-ignore
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const textEditor = (options: ColumnEditorOptions) => {
        return <InputText type="text" value={options.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => options.editorCallback!(e.target.value)} />;
    };

    const formatDate = (value: Date) => {
        return value.toLocaleDateString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
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
                onClick={() => window.open(`http://localhost/webeditor/webeditor.php?document=/Valke.net/templates/${rowData.category.name}/${rowData.subcategory.name}/${rowData.file_name}`, '_blank')}
            />            <Button
                label=""
                icon="pi pi-download"
                className="p-button-sm p-button-outlined"
                onClick={() => window.open(`/storage/documents/${rowData.file_name}`, '_blank')}
            />
            </div>
        );
    };



    const handleDelete = (id: number) => {

        router.delete(`/documents/${id}`, {
            onSuccess: () => {
                console.log(`Document with ID ${id} deleted successfully.`);
            },
            onError: (errors) => {
                console.error(`Error deleting document with ID ${id}:`, errors);
            }
        });
    };

    const header = renderHeader();
 
  return (
    <AuthenticatedLayout header="Document Management">
        <ConfirmDialog /> {/* Ensure ConfirmDialog is rendered */}

        {showCreateModal && (
          <CreateDocumentModal
            categories={categories}
            subcategories={subcategories || []} // Ensure it's always an array
            statuses={statuses} // Pass statuses to CreateDocumentModal
            onClose={() => setShowCreateModal(false)}
          />
        )}

      <div className="card p-fluid">
        <DataTable
          filterDisplay="row" 
          loading={loading}
          stripedRows
          size="small"
          tableStyle={{ minWidth: '50rem' }}
          value={documents.data}
          editMode="row" 
          resizableColumns
          paginator
          rows={1000}
          dataKey="id"
          filters={filters}
         // filterDisplay="row"
          globalFilterFields={['order_number', 'file_name', 'note']}
          emptyMessage="No documents found."
          onFilter={(e) => setFilters(e.filters)}
          onRowEditComplete={onRowEditComplete} 
          scrollable scrollHeight="400px" 
          header={header}
          removableSort
          reorderableColumns
          stateStorage="session" stateKey="contentconnnect-dt-state" 
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} documents" 
        >
        {/*}  <Column field="id" header="ID" sortable filter filterPlaceholder="Search by ID" style={{ minWidth: '12rem' }}></Column> */}
           <Column 
              body={openUrlTemplate} 
              header="Actions" 
              style={{ minWidth: '8rem' }}
          />
          
          <Column field="order_number" header="Order Number" filter sortable filterPlaceholder="Filter ordernr" style={{ minWidth: '12rem' }} editor={(options) => textEditor(options)}></Column>
          <Column field="file_name" header="File Name" filter sortable filterPlaceholder="Filter file name" style={{ minWidth: '12rem' }} editor={(options) => textEditor(options)}></Column>
          <Column field="note" header="Note" filter sortable filterPlaceholder="Filter note" style={{ minWidth: '12rem' }} editor={(options) => textEditor(options)}></Column>
          <Column field="category" body={categoryBodyTemplate} header="Category" filter filterElement={categoryFilterTemplate} sortable filterPlaceholder="Filter category" style={{ minWidth: '12rem' }} showFilterMenu={false} editor={(options) => categoryEditor(options)}></Column>
          <Column field="subcategory" body={subCategoryBodyTemplate} header="Subcategory" filter filterElement={subCategoryFilterTemplate} sortable filterPlaceholder="Filter subcategory" style={{ minWidth: '12rem' }} showFilterMenu={false} editor={(options) => subCategoryEditor(options)} ></Column>
          <Column field="status" body={statusBodyTemplate} header="Status" sortable filter filterElement={statusFilterTemplate} filterPlaceholder="Filter status" showFilterMenu={false} editor={(options) => statusEditor(options)}  style={{ minWidth: '12rem' }}></Column>
        {/*  <Column field="created_by" header="Created By" sortable filter filterPlaceholder="Search by created by" style={{ minWidth: '12rem' }}></Column>
          <Column field="created_at" header="Created At" filter sortable filterPlaceholder="Search by created at" style={{ minWidth: '12rem' }}></Column>
          <Column field="modified_by" header="Modified By" filter sortable filterPlaceholder="Search by modified by" style={{ minWidth: '12rem' }}></Column>*/}
          <Column field="modified_at" body={dateBodyTemplate} header="Modified At" sortable filterPlaceholder="Search by modified at" style={{ minWidth: '12rem' }}  showFilterMenu={false} ></Column>
          <Column rowEditor={true} headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }} body={(rowData: any, options: ColumnBodyOptions) => (
    <>
      {options.rowEditor?.editing ? (
        <div>
          <Button
            icon="pi pi-save"
            className="p-button-rounded mr-2 p-button-outlined"
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
        <div>
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded mr-2 p-button-outlined"
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
    </AuthenticatedLayout>
  );
};

export default ListDocuments;