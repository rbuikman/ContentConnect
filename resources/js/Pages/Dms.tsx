import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useState } from "react";
import { Mention, MentionSearchEvent } from "primereact/mention";
import { Button } from "primereact/button";
import { usePage } from "@inertiajs/react";
import { PageProps as InertiaPageProps } from "@inertiajs/core";

import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

interface User {
    id: number;
    name: string;
}

interface MyPageProps extends InertiaPageProps {
    users: User[];
    flash?: {
        success?: string;
    };
}

export default function DmsLayout() {
    const { users, flash } = usePage<MyPageProps>().props;

    const [text, setText] = useState<string>("");
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

    const onSearch = (e: MentionSearchEvent) => {
        const query = e.query.toLowerCase();
        const filtered = users.filter((user) =>
            user.name.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
    };

    return (
        <AuthenticatedLayout>
            <main className="flex-1 p-8">
                {/* Flash messages */}
                {flash?.success && (
                    <div
                        className="mb-4 px-4 py-2 bg-green-200 text-green-800 rounded"
                        role="alert"
                    >
                        {flash.success}
                    </div>
                )}

                <div className="bg-white rounded shadow-md p-6 max-w-2xl mx-auto relative z-50">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">
                        Mention a User
                    </h2>

                    {/* Buttons */}
                    <div className="flex space-x-2 mb-6">
                        <Button
                            label="PrimeReact Button"
                            icon="pi pi-check"
                            severity="success"
                            className="p-button-rounded p-button-outlined"
                        />
                        <Button
                            label="Tailwind Button"
                            icon="pi pi-star"
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                        />
                    </div>

                    {/* Mention input */}
                    <label htmlFor="mention" className="block mb-2 font-medium text-gray-700">
                        Type @ to mention
                    </label>

                    <Mention
                        trigger="@"
                        id="mention"
                        value={text}
                        suggestions={filteredUsers}
                        field="name"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
                        onSearch={onSearch}
                        placeholder="Type @ to mention"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        itemTemplate={(item: User) => (
                            <div className="flex items-center space-x-2 p-1 hover:bg-indigo-100">
                                <span className="font-semibold text-indigo-600">{item.name}</span>
                                {item.id && <span className="text-gray-500 text-sm">#{item.id}</span>}
                            </div>
                        )}
                    />
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
