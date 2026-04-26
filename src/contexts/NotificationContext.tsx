import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { aktivitasService } from '../services/aktivitasService';
import { Aktivitas } from '../types/database';

interface NotificationContextType {
    notifications: Aktivitas[];
    unreadCount: number;
    markAsRead: () => void;
    refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { currentTenant, currentScope } = useTenant();
    const [notifications, setNotifications] = useState<Aktivitas[]>([]);
    const [lastTimestamp, setLastTimestamp] = useState<number>(() => {
        const saved = localStorage.getItem('pakrt_last_notif_time');
        return saved ? parseInt(saved) : Date.now();
    });
    const [unreadCount, setUnreadCount] = useState(0);

    const refresh = useCallback(async () => {
        if (!user || !currentTenant) return;
        
        try {
            const items = await aktivitasService.getAll(currentTenant.id, currentScope);
            setNotifications(items);
            
            // Check for new notifications since last timestamp
            const newItems = items.filter(item => item.timestamp > lastTimestamp);
            if (newItems.length > 0) {
                setUnreadCount(prev => prev + newItems.length);
                
                // Show toaster for the most recent one
                const latest = newItems[0];
                toast(latest.action, {
                    description: latest.details,
                    duration: 5000,
                    position: 'top-right',
                    action: latest.target_url ? {
                        label: 'Buka',
                        onClick: () => window.location.href = latest.target_url!
                    } : undefined
                });
                
                const maxTime = Math.max(...newItems.map(i => i.timestamp));
                setLastTimestamp(maxTime);
                localStorage.setItem('pakrt_last_notif_time', maxTime.toString());
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, [user, currentTenant, currentScope, lastTimestamp]);

    const markAsRead = () => {
        setUnreadCount(0);
    };

    useEffect(() => {
        if (user && currentTenant) {
            refresh();
            const interval = setInterval(refresh, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user, currentTenant, refresh]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, refresh }}>
            {children}
            <Toaster 
                richColors 
                expand 
                closeButton 
                theme="light"
                toastOptions={{
                    style: {
                        borderRadius: '20px',
                        padding: '16px',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
                    }
                }} 
            />
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
