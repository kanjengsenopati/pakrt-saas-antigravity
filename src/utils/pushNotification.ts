import axios from 'axios';

const VAPID_PUBLIC_KEY = 'BJc3s1SmGPBZf0QFffD56FdYsHlbzAF4FK_hBvhiGy_m3UEV1sqArM1cTLQg0VaBkwtXUflXybJsU9DxKqU0_Wo';
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const pushNotificationUtil = {
    async isSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    },

    async requestPermission() {
        if (!await this.isSupported()) return false;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

    async subscribeUser(wargaId: string) {
        try {
            if (!await this.isSupported()) return;

            const registration = await navigator.serviceWorker.ready;
            
            // Unsubscribe existing if any to refresh
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
                await existingSub.unsubscribe();
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Send to backend
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/push/subscribe`, {
                subscription: subscription.toJSON(),
                warga_id: wargaId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Push subscription successful');
            return true;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            return false;
        }
    },

    async unsubscribeUser() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                const token = localStorage.getItem('token');
                await axios.post(`${API_URL}/push/unsubscribe`, {
                    endpoint: subscription.endpoint
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                await subscription.unsubscribe();
            }
            return true;
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            return false;
        }
    },

    urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    // Handle incoming messages from Service Worker when app is foreground
    initForegroundHandler(onNotificationReceived?: (payload: any) => void) {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'PUSH_NOTIFICATION_RECEIVED') {
                const payload = event.data.payload;
                
                // Play Sound
                this.playNotificationSound();
                
                if (onNotificationReceived) {
                    onNotificationReceived(payload);
                }
            }
        });
    },

    playNotificationSound() {
        // High quality "attentive" chime sound from a reliable CDN
        const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
        const audio = new Audio(SOUND_URL);
        audio.volume = 0.8;
        audio.play().catch(e => {
            console.warn('Audio play failed (maybe user gesture required):', e);
            // Fallback to local if CDN fails or for offline
            const localAudio = new Audio('/sounds/notification.mp3');
            localAudio.play().catch(() => {});
        });
    }
};
