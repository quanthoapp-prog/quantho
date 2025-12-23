import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Bell, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const NotificationPanel: React.FC = () => {
    const { notifications, unreadNotificationsCount, markNotificationAsRead, markAllNotificationsRead, deleteNotification } = useFinance();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = (n: any) => {
        if (!n.isRead) {
            markNotificationAsRead(n.id);
        }
        if (n.link) {
            setIsOpen(false);
            navigate(n.link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={18} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={18} className="text-orange-500" />;
            case 'error': return <XCircle size={18} className="text-red-500" />;
            default: return <Info size={18} className="text-blue-500" />;
        }
    };

    // Defensive check preventing undefined array crash
    const safeNotifications = notifications || [];
    const safeUnreadCount = safeNotifications.filter(n => !n.isRead).length;

    return (
        <div ref={panelRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                title="Notifiche"
            >
                <Bell size={24} />
                {safeUnreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {safeUnreadCount > 9 ? '9+' : safeUnreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop for mobile to close when clicking outside */}
                    <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsOpen(false)}></div>

                    <div className="fixed inset-x-4 top-20 w-auto md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 origin-top-right overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Notifiche</h3>
                            <div className="flex gap-2">
                                {safeUnreadCount > 0 && (
                                    <button
                                        onClick={() => markAllNotificationsRead()}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        title="Segna tutte come lette"
                                    >
                                        <CheckCheck size={14} /> Leggi tutte
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {safeNotifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                    <Bell size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">Nessuna notifica</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {safeNotifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors relative group cursor-pointer ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                                            onClick={() => handleNotificationClick(n)}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5 shrink-0">
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm text-gray-900 mb-0.5 ${!n.isRead ? 'font-semibold' : ''}`}>{n.title}</p>
                                                    <p className="text-xs text-gray-600 leading-relaxed mb-1">{n.message}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {format(new Date(n.createdAt), 'd MMM yyyy, HH:mm', { locale: it })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    title="Elimina"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            {!n.isRead && (
                                                <div className="absolute top-4 right-4 h-2 w-2 bg-blue-500 rounded-full"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationPanel;
