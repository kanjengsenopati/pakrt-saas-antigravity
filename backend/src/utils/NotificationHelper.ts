import { pushService } from '../services/pushService';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

/**
 * Utility to centralize push notification delivery across services.
 * This encapsulates error handling and common delivery patterns (Scope vs Warga).
 */
export class NotificationHelper {
  /**
   * Sends a notification to a specific scope (e.g., all residents in an RT).
   */
  static async notifyScope(tenantId: string, scope: string, payload: NotificationPayload) {
    try {
      await pushService.sendNotificationToScope(tenantId, scope, {
        ...payload,
        icon: payload.icon || '/pwa-192x192.png'
      });
    } catch (error) {
      console.error(`[NotificationHelper] Failed to notify scope ${scope}:`, error);
    }
  }

  /**
   * Sends a notification to a list of specific residents.
   */
  static async notifyWargas(wargaIds: string[], payload: NotificationPayload) {
    if (!wargaIds || wargaIds.length === 0) return;
    
    try {
      const finalPayload = { ...payload, icon: payload.icon || '/pwa-192x192.png' };
      await Promise.all(wargaIds.map(id => 
        pushService.sendNotificationToWarga(id, finalPayload)
      ));
    } catch (error) {
      console.error(`[NotificationHelper] Failed to notify wargas:`, wargaIds, error);
    }
  }

  /**
   * Hybrid notification: either to scope or to specific individuals.
   */
  static async notifyTarget(data: {
    tenant_id: string;
    scope: string;
    is_semua_warga?: boolean;
    peserta_ids?: string[];
  }, payload: NotificationPayload) {
    if (data.is_semua_warga) {
      await this.notifyScope(data.tenant_id, data.scope, payload);
    } else if (data.peserta_ids && data.peserta_ids.length > 0) {
      await this.notifyWargas(data.peserta_ids, payload);
    }
  }
}
