import React, { useState } from 'react';
import { PlusCircle, Search, Users } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../constants';
import EmptyState from './EmptyState';

const ClientsView: React.FC = () => {
    const { clients, transactions, currentYear, addClient } = useFinance();
    const [showAddClient, setShowAddClient] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });

    const handleAdd = async () => {
        if (newClient.name) {
            try {
                await addClient(newClient);
                setNewClient({ name: '', email: '', phone: '' });
                setShowAddClient(false);
            } catch (error) {
                console.error(error);
                // toast is handled in context, but currently disabled there.
            }
        }
    };

    const inputBaseClass = "w-full border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-900 dark:border-slate-600 transition-colors";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Clienti</h2>
                <button onClick={() => setShowAddClient(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow hover:bg-blue-700 transition-colors">
                    <PlusCircle size={20} />Nuovo cliente
                </button>
            </div>

            {showAddClient && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-2 border-blue-200 dark:border-blue-900/50 transition-colors">
                    <h3 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-400">Aggiungi cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nome</label>
                            <input type="text" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className={inputBaseClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                            <input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className={inputBaseClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Telefono</label>
                            <input type="tel" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className={inputBaseClass} />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button onClick={handleAdd} disabled={!newClient.name} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Salva</button>
                        <button onClick={() => setShowAddClient(false)} className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">Annulla</button>
                    </div>
                </div>
            )}

            {clients.length === 0 && !showAddClient ? (
                <EmptyState
                    title="Nessun Cliente"
                    message="Aggiungi i tuoi clienti per monitorare il fatturato generato da ciascuno."
                    icon={Users}
                    actionLabel="Nuovo Cliente"
                    onAction={() => setShowAddClient(true)}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map(client => {
                        const clientIncome = transactions
                            .filter(t => t.type === 'income' && t.client === client.name && new Date(t.date).getFullYear() === currentYear)
                            .reduce((sum, t) => sum + t.amount, 0);

                        return (
                            <div key={client.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border hover:border-blue-400 dark:hover:border-blue-500 border-gray-100 dark:border-slate-700 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Users className="text-blue-600 dark:text-blue-400" size={24} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-lg truncate text-gray-900 dark:text-white">{client.name}</h3>
                                        <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Fatturato ({currentYear}): <span className="text-green-600 dark:text-green-400 font-bold">{formatCurrency(clientIncome)}</span></div>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                                    {client.email && <div className="truncate">📧 {client.email}</div>}
                                    {client.phone && <div>📱 {client.phone}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ClientsView;