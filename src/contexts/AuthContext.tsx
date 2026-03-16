import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';

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
    kontak?: string;
    permissions?: any; // Standard: { [module]: { actions: string[], scope: 'all' | 'personal' } }
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    updateUser: (user: User) => void;
    logout: () => void;
    hasPermission: (module: string, action: string, recordOwnerId?: string) => boolean;
    hasRole: (role: string) => boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('auth_user');
    
            if (storedToken && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
                setIsLoading(false); // Unblock UI immediately if we have local data

                // Refresh user data from server in background
                userService.getById(parsedUser.id).then(latestUser => {
                    if (latestUser) {
                        setUser(latestUser);
                        localStorage.setItem('auth_user', JSON.stringify(latestUser));
                        console.log('AuthContext: User data refreshed in background');
                    }
                }).catch(error => {
                    console.error('AuthContext: Background refresh failed', error);
                });
            } else {
                setIsLoading(false);
            }
        };
        initializeAuth();
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    };

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
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

        const fromUser = checkInSet(userPerms);
        if (fromUser.granted) {
            // If user has direct permission, check scope
            if (fromUser.scope === 'all') return true;
            if (fromUser.scope === 'personal' && recordOwnerId && recordOwnerId === user.id) return true;
            if (fromUser.scope === 'personal' && !recordOwnerId) return true; // Default to allow if no owner ID to check against
        }

        const fromRole = checkInSet(rolePerms);
        if (fromRole.granted) {
            if (fromRole.scope === 'all') return true;
            if (fromRole.scope === 'personal' && recordOwnerId) {
                // If it's a Warga checking their own record
                return recordOwnerId === user.id || recordOwnerId === (user as any).warga_id;
            }
            if (fromRole.scope === 'personal' && !recordOwnerId) return true;
        }

        // Catch-all 'manage' permission
        if (checkInSet(userPerms, 'all', 'manage').granted || checkInSet(rolePerms, 'all', 'manage').granted) return true;

        return false;
    }, [user]);

    const hasRole = useCallback((role: string): boolean => {
        return user?.role === role;
    }, [user]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            isAuthenticated: !!token, 
            login, 
            updateUser,
            logout, 
            hasPermission, 
            hasRole,
            isLoading 
        }}>
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
