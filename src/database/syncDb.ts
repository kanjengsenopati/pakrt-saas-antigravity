import Dexie, { Table } from 'dexie';

export interface PendingRequest {
    id?: number;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data: any;
    headers: Record<string, string>;
    timestamp: number;
    retries: number;
}

export interface ApiCache {
    url: string;
    data: any;
    source: 'local' | 'server';
    timestamp: number;
    expiresAt: number;
}

export class SyncDatabase extends Dexie {
    syncQueue!: Table<PendingRequest>;
    apiCache!: Table<ApiCache>;

    constructor() {
        super('PakRtSyncDB');
        this.version(1).stores({
            syncQueue: '++id, url, method, timestamp',
            apiCache: 'url, timestamp, expiresAt'
        });
    }
}

export const syncDb = new SyncDatabase();
