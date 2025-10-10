import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { router, usePage } from "@inertiajs/react";

interface Permission {
    id: number;
    name: string;
}

interface PageProps {
    errors?: { [key: string]: string };
    flash?: { [key: string]: string };
}

interface CreatePermissionProps {
    onClose: () => void;
    permission?: Permission | true; // `true` indicates creation mode
}

interface FormState {
    name: string;
}

export default function CreatePermission({ onClose, permission }: CreatePermissionProps) {
    const { errors, flash } = usePage().props;

    const [form, setForm] = useState<FormState>({ name: "" });

    useEffect(() => {
        if (permission && typeof permission !== "boolean") {
            setForm((prevForm) => ({ ...prevForm, name: permission.name }));
        }
    }, [permission]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prevForm) => ({ ...prevForm, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Create
        if (permission === true) {
            router.post("/permissions", form as any, {
                onSuccess: () => onClose(),
            });
            return;
        }

        // Update
        if (permission && typeof permission !== "boolean") {
            router.put(`/permissions/${permission.id}`, form as any, {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <>
            <div
                id="create-permission-modal"
                tabIndex={-1}
                aria-hidden="true"
                className="overflow-y-auto overflow-x-hidden flex fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
            >
                <div className="relative p-4 w-full max-w-md max-h-full">
                    <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {permission && typeof permission !== "boolean" ? "Update" : "Create"} Permission
                            </h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                            >
                                <svg
                                    className="w-3 h-3"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 14 14"
                                >
                                    <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                    />
                                </svg>
                                <span className="sr-only">Close modal</span>
                            </button>
                        </div>

                        <div className="p-4 md:p-5">
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                    >
                                        Permission Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                    />
                                    {errors?.name && (
                                        <div className="text-sm mt-1 text-red-600">{errors.name}</div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                >
                                    Save
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40"></div>
        </>
    );
}
