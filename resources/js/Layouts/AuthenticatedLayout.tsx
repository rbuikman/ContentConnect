import ApplicationLogo from '@/Components/ApplicationLogo';
import React from 'react';
import ListSessions from '@/Components/ListSessions';
import AboutBox from '@/Components/AboutBox';
import ChangeCompanyModal from '@/Components/ChangeCompanyModal';

interface Company {
  id: number;
  name: string;
}

import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import {
    DocumentTextIcon,
    DocumentDuplicateIcon,
    FolderIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    UsersIcon,
    TagIcon,
    RectangleStackIcon,
    LanguageIcon,
    UserIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const page = usePage();
    const user = page.props.auth?.user;
    const permissions = page.props.auth?.permissions || [];

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [showChangeCompanyModal, setShowChangeCompanyModal] = useState(false);
    const [showAboutBox, setShowAboutBox] = useState(false);

    // Close AboutBox on Escape key
    useEffect(() => {
        if (!showAboutBox) return;
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowAboutBox(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showAboutBox]);

    // Helper function to check if user has permission
    const hasPermission = (permission: string) => {
        return permissions.includes(permission);
    };

    // 🔐 Redirect to /login if user is not logged in
    useEffect(() => {
        if (!user) {
            router.visit('/login');
        }
    }, [user]);

    // Prevent rendering layout before redirect
    if (!user) {
        return null;
    }

    // Get companies for modal (from page.props, assuming they're available for superadmin)
    const companies: Company[] = Array.isArray(page.props.companies) ? page.props.companies : [];
    const currentCompanyId = user?.company_id;
    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-white">
                <div className="mx-auto w-[95%] px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                                </Link>
                            </div>

                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                            >
                                                {user.name} {user.company && `(${user.company.name})`}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>

                                        {hasPermission('document-index') && (
                                            <Dropdown.Link href={route('documents.index')} className="flex items-center gap-2">
                                                <DocumentTextIcon className="h-4 w-4" />
                                                Documents
                                            </Dropdown.Link>
                                        )}
                                        {hasPermission('templates-index') && (
                                            <Dropdown.Link href={route('templates.index')} className="flex items-center gap-2">
                                                <DocumentDuplicateIcon className="h-4 w-4" />
                                                Templates
                                            </Dropdown.Link>
                                        )}
                                        {hasPermission('content-index') && (
                                            <Dropdown.Link href={route('contents.index')} className="flex items-center gap-2">
                                                <FolderIcon className="h-4 w-4" />
                                                Contents
                                            </Dropdown.Link>
                                        )}

                                        {hasPermission('superadmin') && (
                                            <hr className="my-1 border-gray-200" />
                                        )}
                                        {hasPermission('superadmin') && (
                                            <>
                                                <hr className="my-1 border-gray-200" />
                                                <button
                                                    type="button"
                                                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    onClick={() => setShowChangeCompanyModal(true)}
                                                >
                                                    <BuildingOfficeIcon className="h-4 w-4" />
                                                    Change Company
                                                </button>
                                            </>
                                        )}
                                        {hasPermission('superadmin') && (
                                            <Dropdown.Link href={route('sessions.index')} className="flex items-center gap-2">
                                                <FolderIcon className="h-4 w-4" />
                                                Active Sessions
                                            </Dropdown.Link>
                                        )}

                                        {hasPermission('company-index') && (
                                            <Dropdown.Link href={route('companies.index')} className="flex items-center gap-2">
                                                <BuildingOfficeIcon className="h-4 w-4" />
                                                Companies
                                            </Dropdown.Link>
                                        )}

                                        
                                        {(hasPermission('role-index') || hasPermission('user-index')) && (
                                            <hr className="my-1 border-gray-200" />
                                        )}

                                        {hasPermission('role-index') && (
                                            <Dropdown.Link href={route('roles.index')} className="flex items-center gap-2">
                                                <UserGroupIcon className="h-4 w-4" />
                                                Roles
                                            </Dropdown.Link>
                                        )}
                                        {hasPermission('user-index') && (
                                            <Dropdown.Link href={route('users.index')} className="flex items-center gap-2">
                                                <UsersIcon className="h-4 w-4" />
                                                Users
                                            </Dropdown.Link>
                                        )}

                                        {( hasPermission('status-index') || hasPermission('category-index') || hasPermission('company-index') || hasPermission('language-index')) && (
                                            <hr className="my-1 border-gray-200" />
                                        )}

                                        {hasPermission('status-index') && (
                                            <Dropdown.Link href={route('statuses.index')} className="flex items-center gap-2">
                                                <TagIcon className="h-4 w-4" />
                                                Statuses
                                            </Dropdown.Link>
                                        )}
                                        {hasPermission('category-index') && (
                                            <Dropdown.Link href={route('categories.index')} className="flex items-center gap-2">
                                                <RectangleStackIcon className="h-4 w-4" />
                                                Categories
                                            </Dropdown.Link>
                                        )}
                                        {hasPermission('language-index') && (
                                            <Dropdown.Link href={route('languages.index')} className="flex items-center gap-2">
                                                <LanguageIcon className="h-4 w-4" />
                                                Languages
                                            </Dropdown.Link>
                                        )}
                                        <hr className="my-1 border-gray-200" />
                                        <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-2">
                                            <UserIcon className="h-4 w-4" />
                                            My Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex items-center gap-2"
                                        >
                                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                            Log Out
                                        </Dropdown.Link>

                                        <hr className="my-1 border-gray-200" />
                                        <button
                                            type="button"
                                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setShowAboutBox(true)}
                                        >
                                            <RectangleStackIcon className="h-4 w-4" />
                                            About
                                        </button>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        {hasPermission('superadmin') && (
                            <ResponsiveNavLink href={route('usercompany.change')} className="flex items-center gap-2">
                                <BuildingOfficeIcon className="h-4 w-4" />
                                Change Current Company
                            </ResponsiveNavLink>
                        )}
                        {hasPermission('document-index') && (
                            <ResponsiveNavLink href={route('documents.index')} className="flex items-center gap-2">
                                <DocumentTextIcon className="h-4 w-4" />
                                Documents
                            </ResponsiveNavLink>
                        )}
                        {hasPermission('templates-index') && (
                            <ResponsiveNavLink href={route('templates.index')} className="flex items-center gap-2">
                                <DocumentDuplicateIcon className="h-4 w-4" />
                                Templates
                            </ResponsiveNavLink>
                        )}
                        {hasPermission('content-index') && (
                            <ResponsiveNavLink href={route('contents.index')} className="flex items-center gap-2">
                                <FolderIcon className="h-4 w-4" />
                                Contents
                            </ResponsiveNavLink>
                        )}
                        {hasPermission('company-index') && (
                            <ResponsiveNavLink href={route('companies.index')} className="flex items-center gap-2">
                                <BuildingOfficeIcon className="h-4 w-4" />
                                Companies
                            </ResponsiveNavLink>
                        )}
                        {hasPermission('role-index') && (
                            <ResponsiveNavLink href={route('roles.index')} className="flex items-center gap-2">
                                <UserGroupIcon className="h-4 w-4" />
                                Roles
                            </ResponsiveNavLink>
                        )}
                        {hasPermission('user-index') && (
                            <ResponsiveNavLink href={route('users.index')} className="flex items-center gap-2">
                                <UsersIcon className="h-4 w-4" />
                                Users
                            </ResponsiveNavLink>
                        )}
                        {hasPermission('status-index') && (
                            <ResponsiveNavLink href={route('statuses.index')} className="flex items-center gap-2">
                                <TagIcon className="h-4 w-4" />
                                Statuses
                            </ResponsiveNavLink>
                        )}
                        {hasPermission('category-index') && (
                            <ResponsiveNavLink href={route('categories.index')} className="flex items-center gap-2">
                                <RectangleStackIcon className="h-4 w-4" />
                                Categories
                            </ResponsiveNavLink>
                        )}
                        {hasPermission('language-index') && (
                            <ResponsiveNavLink href={route('languages.index')} className="flex items-center gap-2">
                                <LanguageIcon className="h-4 w-4" />
                                Languages
                            </ResponsiveNavLink>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800">
                                {user.name} {user.company && `(${user.company.name})`}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')} className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                My Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="flex items-center gap-2"
                            >
                                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto w-[95%] px-4 py-2 sm:px-6 lg:px-8">
                        {<h2 className="text-xl font-semibold leading-tight text-gray-800">{header}</h2>}
                    </div>
                </header>
            )}

            <main className="py-8">
                <div className="mx-auto w-[95%] px-4 sm:px-6 lg:px-8">
                    <div className="main-content-card">
                        <div className="p-8">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            {showChangeCompanyModal && (
                <ChangeCompanyModal
                    companies={companies}
                    currentCompanyId={currentCompanyId}
                    onClose={() => setShowChangeCompanyModal(false)}
                />
            )}
            {showAboutBox && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setShowAboutBox(false)}>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <AboutBox />
                    </div>
                </div>
            )}
        </div>
    );
}
