import React, { useState, useEffect, useMemo } from 'react';
import { Target, Trophy, AlertTriangle, PlusCircle, Trash2, Briefcase, Calendar, ArrowRight, Clock, Calculator, Info, Pencil, User, CheckCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../constants';
import { Contract } from '../types';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const GoalsView: React.FC = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, stats, currentYear, transactions, contracts, addContract, updateContract, deleteContract, atecoCodes, clients } = useFinance();
    const isCurrentYearLocked = settings.lockedYears?.includes(currentYear);
    const [tempGoal, setTempGoal] = useState(settings.annualGoal);

    // Form for contract
    const [showContractForm, setShowContractForm] = useState(false);
    const [editingContractId, setEditingContractId] = useState<number | null>(null);
    const [contractForm, setContractForm] = useState<Omit<Contract, 'id'>>({
        title: '',
        clientName: '',
        amount: 0,
        atecoCodeId: atecoCodes[0]?.id || '',
        status: 'pending',
        expectedDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        setTempGoal(settings.annualGoal);
    }, [settings.annualGoal]);

    const handleSaveGoal = () => {
        if (isCurrentYearLocked) {
            toast.error("Quest'anno è bloccato. Sbloccalo nelle impostazioni per modificare il target.");
            return;
        }
        updateSettings({
            ...settings,
            annualGoal: tempGoal
        });
    };

    const handleSaveExpenseGoal = (tag: string, limit: number) => {
        if (isCurrentYearLocked) {
            toast.error("Quest'anno è bloccato. Sbloccalo nelle impostazioni per modificare il budget.");
            return;
        }
        const newExpenseGoals = { ...settings.expenseGoals, [tag]: limit };
        if (limit === 0) delete newExpenseGoals[tag]; // Remove if 0

        updateSettings({
            ...settings,
            expenseGoals: newExpenseGoals
        });
    };

    const handleEditClick = (contract: Contract) => {
        if (isCurrentYearLocked) {
            toast.error("Quest'anno è bloccato. Sbloccalo nelle impostazioni per modificare il progetto.");
            return;
        }
        setEditingContractId(contract.id);
        setContractForm({
            title: contract.title,
            clientName: contract.clientName,
            amount: contract.amount,
            atecoCodeId: contract.atecoCodeId,
            status: contract.status,
            expectedDate: contract.expectedDate,
            notes: contract.notes || ''
        });
        setShowContractForm(true);
        // Scroll to form
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const handleFormSubmit = async () => {
        if (!contractForm.title || contractForm.amount <= 0) return;

        if (isCurrentYearLocked) {
            toast.error("Quest'anno è bloccato. Sbloccalo nelle impostazioni.");
            return;
        }

        if (editingContractId) {
            await updateContract({ ...contractForm, id: editingContractId });
        } else {
            await addContract(contractForm);
        }

        setContractForm({
            title: '',
            clientName: '',
            amount: 0,
            atecoCodeId: atecoCodes[0]?.id || '',
            status: 'pending',
            expectedDate: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setEditingContractId(null);
        setShowContractForm(false);
    };

    const handleQuickComplete = async (contract: Contract) => {
        if (isCurrentYearLocked) {
            toast.error("Quest'anno è bloccato. Sbloccalo nelle impostazioni.");
            return;
        }

        try {
            await updateContract({ ...contract, status: 'completed' });

            toast((t) => (
                <div className="flex flex-col gap-2">
                    <span className="font-bold text-green-700">✅ Progetto completato!</span>
                    <span className="text-xs text-gray-600">Vuoi registrare subito l'incasso reale nelle transazioni?</span>
                    <div className="flex gap-2 mt-1">
                        <button
                            className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-bold"
                            onClick={() => {
                                toast.dismiss(t.id);
                                navigate('/transactions', {
                                    state: {
                                        startAdding: true,
                                        prefill: {
                                            description: `Incasso: ${contract.title}`,
                                            amount: contract.amount.toString(),
                                            client: contract.clientName,
                                            type: 'income',
                                            category: 'business',
                                            atecoCodeId: contract.atecoCodeId
                                        }
                                    }
                                });
                            }}
                        >
                            Sì, registra incasso
                        </button>
                        <button
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs font-bold"
                            onClick={() => toast.dismiss(t.id)}
                        >
                            No, più tardi
                        </button>
                    </div>
                </div>
            ), { duration: 6000 });
        } catch (error) {
            toast.error("Errore durante l'aggiornamento.");
        }
    };

    // --- EXPENSE GOALS LOGIC ---
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        Object.keys(settings.expenseGoals || {}).forEach(t => tags.add(t));
        transactions.forEach(t => {
            if (t.tags) {
                const tTags = t.tags.split(',').map(s => s.trim()).filter(Boolean);
                tTags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [transactions, settings.expenseGoals]);

    const tagStats = useMemo(() => {
        const currentStats: { [tag: string]: number } = {};
        const previousStats: { [tag: string]: number } = {};

        transactions.forEach(t => {
            if (!t.tags || t.type !== 'expense') return;

            const tYear = new Date(t.date).getFullYear();
            const yearKey = tYear === currentYear ? 'current' : (tYear === currentYear - 1 ? 'prev' : null);

            if (!yearKey) return;

            const tTags = t.tags.split(',').map(s => s.trim()).filter(Boolean);
            tTags.forEach(tag => {
                const amount = t.amount;
                if (yearKey === 'current') {
                    currentStats[tag] = (currentStats[tag] || 0) + amount;
                } else {
                    previousStats[tag] = (previousStats[tag] || 0) + amount;
                }
            });
        });
        return { currentStats, previousStats };
    }, [transactions, currentYear]);

    // Contract totals
    const contractsTotal = useMemo(() => {
        return contracts
            .filter(c => c.status !== 'completed' && new Date(c.expectedDate).getFullYear() === currentYear)
            .reduce((sum, c) => sum + c.amount, 0);
    }, [contracts, currentYear]);

    const forecastedGoalPercentage = settings.annualGoal > 0 ? (stats.forecastedBusinessIncome / settings.annualGoal) * 100 : 0;

    return (
        <div className="space-y-8 pb-32">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pianificazione Obiettivi</h1>
                <p className="text-sm text-gray-500 mt-1">Gestisci la tua pipeline di progetti e monitora i tuoi traguardi.</p>
            </div>

            {/* A. ANNUAL REVENUE GOAL + FORECAST */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Trophy size={120} />
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Obiettivo Fatturato {currentYear}</h2>
                                <p className="text-sm text-gray-500">Target economico basato su incassi e contratti.</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                            <div className="w-full sm:w-64">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    Target Annuale (€)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={tempGoal}
                                        onChange={(e) => setTempGoal(parseFloat(e.target.value) || 0)}
                                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 font-bold text-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">EUR</div>
                                </div>
                            </div>
                            <button
                                onClick={handleSaveGoal}
                                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                            >
                                <Target size={20} />
                                Aggiorna Target
                            </button>
                        </div>
                    </div>

                    <div className="md:w-72 bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 italic">Incassato Reale:</span>
                            <span className="font-bold text-gray-900">{formatCurrency(stats.businessIncome)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 italic">Lavoro in Pipeline:</span>
                            <span className="font-bold text-blue-600">+ {formatCurrency(contractsTotal)}</span>
                        </div>
                        <div className="pt-2 border-t flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">Totale Previsto:</span>
                            <span className="text-xl font-black text-blue-700">{formatCurrency(stats.forecastedBusinessIncome)}</span>
                        </div>
                    </div>
                </div>

                {/* Combined Progress Visualization */}
                <div className="mt-8">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-3xl font-extrabold text-blue-600">{formatCurrency(stats.businessIncome)}</span>
                            <span className="text-gray-400 font-medium ml-2">raggiunti + {formatCurrency(contractsTotal)} previsti</span>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-semibold text-gray-600">
                                {stats.goalPercentage.toFixed(1)}% <span className="text-blue-400">({forecastedGoalPercentage.toFixed(1)}% previsto)</span>
                            </span>
                        </div>
                    </div>

                    <div className="h-5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                        {/* Real Progress */}
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-1000 ease-out z-10"
                            style={{ width: `${Math.min(100, stats.goalPercentage)}%` }}
                        ></div>
                        {/* Forecasted Progress */}
                        <div
                            className="h-full bg-blue-200 animate-pulse-slow border-l border-white/20"
                            style={{ width: `${Math.min(100 - stats.goalPercentage, forecastedGoalPercentage - stats.goalPercentage)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* PIPELINE / CONTRATTI SECTION */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Briefcase size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Pipeline Contratti e Progetti</h2>
                            <p className="text-xs text-gray-500">Lavori firmati o in corso non ancora fatturati.</p>
                        </div>
                    </div>
                    {!showContractForm && (
                        <button
                            onClick={() => {
                                if (isCurrentYearLocked) {
                                    toast.error("Quest'anno è bloccato. Sbloccalo nelle impostazioni.");
                                    return;
                                }
                                setEditingContractId(null);
                                setContractForm({
                                    title: '',
                                    clientName: '',
                                    amount: 0,
                                    atecoCodeId: atecoCodes[0]?.id || '',
                                    status: 'pending',
                                    expectedDate: new Date().toISOString().split('T')[0],
                                    notes: ''
                                });
                                setShowContractForm(true);
                            }}
                            className={`flex items-center gap-2 text-sm font-bold ${isCurrentYearLocked ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:text-purple-700'} transition-colors`}
                            disabled={isCurrentYearLocked}
                        >
                            <PlusCircle size={18} />
                            Aggiungi Progetto
                        </button>
                    )}
                </div>

                {showContractForm && (
                    <div className="p-6 bg-purple-50/30 border-b border-purple-100 animate-in fade-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-purple-800 mb-4 flex items-center gap-2">
                            {editingContractId ? <Pencil size={16} /> : <PlusCircle size={16} />}
                            {editingContractId ? 'Modifica Progetto' : 'Nuovo Progetto in Pipeline'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Titolo Progetto / Oggetto</label>
                                <input
                                    type="text"
                                    value={contractForm.title}
                                    onChange={e => setContractForm({ ...contractForm, title: e.target.value })}
                                    placeholder="Es: Sviluppo Web App, Consulenza Marketing..."
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Importo Previsto (€)</label>
                                <input
                                    type="number"
                                    value={contractForm.amount || ''}
                                    onChange={e => setContractForm({ ...contractForm, amount: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Cliente</label>
                                <div className="relative">
                                    <select
                                        value={contractForm.clientName}
                                        onChange={e => setContractForm({ ...contractForm, clientName: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
                                    >
                                        <option value="">Seleziona Cliente...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.name}>{client.name}</option>
                                        ))}
                                        <option value="CUSTOM_NEW">+ Aggiungi nome manualmente...</option>
                                    </select>
                                    <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                                {contractForm.clientName === 'CUSTOM_NEW' && (
                                    <input
                                        type="text"
                                        placeholder="Inserisci nome cliente..."
                                        className="w-full mt-2 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
                                        onBlur={e => setContractForm({ ...contractForm, clientName: e.target.value })}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Codice ATECO (per imposte)</label>
                                <select
                                    value={contractForm.atecoCodeId}
                                    onChange={e => setContractForm({ ...contractForm, atecoCodeId: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
                                >
                                    {atecoCodes.map(code => (
                                        <option key={code.id} value={code.id}>{code.code} - {code.description.substring(0, 30)}...</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Data Presunta Incasso</label>
                                <input
                                    type="date"
                                    value={contractForm.expectedDate}
                                    onChange={e => setContractForm({ ...contractForm, expectedDate: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 text-sm">
                            <button
                                onClick={() => {
                                    setShowContractForm(false);
                                    setEditingContractId(null);
                                }}
                                className="px-4 py-2 font-semibold text-gray-600"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleFormSubmit}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-md"
                            >
                                {editingContractId ? 'Aggiorna Progetto' : 'Salva Progetto'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-0">
                    {contracts.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Briefcase size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Nessun progetto in pipeline. Aggiungi i lavori acquisiti per vedere le proiezioni fiscali.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                                        <th className="px-6 py-3">Progetto / Cliente</th>
                                        <th className="px-6 py-3">Data Prevista</th>
                                        <th className="px-6 py-3">Importo</th>
                                        <th className="px-6 py-3">Stima Tasse</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contracts.map(contract => {
                                        const ateco = atecoCodes.find(a => a.id === contract.atecoCodeId) || atecoCodes[0];
                                        const taxable = contract.amount * (ateco?.coefficient || 0.78);
                                        const estimatedTax = taxable * (settings.taxRateType === '5%' ? 0.05 : 0.15) + (taxable * 0.26); // rough estimate

                                        return (
                                            <tr key={contract.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{contract.title}</div>
                                                    <div className="text-xs text-gray-500">{contract.clientName || 'Cliente non specificato'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {new Date(contract.expectedDate).toLocaleDateString('it-IT')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{formatCurrency(contract.amount)}</div>
                                                    <div className="text-[10px] text-gray-400">ATECO: {ateco?.code}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-red-500">-{formatCurrency(estimatedTax)}</div>
                                                    <div className="text-[10px] text-gray-400">Netto stimato: {formatCurrency(contract.amount - estimatedTax)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${contract.status === 'signed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        contract.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {contract.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        {contract.status !== 'completed' && (
                                                            <button
                                                                onClick={() => handleQuickComplete(contract)}
                                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                title="Segna come completato"
                                                            >
                                                                <CheckCircle size={15} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEditClick(contract)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteContract(contract.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-purple-900 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Calculator size={24} className="text-purple-300" />
                        <div>
                            <div className="text-xs text-purple-200 uppercase font-bold">Impatto Fiscale della Pipeline</div>
                            <div className="text-sm">Questi progetti genereranno circa <span className="font-bold text-red-300">{formatCurrency(stats.forecastedTaxTotal - stats.totalTaxEstimate)}</span> di tasse aggiuntive.</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-purple-200 uppercase font-bold">Saldo Finale Previsto</div>
                        <div className="text-xl font-black text-green-400">{formatCurrency(stats.forecastedLiquidity)}</div>
                    </div>
                </div>
            </div>

            {/* B. EXPENSE GOALS */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Target size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Budget Spese per Tag</h2>
                        <p className="text-sm text-gray-500">Controlla i costi impostando dei limiti per categoria.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {allTags.length === 0 && (
                        <div className="text-center py-8">
                            <Info size={32} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-gray-400 text-sm italic">Nessun tag trovato nelle transazioni.</p>
                        </div>
                    )}

                    {allTags.map(tag => {
                        const currentSpent = tagStats.currentStats[tag] || 0;
                        const prevSpent = tagStats.previousStats[tag] || 0;
                        const goal = settings.expenseGoals?.[tag] || 0;
                        const hasGoal = goal > 0;
                        const percent = hasGoal ? (currentSpent / goal) * 100 : 0;
                        const isOver = currentSpent > goal;

                        return (
                            <div key={tag} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800 text-lg capitalize">{tag}</span>
                                            {prevSpent > 0 && (
                                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                                    Prev Year: {formatCurrency(prevSpent)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            Speso quest'anno: <span className={`font-semibold ${isOver && hasGoal ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(currentSpent)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Budget Max:</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            defaultValue={goal === 0 ? '' : goal}
                                            onBlur={(e) => handleSaveExpenseGoal(tag, parseFloat(e.target.value) || 0)}
                                            className="w-32 px-3 py-2 border rounded-lg font-bold text-right focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                </div>

                                {hasGoal && (
                                    <div className="relative pt-1">
                                        <div className="flex mb-2 items-center justify-between text-xs">
                                            <div className={`font-semibold ${isOver ? 'text-red-600' : 'text-orange-600'}`}>
                                                {percent.toFixed(0)}% del budget utilizzato
                                            </div>
                                            <div className="text-gray-400">Rimanente: {formatCurrency(Math.max(0, goal - currentSpent))}</div>
                                        </div>
                                        <div className="overflow-hidden h-2.5 text-xs flex rounded bg-gray-100">
                                            <div
                                                style={{ width: `${Math.min(100, percent)}%` }}
                                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700 ${isOver ? 'bg-red-500' : 'bg-orange-500'}`}
                                            ></div>
                                        </div>
                                        {isOver && (
                                            <div className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} />
                                                Sforamento di {formatCurrency(currentSpent - goal)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Suggestions / Tips */}
            {!settings.annualGoal && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
                    <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold">Nessun obiettivo annuale impostato</h4>
                        <p className="text-sm">
                            Impostare un obiettivo ti aiuta a focalizzarti. Un buon obiettivo è solitamente il 20-30% superiore al tuo fatturato di pareggio ({formatCurrency(stats.breakEvenTurnover)}).
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalsView;