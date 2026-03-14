import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface HasPermissionProps {
    children: React.ReactNode;
    module: string;
    action: string;
    recordOwnerId?: string;
    fallback?: React.ReactNode;
}

export const HasPermission: React.FC<HasPermissionProps> = ({ 
    children, 
    module, 
    action, 
    recordOwnerId,
    fallback = null 
}) => {
    const { hasPermission } = useAuth();

    if (hasPermission(module, action, recordOwnerId)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
