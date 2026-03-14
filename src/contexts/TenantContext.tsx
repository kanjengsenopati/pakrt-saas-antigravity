import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant } from '../database/db';
import { authService } from '../services/authService';

export type ScopeType = 'RT' | 'PKK' | 'Dasa Wisma';

interface TenantContextType {
    currentTenant: Tenant | null;
    currentUser: any | null;
    currentScope: ScopeType;
    setTenant: (tenantId: string) => Promise<void>;
    setScope: (scope: ScopeType) => void;
    isLoading: boolean;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [currentScope, setCurrentScope] = useState<ScopeType>('RT');
    const [isLoading, setIsLoading] = useState(true);

    const fetchTenant = async (tenantId: string) => {
        try {
            const res = await authService.checkTenant(tenantId);
            if (res.exists) {
                return res.tenant as Tenant;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch tenant:', error);
            return null;
        }
    };

    const initializeTenant = async () => {
        setIsLoading(true);
        try {
            // Read the logged-in user from localStorage
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setCurrentUser(user);
                
                // Set current scope from user data if available
                if (user.scope) {
                    setCurrentScope(user.scope as ScopeType);
                }

                if (user.tenant_id) {
                    const tenant = await fetchTenant(user.tenant_id);
                    setCurrentTenant(tenant);
                    setIsLoading(false);
                    return;
                }
            }
        } catch (e) {
            console.error('Failed to parse auth_user from localStorage', e);
        }
        // Fallback: clear user state if no valid session
        setCurrentTenant(null);
        setCurrentUser(null);
        setIsLoading(false);
    };

    useEffect(() => {
        initializeTenant();
    }, []);

    const setTenant = async (tenantId: string) => {
        setIsLoading(true);
        const tenant = await fetchTenant(tenantId);
        setCurrentTenant(tenant);
        setIsLoading(false);
    };

    const setScope = (scope: ScopeType) => {
        setCurrentScope(scope);
    };

    const refreshTenant = async () => {
        await initializeTenant();
    };

    return (
        <TenantContext.Provider value={{ currentTenant, currentUser, currentScope, setTenant, setScope, isLoading, refreshTenant }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
