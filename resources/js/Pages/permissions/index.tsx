import React, { useState } from "react";
import { router } from "@inertiajs/react";
import Pagination from "../../Shared/Pagination";
import CreatePermission from "./create-permission";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

interface PermissionsData {
    data: Permission[];
    current_page: number;
    total: number;
    per_page: number;
}

interface ListPermissionsProps {
    permissions: PermissionsData;
}

export default function ListPermissions({ permissions }: ListPermissionsProps) {
    const [showModal, setShowModal] = useState<Permission | undefined>(undefined);

    const handlePaginate = (page: number) => {
        router.get(`/permissions?page=${page}`, {}, { replace: true });
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this permission?")) {
            router.delete(`/permissions/${id}`);
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="mx-5">
                {/* Header */}
                <div className="flex justify-between items-center my-6">
                    <h2 className="text-2xl font-semibold text-gray-800">All Permissions</h2>
                    <button
                        type="button"
                        onClick={() => setShowModal(undefined)}
                        className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 shadow transition"
                    >
                        Create Permission
                    </button>
                </div>

                {/* Table */}
                <div className="relative overflow-x-auto bg-white rounded-lg shadow">
                    <table className="w-full text-sm text-left text-gray-700">
                        <thead className="text-xs uppercase bg-gray-100 border-b">
                            <tr>
                                <th className="px-6 py-3 font-semibold">#</th>
                                <th className="px-6 py-3 font-semibold">Name</th>
                                <th className="px-6 py-3 font-semibold">Guard</th>
                                <th className="px-6 py-3 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.data.length > 0 ? (
                                permissions.data.map((permission) => (
                                    <tr
                                        key={permission.id}
                                        className="border-b hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4">{permission.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{permission.name}</td>
                                        <td className="px-6 py-4">{permission.guard_name}</td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            <button
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    setShowModal(permission);
                                                }}
                                                className="inline-block bg-green-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-green-600 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    handleDelete(permission.id);
                                                }}
                                                className="inline-block bg-red-500 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-red-600 transition"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        No permissions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="my-10">
                    <Pagination
                        current_page={permissions.current_page}
                        total={permissions.total}
                        per_page={permissions.per_page}
                        onPaginate={handlePaginate}
                    />
                </div>

                {/* Modal */}
                {showModal && (
                    <CreatePermission
                        onClose={() => setShowModal(undefined)}
                        permission={showModal}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
