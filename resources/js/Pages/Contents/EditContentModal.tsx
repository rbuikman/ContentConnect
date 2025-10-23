import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FileUpload } from "primereact/fileupload";
import { SelectButton } from "primereact/selectbutton";
import { Checkbox } from "primereact/checkbox";
import { router } from "@inertiajs/react";

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

interface EditContentModalProps {
    content: Content;
    onClose: () => void;
}

const EditContentModal: React.FC<EditContentModalProps> = ({ content, onClose }) => {
    const [name, setName] = useState(content.name);
    // ...existing code...
    const [file, setFile] = useState<File | null>(null);
    const [active, setActive] = useState(content.active);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const pathTypeOptions = [
    { label: "Upload File", value: "upload" }
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

        const formData = new FormData();
        formData.append('name', name);
        formData.append('_method', 'PUT');
        formData.append('active', active ? "1" : "0");
        if (file) {
            formData.append('excel_file', file);
        }

        router.post(`/contents/${content.id}`, formData, {
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
            setFile(files[0]);
        }
    };

    const onFileRemove = () => {
        setFile(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const hasExistingFile = content.file_path !== null;
    const fileName = hasExistingFile && content.file_path && !content.is_network_path
        ? content.original_filename || content.file_path.split('/').pop() 
        : null;
    const networkFileName = hasExistingFile && content.file_path && content.is_network_path
        ? content.file_path.split(/[/\\]/).pop()
        : null;

    return (
        <Dialog
            header="Edit Content"
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
                        <label htmlFor="excel_file" className="block text-sm font-medium text-gray-700 mb-2">
                            File (Excel or Image) {hasExistingFile ? "(optional - leave empty to keep current file)" : ""}
                        </label>
                        {hasExistingFile && (
                            <div className="mb-3 p-3 bg-gray-50 rounded border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <i className="pi pi-file-excel text-green-600"></i>
                                        <span className="text-sm text-gray-700">Current file: {fileName}</span>
                                    </div>
                                    <Button
                                        icon="pi pi-download"
                                        className="p-button-sm p-button-outlined"
                                        onClick={() => window.open(`/contents/download/${content.id}`, '_blank')}
                                        type="button"
                                        severity="help"
                                    />
                                </div>
                            </div>
                        )}
                        <FileUpload
                            name="excel_file"
                            accept=".xlsx,.xls,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
                            maxFileSize={10485760} // 10MB
                            customUpload
                            uploadHandler={onFileSelect}
                            onRemove={onFileRemove}
                            onClear={onFileRemove}
                            auto
                            chooseLabel={hasExistingFile ? "Replace File" : "Choose File (Excel or Image)"}
                            uploadLabel=""
                            cancelLabel=""
                            className={errors.excel_file ? "p-invalid" : ""}
                            emptyTemplate={<p className="m-0">Drag and drop files to here to replace or click to select.</p>}
                        />
                        {errors.excel_file && <small className="p-error">{errors.excel_file}</small>}
                    </div>

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
                            label="Update Content" 
                            loading={loading}
                            disabled={!name.trim()}
                        />
                    </div>
                </form>
            </div>
        </Dialog>
    );
};

export default EditContentModal;