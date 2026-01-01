import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { UserProfile } from '../types';
import { User, Shield, CreditCard, Calendar, CheckCircle, XCircle, Clock, Search, ChevronRight, Edit2, Save, X, MessageSquare, Send, Users, AlertCircle, Info, Megaphone, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import LoadingSpinner from './LoadingSpinner';
import { notificationService } from '../services/notifications';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface BroadcastMessage {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    sentAt: string;
    recipientCount: number;
}

const AdminPanelView: React.FC = () => {
    const { profile, allProfiles, fetchAllProfiles, updateProfile } = useFinance();
    const [activeTab, setActiveTab] = useState<'users' | 'messages'>('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

    // Broadcast message state
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
    const [isSending, setIsSending] = useState(false);
    const [messageHistory, setMessageHistory] = useState<BroadcastMessage[]>([]);

    useEffect(() => {
        if (profile?.role === 'admin') {
            fetchAllProfiles();
            loadMessageHistory();
        }
    }, [profile]);

    const loadMessageHistory = async () => {
        const { data, error } = await supabase
            .from('broadcast_messages')
            .select('*')
            .order('sent_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching broadcast history:', error);
            return;
        }

        if (data) {
            setMessageHistory(data.map(m => ({
                id: m.id,
                title: m.title,
                message: m.message,
                type: m.type as any,
                sentAt: m.sent_at,
                recipientCount: m.recipient_count
            })));
        }
    };

    const saveMessageToHistory = async (msg: Omit<BroadcastMessage, 'id'>) => {
        const { error } = await supabase.from('broadcast_messages').insert({
            title: msg.title,
            message: msg.message,
            type: msg.type,
            recipient_count: msg.recipientCount,
            sent_at: msg.sentAt
        });

        if (error) {
            console.error('Error saving broadcast to history:', error);
        } else {
            loadMessageHistory(); // Reload from DB
        }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
            toast.error('Compila tutti i campi');
            return;
        }

        setIsSending(true);
        try {
            // Get all user IDs
            const userIds = allProfiles.map(p => p.id);

            if (userIds.length === 0) {
                toast.error('Nessun utente trovato');
                setIsSending(false);
                return;
            }

            console.log(`Sending broadcast to ${userIds.length} users...`);

            // Use PostgreSQL function to bypass RLS
            const promises = userIds.map(async (userId) => {
                const { data, error } = await supabase.rpc('create_notification_as_admin', {
                    target_user_id: userId,
                    notification_title: broadcastTitle,
                    notification_message: broadcastMessage,
                    notification_type: broadcastType,
                    notification_link: null,
                    notification_reminder_id: null,
                    notification_deadline_id: null
                });

                if (error) {
                    console.error(`Error sending to user ${userId}:`, error);
                    throw error;
                }

                return data;
            });

            await Promise.all(promises);

            // Save to history (DB)
            await saveMessageToHistory({
                title: broadcastTitle,
                message: broadcastMessage,
                type: broadcastType,
                sentAt: new Date().toISOString(),
                recipientCount: userIds.length
            });

            toast.success(`Messaggio inviato a ${userIds.length} utenti!`);

            // Reset form
            setBroadcastTitle('');
            setBroadcastMessage('');
            setBroadcastType('info');
        } catch (error: any) {
            console.error('Error sending broadcast:', error);
            const errorMessage = error?.message || error?.toString() || 'Errore sconosciuto';
            toast.error(`Errore: ${errorMessage}`);
        } finally {
            setIsSending(false);
        }
    };

    if (!profile || profile.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="bg-red-100 p-4 rounded-full text-red-600 mb-4">
                    <Shield size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h2>
                <p className="text-gray-600 max-w-md">Questa sezione è riservata esclusivamente agli amministratori del sistema.</p>
            </div>
        );
    }

    const filteredProfiles = allProfiles.filter(p =>
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (p: UserProfile) => {
        setEditingId(p.id);
        setEditForm({
            role: p.role,
            subscriptionStatus: p.subscriptionStatus,
            subscriptionEndDate: p.subscriptionEndDate
        });
    };

    const handleSave = async (id: string) => {
        await updateProfile(id, editForm);
        setEditingId(null);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="text-green-500" size={18} />;
            case 'expired': return <XCircle className="text-red-500" size={18} />;
            case 'trial': return <Clock className="text-blue-500" size={18} />;
            case 'canceled': return <XCircle className="text-gray-400" size={18} />;
            default: return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Abbonato';
            case 'expired': return 'Scaduto';
            case 'trial': return 'In Prova';
            case 'canceled': return 'Annullato';
            default: return status;
        }
    };

    const getMessageTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-green-500" size={20} />;
            case 'warning': return <AlertCircle className="text-orange-500" size={20} />;
            case 'error': return <XCircle className="text-red-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    const getMessageTypeLabel = (type: string) => {
        switch (type) {
            case 'success': return 'Successo';
            case 'warning': return 'Avviso';
            case 'error': return 'Errore';
            default: return 'Info';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pannello Amministratore</h2>
                    <p className="text-gray-500 mt-1">Gestisci utenti, abbonamenti e comunicazioni.</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2">
                    <Shield size={20} />
                    <span className="font-bold">Modalità Admin attiva</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'users'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Users size={18} />
                    Gestione Utenti
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'messages'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <MessageSquare size={18} />
                    Messaggi Broadcast
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <>
                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Totale Utenti</p>
                                <p className="text-2xl font-bold text-gray-900">{allProfiles.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="bg-green-50 p-3 rounded-xl text-green-600">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Abbonati Attivi</p>
                                <p className="text-2xl font-bold text-gray-900">{allProfiles.filter(p => p.subscriptionStatus === 'active').length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="bg-yellow-50 p-3 rounded-xl text-yellow-600">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Utenti in Trial</p>
                                <p className="text-2xl font-bold text-gray-900">{allProfiles.filter(p => p.subscriptionStatus === 'trial').length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-gray-900">Lista Utenti</h3>
                            <div className="relative max-w-md w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cerca email o ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold">Utente / Email</th>
                                        <th className="px-6 py-4 text-left font-bold">Ruolo</th>
                                        <th className="px-6 py-4 text-left font-bold">Stato Abbonamento</th>
                                        <th className="px-6 py-4 text-left font-bold">Scadenza</th>
                                        <th className="px-6 py-4 text-right font-bold">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProfiles.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {p.email[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{p.email}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">ID: {p.id.slice(0, 8)}...</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingId === p.id ? (
                                                    <select
                                                        value={editForm.role}
                                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'user' | 'admin' })}
                                                        className="text-sm border rounded px-2 py-1"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${p.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {p.role}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingId === p.id ? (
                                                    <select
                                                        value={editForm.subscriptionStatus}
                                                        onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value as any })}
                                                        className="text-sm border rounded px-2 py-1"
                                                    >
                                                        <option value="trial">In Prova</option>
                                                        <option value="active">Abbonato</option>
                                                        <option value="expired">Scaduto</option>
                                                        <option value="canceled">Annullato</option>
                                                    </select>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(p.subscriptionStatus)}
                                                        <span className="text-sm text-gray-700">{getStatusLabel(p.subscriptionStatus)}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingId === p.id ? (
                                                    <input
                                                        type="date"
                                                        value={editForm.subscriptionEndDate?.split('T')[0] || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, subscriptionEndDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                                        className="text-sm border rounded px-2 py-1"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {p.subscriptionEndDate ? format(new Date(p.subscriptionEndDate), 'dd/MM/yyyy') : '---'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {editingId === p.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleSave(p.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Salva">
                                                            <Save size={18} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Annulla">
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifica">
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <div className="space-y-6">
                    {/* Send Broadcast Form */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                                <Megaphone size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Invia Messaggio Broadcast</h3>
                                <p className="text-sm text-gray-500">Il messaggio verrà inviato a tutti i {allProfiles.length} utenti registrati</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tipo di Messaggio</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button
                                        onClick={() => setBroadcastType('info')}
                                        className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${broadcastType === 'info'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Info size={18} />
                                        <span className="text-sm font-bold">Info</span>
                                    </button>
                                    <button
                                        onClick={() => setBroadcastType('success')}
                                        className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${broadcastType === 'success'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Gift size={18} />
                                        <span className="text-sm font-bold">Promo</span>
                                    </button>
                                    <button
                                        onClick={() => setBroadcastType('warning')}
                                        className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${broadcastType === 'warning'
                                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <AlertCircle size={18} />
                                        <span className="text-sm font-bold">Avviso</span>
                                    </button>
                                    <button
                                        onClick={() => setBroadcastType('error')}
                                        className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${broadcastType === 'error'
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <XCircle size={18} />
                                        <span className="text-sm font-bold">Urgente</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Titolo</label>
                                <input
                                    type="text"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="Es. Nuovo aggiornamento disponibile!"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    maxLength={100}
                                />
                                <p className="text-xs text-gray-400 mt-1">{broadcastTitle.length}/100 caratteri</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Messaggio</label>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    placeholder="Scrivi qui il contenuto del messaggio..."
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-400 mt-1">{broadcastMessage.length}/500 caratteri</p>
                            </div>

                            <button
                                onClick={handleSendBroadcast}
                                disabled={isSending || !broadcastTitle.trim() || !broadcastMessage.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                        Invio in corso...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Invia a tutti gli utenti
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Message History */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Storico Messaggi Inviati</h3>
                            <p className="text-sm text-gray-500 mt-1">Ultimi {messageHistory.length} messaggi broadcast</p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {messageHistory.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Nessun messaggio inviato ancora</p>
                                </div>
                            ) : (
                                messageHistory.map(msg => (
                                    <div key={msg.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="shrink-0">
                                                {getMessageTypeIcon(msg.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{msg.title}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase whitespace-nowrap ${msg.type === 'info' ? 'bg-blue-100 text-blue-700' :
                                                        msg.type === 'success' ? 'bg-green-100 text-green-700' :
                                                            msg.type === 'warning' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {getMessageTypeLabel(msg.type)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {format(new Date(msg.sentAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={12} />
                                                        {msg.recipientCount} destinatari
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanelView;
