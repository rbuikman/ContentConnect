import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FileUpload } from "primereact/fileupload";
import { SelectButton } from "primereact/selectbutton";
import { Checkbox } from "primereact/checkbox";
import { router } from "@inertiajs/react";

interface CreateContentModalProps {
    onClose: () => void;
}

const CreateContentModal: React.FC<CreateContentModalProps> = ({ onClose }) => {
    const [name, setName] = useState("");
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [networkPath, setNetworkPath] = useState("");
    const [pathType, setPathType] = useState<"upload" | "network">("upload");
    const [active, setActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const pathTypeOptions = [
        { label: "Upload File", value: "upload" },
        { label: "Network Path", value: "network" }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        if (!name.trim()) {
            setErrors({ name: "Name is required" });
            setLoading(false);
            return;
        }

        if (pathType === "upload" && !excelFile) {
            setErrors({ excel_file: "Excel file is required" });
            setLoading(false);
            return;
        }

        if (pathType === "network" && !networkPath.trim()) {
            setErrors({ network_path: "Network path is required" });
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('is_network_path', pathType === "network" ? "1" : "0");
        formData.append('active', active ? "1" : "0");
        
        if (pathType === "upload" && excelFile) {
            formData.append('excel_file', excelFile);
        } else if (pathType === "network") {
            formData.append('network_path', networkPath);
        }

        router.post('/contents', formData, {
            onSuccess: () => {
                setLoading(false);
                onClose();
            },
            onError: (errors) => {
                setLoading(false);
                setErrors(errors);
            },
            forceFormData: true
        });
    };

    const onFileSelect = (e: any) => {
        const files = e.files;
        if (files && files.length > 0) {
            setExcelFile(files[0]);
        }
    };

    const onFileRemove = () => {
        setExcelFile(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <Dialog
            header="Create Content"
            visible={true}
            style={{ width: '500px' }}
            onHide={onClose}
            closable={true}
            modal={true}
            className="p-fluid"
        >
            <div onKeyDown={handleKeyDown}>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="field">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter content name"
                        className={errors.name ? "p-invalid" : ""}
                        autoFocus
                    />
                    {errors.name && <small className="p-error">{errors.name}</small>}
                </div>

                <div className="field">
                    <div className="flex items-center">
                        <Checkbox 
                            inputId="active" 
                            checked={active} 
                            onChange={(e) => setActive(e.checked || false)} 
                        />
                        <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
                            Active
                        </label>
                    </div>
                    <small className="text-gray-500">Inactive contents will not be available for selection in documents</small>
                </div>

                <div className="field">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Excel Source <span className="text-red-500">*</span>
                    </label>
                    <SelectButton
                        value={pathType}
                        onChange={(e) => setPathType(e.value)}
                        options={pathTypeOptions}
                        className="mb-4"
                    />
                </div>

                {pathType === "upload" ? (
                    <div className="field">
                        <label htmlFor="excel_file" className="block text-sm font-medium text-gray-700 mb-2">
                            Excel File <span className="text-red-500">*</span>
                        </label>
                        <FileUpload
                            name="excel_file"
                            accept=".xlsx,.xls"
                            maxFileSize={10485760} // 10MB
                            customUpload
                            uploadHandler={onFileSelect}
                            onRemove={onFileRemove}
                            onClear={onFileRemove}
                            emptyTemplate={
                                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg">
                                    <i className="pi pi-cloud-upload text-2xl text-gray-400 mb-2"></i>
                                    <p className="text-sm text-gray-500">Drag and drop Excel file here, or click to select</p>
                                    <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
                                </div>
                            }
                            chooseLabel="Choose Excel File"
                            uploadLabel=""
                            cancelLabel=""
                            className={errors.excel_file ? "p-invalid" : ""}
                        />
                        {errors.excel_file && <small className="p-error">{errors.excel_file}</small>}
                    </div>
                ) : (
                    <div className="field">
                        <label htmlFor="network_path" className="block text-sm font-medium text-gray-700 mb-2">
                            Network Path <span className="text-red-500">*</span>
                        </label>
                        <InputText
                            id="network_path"
                            value={networkPath}
                            onChange={(e) => setNetworkPath(e.target.value)}
                            placeholder="Enter network path (e.g., //server/share/file.xlsx or \\server\share\file.xlsx)"
                            className={errors.network_path ? "p-invalid" : ""}
                        />
                        {errors.network_path && <small className="p-error">{errors.network_path}</small>}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button 
                        type="button"
                        label="Cancel" 
                        severity="secondary" 
                        onClick={onClose}
                        disabled={loading}
                    />
                    <Button 
                        type="submit"
                        label="Create Content" 
                        loading={loading}
                        disabled={!name.trim() || (pathType === "upload" && !excelFile) || (pathType === "network" && !networkPath.trim())}
                    />
                </div>
            </form>
            </div>
        </Dialog>
    );
};

export default CreateContentModal;