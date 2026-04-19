import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    role_id?: string;
    role_entity?: {
        id: string;
        name: string;
        permissions: any;
    };
    tenant_id: string;
    warga_id?: string;
    scope?: string;
    kontak?: string;
    permissions?: any; // Standard: { [module]: { actions: string[], scope: 'all' | 'personal' } }
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    updateUser: (user: User) => void;
    logout: () => void;
    hasPermission: (module: string, action: string, recordOwnerId?: string) => boolean;
    hasRole: (role: string) => boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Try to get current user from session cookie
                const { user: latestUser } = await authService.getMe();
                if (latestUser) {
                    setUser(latestUser);
                    localStorage.setItem('auth_user', JSON.stringify(latestUser));
                }
            } catch (error) {
                console.log('AuthContext: No active session found');
                localStorage.removeItem('auth_user');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        initializeAuth();
    }, []);

    const login = useCallback((newUser: User) => {
        setUser(newUser);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (e) {
            console.error("Logout failed at server, but clearing local state anyway", e);
        }
        setUser(null);
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
    }, []);

    const hasPermission = useCallback((module: string, action: string, recordOwnerId?: string): boolean => {
        if (!user) return false;
        
        // Admin always has all permissions
        if (user.role?.toLowerCase() === 'admin' || user.role_entity?.name?.toLowerCase() === 'admin') return true;

        // Combine permissions from User object and Role entity
        const userPerms = user.permissions || {};
        const rolePerms = user.role_entity?.permissions || {};
        
        // Helper to check in a specific permission set (can be legacy format or new object format)
        const checkInSet = (perms: any, m: string = module, a: string = action): { granted: boolean; scope: 'all' | 'personal' } => {
            const moduleData = perms[m];
            if (!moduleData) return { granted: false, scope: 'all' };

            // Handle legacy format: string[]
            if (Array.isArray(moduleData)) {
                return { 
                    granted: moduleData.includes(a) || moduleData.includes('manage'), 
                    scope: 'all' 
                };
            }

            // Handle new format: { actions: string[], scope: 'all' | 'personal' }
            if (typeof moduleData === 'object' && Array.isArray(moduleData.actions)) {
                return {
                    granted: moduleData.actions.includes(a) || moduleData.actions.includes('manage'),
                    scope: moduleData.scope || 'all'
                };
            }

            return { granted: false, scope: 'all' };
        };

        const isOwner = recordOwnerId === user.id || recordOwnerId === (user as any).warga_id;

        const fromUser = checkInSet(userPerms);
        if (fromUser.granted) {
            // If user has direct permission, check scope
            if (fromUser.scope === 'all') return true;
            if (fromUser.scope === 'personal' && recordOwnerId && isOwner) return true;
            if (fromUser.scope === 'personal' && !recordOwnerId) return true; // Default to allow if no owner ID to check against
        }

        const fromRole = checkInSet(rolePerms);
        if (fromRole.granted) {
            if (fromRole.scope === 'all') return true;
            if (fromRole.scope === 'personal' && recordOwnerId && isOwner) return true;
            if (fromRole.scope === 'personal' && !recordOwnerId) return true;
        }

        // Catch-all 'manage' permission
        if (checkInSet(userPerms, 'all', 'manage').granted || checkInSet(rolePerms, 'all', 'manage').granted) return true;

        return false;
    }, [user]);

    const hasRole = useCallback((role: string): boolean => {
        return user?.role === role;
    }, [user]);

    const value = useMemo(() => ({ 
        user, 
        isAuthenticated: !!user, 
        login, 
        updateUser,
        logout, 
        hasPermission, 
        hasRole,
        isLoading 
    }), [user, login, updateUser, logout, hasPermission, hasRole, isLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
