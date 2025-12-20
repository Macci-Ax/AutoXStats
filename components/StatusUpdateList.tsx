import React from 'react';
import { Trash2, Clock } from 'lucide-react';
import { StatusUpdate } from '../types';

interface StatusUpdateListProps {
    statusUpdates: StatusUpdate[];
    currentUserId?: string;
    isAdmin?: boolean;
    onDelete?: (id: string) => Promise<void>;
    emptyMessage?: string;
}

export const StatusUpdateList: React.FC<StatusUpdateListProps> = ({
    statusUpdates,
    currentUserId,
    isAdmin = false,
    onDelete,
    emptyMessage = "Noch keine Status-Updates."
}) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Gerade eben';
        if (diffMins < 60) return `vor ${diffMins} Min.`;
        if (diffHours < 24) return `vor ${diffHours} Std.`;
        if (diffDays < 7) return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`;

        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleDelete = async (id: string) => {
        if (!onDelete) return;
        if (window.confirm('Status-Update wirklich löschen?')) {
            await onDelete(id);
        }
    };

    if (statusUpdates.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {statusUpdates.map((update) => {
                const canDelete = onDelete && (currentUserId === update.userId || isAdmin);

                return (
                    <div
                        key={update.id}
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                    >
                        <p className="text-white whitespace-pre-wrap break-words">
                            {update.content}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Clock size={14} />
                                <span>{formatDate(update.createdAt)}</span>
                            </div>

                            {canDelete && (
                                <button
                                    onClick={() => handleDelete(update.id)}
                                    className="text-slate-500 hover:text-red-500 transition-colors p-1"
                                    title="Löschen"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatusUpdateList;
