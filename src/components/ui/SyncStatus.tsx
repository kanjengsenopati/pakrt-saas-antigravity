import React from 'react';
import { useSync } from '../../contexts/SyncContext';
import { CloudCheck, CloudSlash } from '@phosphor-icons/react';

export const SyncStatus: React.FC = () => {
    const { isOnline } = useSync();

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm">
                <CloudSlash weight="fill" className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
            </div>
        );
    }

    // Default: Online
    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
            <CloudCheck weight="fill" className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Online</span>
        </div>
    );
};
