import React, { useState, useEffect, useRef, useCallback } from "react";
import { FilterMatchMode } from 'primereact/api';
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Button } from "primereact/button";
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { router, usePage } from "@inertiajs/react";
import CreateContentModal from "./CreateContentModal";
import EditContentModal from "./EditContentModal";

interface Content {
  id: number;
  name: string;
  excel_file_path: string | null;
  is_network_path: boolean;
  active: boolean;
  created_by: string;
  modified_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentsData {
  data: Content[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface ListContentsProps {
  contents: ContentsData;
}

interface FlashMessages {
  success?: string;
  error?: string;
}

const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const ListContents: React.FC<ListContentsProps> = ({ contents }) => {
    const { flash, errors } = usePage().props as any;
    const [loading, setLoading] = useState<boolean>(true);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingContent, setEditingContent] = useState<Content | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        setLoading(false);
        initFilters();
        setCurrentPage(contents.current_page);
        
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

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
                >
                    Create Content
                </button>
                <IconField iconPosition="right" className="w-64">
                    <InputIcon className="pi pi-search" />
                    <InputText 
                        type="search" 
                        value={globalFilterValue || ''} 
                        onChange={(e) => onGlobalFilterChange(e)} 
                        placeholder="Search" 
                        className="text-sm" 
                    />
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

    const dateBodyTemplate = (rowData: Content) => {
        return formatDate(new Date(rowData.updated_at));
    };

    const fileBodyTemplate = (rowData: Content) => {
        if (rowData.excel_file_path) {
            return (
                <div className="flex items-center gap-2">
                    <Button
                        icon={rowData.is_network_path ? "pi pi-external-link" : "pi pi-download"}
                        className="p-button-sm p-button-outlined"
                        onClick={() => window.open(`/contents/download/${rowData.id}`, '_blank')}
                        tooltip={rowData.is_network_path ? "Open network path" : "Download file"}
                        tooltipOptions={{ position: "top" }}
                        severity="help"
                    />
                    <span className="text-xs text-gray-500">
                        {rowData.is_network_path ? "Network" : "Local"}
                    </span>
                </div>
            );
        }
        return <span className="text-gray-400">No file</span>;
    };

    const activeBodyTemplate = (rowData: Content) => {
        return (
            <Button
                icon={rowData.active ? "pi pi-check" : "pi pi-times"}
                className={`p-button-sm ${rowData.active ? 'p-button-success' : 'p-button-danger'}`}
                onClick={() => toggleActive(rowData)}
                tooltip={rowData.active ? "Click to deactivate" : "Click to activate"}
                tooltipOptions={{ position: "top" }}
                text
                rounded
            />
        );
    };

    const toggleActive = (content: Content) => {
        router.put(`/contents/${content.id}`, {
            ...content,
            active: !content.active
        }, {
            onSuccess: () => {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Content ${!content.active ? 'activated' : 'deactivated'} successfully`,
                    life: 3000
                });
            },
            onError: () => {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update content status',
                    life: 3000
                });
            }
        });
    };

    const actionsBodyTemplate = (rowData: Content) => {
        return (
            <div className="flex gap-1 justify-center">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-outlined"
                    onClick={() => {
                        setEditingContent(rowData);
                        setShowEditModal(true);
                    }}
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
                            message: "Are you sure you want to delete this content?",
                            header: "Confirmation",
                            icon: "pi pi-exclamation-triangle",
                            accept: () => handleDelete(rowData.id),
                        })
                    }
                />
            </div>
        );
    };

    const handleDelete = (id: number) => {
        router.delete(`/contents/${id}`, {
            onSuccess: () => {
                console.log(`Content with ID ${id} deleted successfully.`);
            },
            onError: (errors) => {
                console.error(`Error deleting content with ID ${id}:`, errors);
            }
        });
    };

    const header = renderHeader();
 
    return (
        <AuthenticatedLayout header="Content Management">
            <ConfirmDialog />

            {showCreateModal && (
                <CreateContentModal
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {showEditModal && editingContent && (
                <EditContentModal
                    content={editingContent}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingContent(null);
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
                    value={contents.data}
                    paginator
                    first={(contents.current_page - 1) * contents.per_page}
                    rows={contents.per_page}
                    totalRecords={contents.total}
                    onPage={onPageChange}
                    dataKey="id"
                    filters={filters}
                    globalFilterFields={['name']}
                    emptyMessage="No contents found."
                    onFilter={(e) => setFilters(e.filters)}
                    scrollable 
                    scrollHeight="calc(100vh - 355px)"
                    header={header}
                    removableSort
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} contents" 
                >
                    <Column field="name" header="Name" filter sortable filterPlaceholder="" style={{ minWidth: '12rem' }}></Column>
                    <Column body={fileBodyTemplate} header="Excel File" style={{ minWidth: '8rem', textAlign: 'center' }}></Column>
                    <Column body={activeBodyTemplate} header="Active" style={{ minWidth: '6rem', textAlign: 'center' }}></Column>
                    <Column field="created_by" header="Created By" sortable style={{ minWidth: '10rem' }}></Column>
                    <Column field="updated_at" body={dateBodyTemplate} header="Last Modified" sortable style={{ minWidth: '12rem' }}></Column>
                    <Column body={actionsBodyTemplate} header="Actions" headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>
            </div>

            <Toast ref={toast} position="top-right" />
        </AuthenticatedLayout>
    );
};

export default ListContents;