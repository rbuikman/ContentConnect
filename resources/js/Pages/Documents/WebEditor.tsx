import React, { useState, useEffect } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Button } from 'primereact/button';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';


const SPLIT_KEY = 'webEditorSplitSizes';


import { usePage } from '@inertiajs/react';

interface WebEditorProps {
    documentId?: string;
    fileName?: string;
    imageUrls?: string[];
}

const WebEditor: React.FC = () => {
    const page = usePage();
    const { fileName, imageUrls = [] } = page.props as WebEditorProps;

    const getInitialSizes = () => {
        const saved = sessionStorage.getItem(SPLIT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === 2) return parsed;
            } catch {}
        }
        return [40, 60];
    };
    const [sizes, setSizes] = useState<number[]>(getInitialSizes);

    useEffect(() => {
        sessionStorage.setItem(SPLIT_KEY, JSON.stringify(sizes));
    }, [sizes]);



    return (
        <AuthenticatedLayout header={<h1>Document Editor</h1>}>
                <Splitter onResizeEnd={e => setSizes(e.sizes)}>
                    <SplitterPanel size={sizes[0]} minSize={10} className="flex flex-col bg-gray-100">
                        {/* Menubar */}
                        <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200 bg-white">
                            <div className="flex gap-2">
                                <Button icon="pi pi-save" className="p-button-text p-0" tooltip="Save" aria-label="Save" />
                            </div>
                            <div>
                                <Button icon="pi pi-file-pdf" className="p-button-text p-0" tooltip="Download PDF" aria-label="Download PDF" />
                                <Button icon="pi pi-refresh" className="p-button-text p-0" tooltip="Refresh preview" aria-label="Refresh preview"/>
                            </div>
                        </div>
                        {/* Left panel content */}
                        <div className="flex-1 flex items-center justify-center">
                            Left Panel
                        </div>
                    </SplitterPanel>

                    <SplitterPanel size={sizes[1]} minSize={10} className="overflow-auto bg-gray-200">
                        {/* Right panel content: show images */}
                        <div className="flex flex-col items-center w-full">
                            {imageUrls.length === 0 && <div className="text-gray-500">No images found.</div>}
                            {imageUrls.map((url, idx) => (
                                <img key={url} src={url} alt={`Page ${idx+1}`} className="mb-4 max-w-full shadow" />
                            ))}
                        </div>
                    </SplitterPanel>
                </Splitter>
        </AuthenticatedLayout>
    );
};

export default WebEditor;
