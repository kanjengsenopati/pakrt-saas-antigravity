import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: {
        module: string;
        action: string;
    };
    requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requiredPermission, 
    requiredRole 
}) => {
    const { isAuthenticated, hasPermission, hasRole, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && !hasRole(requiredRole)) {
        return <Navigate to="/dashboard" replace />; // Or an Access Denied page
    }

    if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
        return <Navigate to="/dashboard" replace />; // Or an Access Denied page
    }

    return <>{children}</>;
};
