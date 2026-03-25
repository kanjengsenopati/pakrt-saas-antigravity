import React from 'react';
import { useSync } from '../../contexts/SyncContext';
import { CloudCheck, CloudSlash, ArrowsClockwise, CloudArrowUp } from '@phosphor-icons/react';

export const SyncStatus: React.FC = () => {
    const { isOnline, isSyncing, pendingCount } = useSync();

    if (isSyncing) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-sm animate-pulse">
                <ArrowsClockwise weight="bold" className="w-3 h-3 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Auto Sync...</span>
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm">
                <CloudSlash weight="fill" className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Offline Mode</span>
                {pendingCount > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold ml-1 animate-bounce">
                        {pendingCount}
                    </span>
                )}
            </div>
        );
    }

    if (pendingCount > 0) {
       return (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm">
                <CloudArrowUp weight="bold" className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Pending Sync</span>
                <span className="flex items-center justify-center w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold ml-1">
                    {pendingCount}
                </span>
            </div>
        );
    }

    // Default: Online & Synced
    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
            <CloudCheck weight="fill" className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Online</span>
        </div>
    );
};
