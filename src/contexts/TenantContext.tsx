import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

    const initializeTenant = useCallback(async () => {
        try {
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setCurrentUser(user);
                
                if (user.scope) {
                    setCurrentScope(user.scope as ScopeType);
                }

                if (user.tenant_id) {
                    // Try to use a small delay or background fetch to avoid blocking the very first render if possible
                    // However, we need the tenant object for many things, so we check if we can background fetch it
                    fetchTenant(user.tenant_id).then(tenant => {
                        if (tenant) setCurrentTenant(tenant);
                        setIsLoading(false);
                    }).catch(() => {
                        setIsLoading(false);
                    });
                    return;
                }
            }
        } catch (e) {
            console.error('Failed to parse auth_user from localStorage', e);
        }
        setCurrentTenant(null);
        setCurrentUser(null);
        setIsLoading(false);
    }, [setCurrentUser, setCurrentScope, setCurrentTenant, setIsLoading, fetchTenant]);

    useEffect(() => {
        initializeTenant();
    }, [initializeTenant]);

    const setTenant = useCallback(async (tenantId: string) => {
        setIsLoading(true);
        const tenant = await fetchTenant(tenantId);
        setCurrentTenant(tenant);
        setIsLoading(false);
    }, []); // fetchTenant, setCurrentTenant, setIsLoading are stable

    const setScope = useCallback((scope: ScopeType) => {
        setCurrentScope(scope);
    }, []); // setCurrentScope is stable

    const refreshTenant = useCallback(async () => {
        await initializeTenant();
    }, [initializeTenant]);

    const value = useMemo(() => ({ 
        currentTenant, 
        currentUser, 
        currentScope, 
        setTenant, 
        setScope, 
        isLoading, 
        refreshTenant 
    }), [currentTenant, currentUser, currentScope, setTenant, setScope, isLoading, refreshTenant]);

    return (
        <TenantContext.Provider value={value}>
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
