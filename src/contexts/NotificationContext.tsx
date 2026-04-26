import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { aktivitasService } from '../services/aktivitasService';
import { pushService } from '../services/pushService';
import { Aktivitas } from '../types/database';

const VAPID_PUBLIC_KEY = "BJc3s1SmGPBZf0QFffD56FdYsHlbzAF4FK_hBvhiGy_m3UEV1sqArM1cTLQg0VaBkwtXUflXybJsU9DxKqU0_Wo";

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

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

    const subscribeToPush = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn("Push notifications not supported");
            return;
        }

        // Only subscribe warga users who have a linked warga profile
        if (!user?.warga_id) {
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Check existing subscription
            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            // Pass warga_id so backend validation passes
            await pushService.subscribe(subscription, user.warga_id);
            console.log("Push subscription sync successful");
        } catch (error) {
            console.error("Failed to subscribe to push notifications:", error);
        }
    }, [user]);

    useEffect(() => {
        if (user && currentTenant) {
            refresh();
            subscribeToPush();
            const interval = setInterval(refresh, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user, currentTenant, refresh, subscribeToPush]);

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
