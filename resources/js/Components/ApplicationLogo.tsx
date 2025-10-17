import { HTMLAttributes } from 'react';

interface ApplicationLogoProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export default function ApplicationLogo({ className = '', ...props }: ApplicationLogoProps) {
    return (
        <div {...props} className={`font-bold text-2xl ${className}`}>
            <span className="text-blue-600">CONTENT</span>
            <span className="text-gray-700 ml-1">CONNECT</span>
        </div>
    );
}
