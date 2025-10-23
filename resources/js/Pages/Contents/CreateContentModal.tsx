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
    const [file, setFile] = useState<File | null>(null);
    const [active, setActive] = useState(true);
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

        if (!file) {
            setErrors({ excel_file: "File is required" });
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('active', active ? "1" : "0");
        formData.append('excel_file', file);

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
                    <label htmlFor="excel_file" className="block text-sm font-medium text-gray-700 mb-2">
                        File (Excel or Image) <span className="text-red-500">*</span>
                    </label>
                    <FileUpload
                        name="excel_file"
                        accept=".xlsx,.xls,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
                        maxFileSize={10485760} // 10MB
                        customUpload
                        uploadHandler={onFileSelect}
                        onRemove={onFileRemove}
                        onClear={onFileRemove}
                        auto
                        chooseLabel="Choose File (Excel or Image)"
                        uploadLabel=""
                        cancelLabel=""
                        className={errors.excel_file ? "p-invalid" : ""}
                        emptyTemplate={<p className="m-0">Drag and drop files to here to upload or click to select.</p>}
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
                        label="Create Content" 
                        loading={loading}
                        disabled={!name.trim() || !file}
                    />
                </div>
            </form>
            </div>
        </Dialog>
    );
};

export default CreateContentModal;