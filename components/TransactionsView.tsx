import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Banknote, ShieldCheck, Pencil, Save, Search, Receipt, Info } from 'lucide-react';
import TagInput from './TagInput';
import { Transaction } from '../types';
import { formatCurrency } from '../constants';
import { useFinance } from '../context/FinanceContext';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './EmptyState';
import { toast } from 'react-hot-toast';

const TransactionsView: React.FC = () => {
    const {
        currentYear,
        transactions,
        clients,
        atecoCodes,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        settings,
        updateSettings
    } = useFinance();

    const isCurrentYearLocked = settings.lockedYears?.includes(currentYear);

    const location = useLocation();
    const navigate = useNavigate();

    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');

    // Advanced Filters State
    const [filters, setFilters] = useState({
        period: 'all', // 'all', 'current-month', 'prev-month', 'last-3-months', 'last-6-months', 'year', 'custom'
        customStartDate: '',
        customEndDate: '',
        type: 'all', // 'all', 'income', 'expense'
        category: 'all', // 'all', 'business', 'personal', 'tax', 'inps'
        status: 'all', // 'all', 'active', 'scheduled'
    });

    const [showFilters, setShowFilters] = useState(false);

    // Initial check for startAdding state from navigation
    useEffect(() => {
        if (location.state?.startAdding) {
            setShowAddTransaction(true);
            setEditingId(null);

            if (location.state.prefill) {
                setNewTransaction(prev => ({
                    ...prev,
                    ...location.state.prefill
                }));
            }

            // Clear the state so it doesn't trigger again on refresh/re-nav
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    // Local state for form
    const [newTransaction, setNewTransaction] = useState<{
        date: string;
        type: 'income' | 'expense';
        category: 'business' | 'personal' | 'tax' | 'inps';
        amount: string;
        description: string;
        client: string;
        tags: string;
        atecoCodeId: string;
    }>({
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        category: 'business',
        amount: '',
        description: '',
        client: '',
        tags: '',
        atecoCodeId: '',
    });

    // Default Ateco Code Effect
    useEffect(() => {
        if (!editingId && !newTransaction.atecoCodeId && atecoCodes.length > 0) {
            setNewTransaction(prev => ({ ...prev, atecoCodeId: atecoCodes[0].id }));
        }
    }, [atecoCodes, editingId, newTransaction.atecoCodeId]);


    // Tag Helpers
    const handleSaveTag = (tag: string) => {
        const saved = settings.savedTags || [];
        if (!saved.includes(tag)) {
            updateSettings({
                ...settings,
                savedTags: [...saved, tag].sort()
            });
        }
    };

    const handleDeleteTag = (tag: string) => {
        const saved = settings.savedTags || [];
        updateSettings({
            ...settings,
            savedTags: saved.filter(t => t !== tag)
        });
    };

    // Save Logic
    const handleSave = async () => {
        if (newTransaction.amount && newTransaction.description) {
            // Determine status based on date
            const transactionDate = new Date(newTransaction.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            transactionDate.setHours(0, 0, 0, 0);

            const status: 'active' | 'scheduled' = transactionDate > today ? 'scheduled' : 'active';

            const transaction = {
                date: newTransaction.date,
                type: newTransaction.type,
                category: newTransaction.category,
                amount: parseFloat(newTransaction.amount),
                description: newTransaction.description,
                client: newTransaction.client || undefined,
                tags: newTransaction.tags || undefined,
                atecoCodeId: newTransaction.atecoCodeId || undefined,
                status
            };

            if (editingId) {
                await updateTransaction(editingId, transaction);
            } else {
                await addTransaction(transaction);
            }

            resetForm();
        }
    };

    const handleEdit = (t: Transaction) => {
        if (isCurrentYearLocked) {
            toast.error("Quest'anno è bloccato. Sbloccalo nelle impostazioni per modificare.");
            return;
        }
        setNewTransaction({
            date: t.date,
            type: t.type,
            category: t.category,
            amount: t.amount.toString(),
            description: t.description,
            client: t.client || '',
            tags: t.tags || '',
            atecoCodeId: t.atecoCodeId || '',
        });
        setEditingId(t.id);
        setShowAddTransaction(true);
    };

    const handleDeleteClick = (id: number) => {
        if (isCurrentYearLocked) {
            toast.error("Quest'anno è bloccato. Sbloccalo nelle impostazioni per eliminare.");
            return;
        }
        setDeleteModal({ isOpen: true, id });
    };

    const performDelete = async () => {
        if (deleteModal.id !== null) {
            await deleteTransaction(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    const resetForm = () => {
        const defaultCode = atecoCodes.length > 0 ? atecoCodes[0].id : '';
        setNewTransaction({
            date: new Date().toISOString().split('T')[0],
            type: 'income', category: 'business', amount: '', description: '', client: '', tags: '',
            atecoCodeId: defaultCode
        });
        setEditingId(null);
        setShowAddTransaction(false);
    };

    // Helper to get date range based on period filter
    const getDateRange = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        switch (filters.period) {
            case 'current-month':
                return {
                    start: new Date(currentYear, currentMonth, 1),
                    end: new Date(currentYear, currentMonth + 1, 0)
                };
            case 'prev-month':
                return {
                    start: new Date(currentYear, currentMonth - 1, 1),
                    end: new Date(currentYear, currentMonth, 0)
                };
            case 'last-3-months':
                return {
                    start: new Date(currentYear, currentMonth - 2, 1),
                    end: new Date(currentYear, currentMonth + 1, 0)
                };
            case 'last-6-months':
                return {
                    start: new Date(currentYear, currentMonth - 5, 1),
                    end: new Date(currentYear, currentMonth + 1, 0)
                };
            case 'year':
                return {
                    start: new Date(currentYear, 0, 1),
                    end: new Date(currentYear, 11, 31)
                };
            case 'custom':
                if (filters.customStartDate && filters.customEndDate) {
                    return {
                        start: new Date(filters.customStartDate),
                        end: new Date(filters.customEndDate)
                    };
                }
                return null;
            default:
                return null;
        }
    };

    // View Helpers - Enhanced with filters
    const filteredTransactions = transactions
        .filter(t => new Date(t.date).getFullYear() === currentYear)
        .filter(t => {
            // Period filter
            const dateRange = getDateRange();
            if (dateRange) {
                const tDate = new Date(t.date);
                if (tDate < dateRange.start || tDate > dateRange.end) {
                    return false;
                }
            }

            // Type filter
            if (filters.type !== 'all' && t.type !== filters.type) {
                return false;
            }

            // Category filter
            if (filters.category !== 'all' && t.category !== filters.category) {
                return false;
            }

            // Status filter
            if (filters.status !== 'all' && t.status !== filters.status) {
                return false;
            }

            // Search term filter
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                const dateStr = new Date(t.date).toLocaleDateString('it-IT');
                return (
                    t.description.toLowerCase().includes(s) ||
                    (t.client?.toLowerCase().includes(s)) ||
                    (t.tags?.toLowerCase().includes(s)) ||
                    t.amount.toString().includes(s) ||
                    dateStr.includes(s) ||
                    t.category.toLowerCase().includes(s) ||
                    t.type.toLowerCase().includes(s)
                );
            }

            return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate totals for filtered results
    const filteredStats = filteredTransactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
        } else {
            acc.expenses += t.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });

    const hasActiveFilters = filters.period !== 'all' || filters.type !== 'all' ||
        filters.category !== 'all' || filters.status !== 'all' || searchTerm !== '';

    const getAtecoLabel = (id?: string) => {
        if (!id) return null;
        const code = atecoCodes.find(c => c.id === id);
        return code ? `${code.code} (${(code.coefficient * 100).toFixed(0)}%)` : null;
    };

    const getCategoryBadge = (category: string) => {
        switch (category) {
            case 'tax': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium border border-red-200">F24 TASSE</span>;
            case 'inps': return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium border border-purple-200">F24 INPS</span>;
            case 'business': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">BUSINESS</span>;
            case 'personal': return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">PERSONALE</span>;
            case 'extra': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium border border-amber-200">EXTRA</span>;
            default: return null;
        }
    };

    const inputBaseClass = "w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white";

    return (
        <div className="space-y-6">
            <ConfirmDialog
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={performDelete}
                title="Elimina Transazione"
                message="Sei sicuro di voler eliminare questa transazione? L'operazione non è reversibile."
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Transazioni ({currentYear})</h2>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cerca transazione..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
                        />
                    </div>
                    <button
                        id="open-add-transaction-button"
                        onClick={() => {
                            if (isCurrentYearLocked) {
                                toast.error("Quest'anno è bloccato. Sbloccalo nelle impostazioni per aggiungere.");
                                return;
                            }
                            setEditingId(null);
                            setShowAddTransaction(true);
                        }}
                        className={`${isCurrentYearLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow transition-colors whitespace-nowrap`}
                        disabled={isCurrentYearLocked}
                    >
                        <PlusCircle size={20} />
                        <span className="hidden md:inline">Nuova transazione</span>
                        <span className="md:hidden">Nuova</span>
                    </button>
                </div>
            </div>


            {/* ADVANCED FILTERS PANEL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                    >
                        <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Filtri Avanzati
                        {hasActiveFilters && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                Attivi
                            </span>
                        )}
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={() => {
                                setFilters({
                                    period: 'all',
                                    customStartDate: '',
                                    customEndDate: '',
                                    type: 'all',
                                    category: 'all',
                                    status: 'all',
                                });
                                setSearchTerm('');
                            }}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                            Cancella filtri
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t">
                        {/* Period Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Periodo</label>
                            <select
                                value={filters.period}
                                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="all">Tutto l'anno</option>
                                <option value="current-month">Mese corrente</option>
                                <option value="prev-month">Mese precedente</option>
                                <option value="last-3-months">Ultimi 3 mesi</option>
                                <option value="last-6-months">Ultimi 6 mesi</option>
                                <option value="year">Anno {currentYear}</option>
                                <option value="custom">Personalizzato</option>
                            </select>
                        </div>

                        {/* Custom Date Range */}
                        {filters.period === 'custom' && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Data inizio</label>
                                    <input
                                        type="date"
                                        value={filters.customStartDate}
                                        onChange={(e) => setFilters({ ...filters, customStartDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Data fine</label>
                                    <input
                                        type="date"
                                        value={filters.customEndDate}
                                        onChange={(e) => setFilters({ ...filters, customEndDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </>
                        )}

                        {/* Type Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="all">Tutte</option>
                                <option value="income">Solo Entrate</option>
                                <option value="expense">Solo Uscite</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="all">Tutte</option>
                                <option value="business">Business</option>
                                <option value="personal">Personale</option>
                                <option value="extra">Extra (Regali/Affitti)</option>
                                <option value="tax">F24 Tasse</option>
                                <option value="inps">F24 INPS</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Stato</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="all">Tutte</option>
                                <option value="active">Attive</option>
                                <option value="scheduled">Programmate</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Compact Stats Display */}
                {hasActiveFilters && filteredTransactions.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Risultati:</span>
                            <span className="font-bold text-gray-900">{filteredTransactions.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Entrate:</span>
                            <span className="font-bold text-green-600">{formatCurrency(filteredStats.income)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Uscite:</span>
                            <span className="font-bold text-red-600">{formatCurrency(filteredStats.expenses)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Saldo:</span>
                            <span className={`font-bold ${filteredStats.income - filteredStats.expenses >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {formatCurrency(filteredStats.income - filteredStats.expenses)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {showAddTransaction && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-4 text-blue-700">{editingId ? 'Modifica transazione' : 'Aggiungi transazione'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* FIRST ROW: Date, Type, Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                            <input
                                id="tx-date"
                                type="date"
                                value={newTransaction.date}
                                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                className={inputBaseClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Movimento</label>
                            <select
                                id="tx-type"
                                value={newTransaction.type}
                                onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense', category: 'business' })}
                                className={inputBaseClass}
                            >
                                <option value="income">Entrata (+)</option>
                                <option value="expense">Uscita (-)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Importo (€)</label>
                            <input
                                id="tx-amount"
                                type="number"
                                step="0.01"
                                value={newTransaction.amount}
                                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                className={inputBaseClass}
                                placeholder="0.00"
                            />
                        </div>

                        {/* SECOND ROW: Description (Full) */}
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                            <input
                                id="tx-description"
                                type="text"
                                value={newTransaction.description}
                                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                className={inputBaseClass}
                                placeholder="Es: Fattura cliente X"
                            />
                        </div>

                        {/* THIRD ROW: Context Specific */}
                        {newTransaction.type === 'expense' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia Uscita</label>
                                <select
                                    value={newTransaction.category}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value as any })}
                                    className={inputBaseClass}
                                >
                                    <option value="business">Spesa Business</option>
                                    <option value="personal">Spesa Personale</option>
                                    <option value="tax">F24 - Tasse (Imp. Sostitutiva)</option>
                                    <option value="inps">F24 - Contributi INPS</option>
                                </select>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia Entrata</label>
                                    <select
                                        value={newTransaction.category}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value as any })}
                                        className={inputBaseClass}
                                    >
                                        <option value="business">Fatturato Business</option>
                                        <option value="extra">Altra Entrata (Regali, Affitti, Extra)</option>
                                    </select>
                                </div>
                                {newTransaction.category === 'business' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                            <select value={newTransaction.client} onChange={(e) => setNewTransaction({ ...newTransaction, client: e.target.value })} className={inputBaseClass}>
                                                <option value="">Seleziona</option>
                                                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Codice ATECO</label>
                                            <select
                                                value={newTransaction.atecoCodeId}
                                                onChange={(e) => setNewTransaction({ ...newTransaction, atecoCodeId: e.target.value })}
                                                className={inputBaseClass}
                                            >
                                                {atecoCodes.map(code => (
                                                    <option key={code.id} value={code.id}>
                                                        {code.code} - {code.description} ({(code.coefficient * 100).toFixed(0)}%)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="md:col-span-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-2">
                                        <Info size={16} className="text-blue-500" />
                                        <p className="text-xs text-blue-700">Questa entrata non verrà conteggiata ai fini del fatturato imponibile.</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* TAG INPUT REPLACEMENT */}
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tag (es. software, affitto, marketing)</label>
                            <TagInput
                                value={newTransaction.tags}
                                onChange={(val) => setNewTransaction({ ...newTransaction, tags: val })}
                                savedTags={Array.from(new Set([
                                    ...(settings.savedTags || []),
                                    ...transactions.flatMap(t => t.tags ? t.tags.split(',').map(tag => tag.trim()) : [])
                                ])).sort()}
                                onSaveTag={handleSaveTag}
                                onDeleteTag={handleDeleteTag}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button
                            id="save-transaction-button"
                            onClick={handleSave}
                            disabled={!newTransaction.amount || !newTransaction.description}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {editingId ? <><Save size={18} /> Aggiorna</> : 'Salva'}
                        </button>
                        <button onClick={resetForm} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Annulla</button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredTransactions.length === 0 && !showAddTransaction && (
                <EmptyState
                    title={searchTerm ? "Nessun Risultato" : "Nessuna Transazione"}
                    message={searchTerm
                        ? `Non abbiamo trovato transazioni che corrispondono a "${searchTerm}". Prova con un termine diverso.`
                        : `Non ci sono ancora movimenti registrati per l'anno ${currentYear}. Inizia aggiungendo la tua prima entrata o uscita.`}
                    icon={searchTerm ? Search : Receipt}
                    actionLabel={searchTerm ? "Pulisci Ricerca" : "Nuova Transazione"}
                    onAction={() => searchTerm ? setSearchTerm('') : setShowAddTransaction(true)}
                />
            )}

            {/* Content when there are transactions */}
            {filteredTransactions.length > 0 && (
                <>
                    {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
                    <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrizione</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipologia</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importo</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(t.date).toLocaleDateString('it-IT')}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="font-medium">{t.description}</div>
                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                {t.client && <span className="text-xs text-blue-600">Cliente: {t.client}</span>}
                                                {t.type === 'income' && t.atecoCodeId && (
                                                    <span className="text-xs text-gray-500">
                                                        ATECO: {getAtecoLabel(t.atecoCodeId) || <span className="text-orange-500">Non specificato</span>}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex flex-col gap-1 items-start">
                                                {getCategoryBadge(t.category)}
                                                {t.status === 'scheduled' && (
                                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium inline-block">
                                                        📅 Programmata
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors" title="Modifica">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteClick(t.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors" title="Elimina">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARD VIEW (Filtered via CSS) */}
                    <div className="md:hidden space-y-4">
                        {filteredTransactions.map(t => (
                            <div key={t.id} className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">{new Date(t.date).toLocaleDateString('it-IT')}</div>
                                        <div className="font-semibold text-gray-900">{t.description}</div>
                                        {t.client && <div className="text-xs text-blue-600 mt-0.5">Cliente: {t.client}</div>}
                                    </div>
                                    <div className={`text-lg font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                                    <div className="flex flex-col gap-1 items-start">
                                        {getCategoryBadge(t.category)}
                                        {t.status === 'scheduled' && (
                                            <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                                📅 Programmata
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(t)} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors">
                                            <Pencil size={18} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(t.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default TransactionsView;