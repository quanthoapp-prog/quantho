import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { UserProfile } from '../types';
import { User, Shield, CreditCard, Calendar, CheckCircle, XCircle, Clock, Search, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import LoadingSpinner from './LoadingSpinner';

const AdminPanelView: React.FC = () => {
    const { profile, allProfiles, fetchAllProfiles, updateProfile } = useFinance();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

    useEffect(() => {
        if (profile?.role === 'admin') {
            fetchAllProfiles();
        }
    }, [profile]);

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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pannello Amministratore</h2>
                    <p className="text-gray-500 mt-1">Gestisci utenti, ruoli e attivazioni abbonamenti.</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2">
                    <Shield size={20} />
                    <span className="font-bold">Modalità Admin attiva</span>
                </div>
            </div>

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
        </div>
    );
};

export default AdminPanelView;
