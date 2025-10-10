import { PageProps as InertiaPageProps } from '@inertiajs/core';

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps {
        flash?: {
            success?: string;
            error?: string;
            [key: string]: string | undefined;
        };
        errors?: {
            [key: string]: string;
        };
    }
}
