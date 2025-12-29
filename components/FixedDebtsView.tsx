import React, { useState } from 'react';
import { PlusCircle, Repeat, PauseCircle, Calendar, Pencil, Lock, Trash2, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { FixedDebt } from '../types';
import { formatCurrency, getMonthsElapsed } from '../constants';
import ConfirmDialog from './ConfirmDialog';
import EmptyState from './EmptyState';

const initialDebtState: Omit<FixedDebt, 'id'> = {
    name: '', totalDue: 0, installment: 0, debitDay: 1, isSuspended: false, type: 'debt',
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear(),
    paymentMode: 'manual',
};

const FixedDebtsView: React.FC = () => {
    const {
        fixedDebts,
        currentYear,
        addFixedDebt,
        updateFixedDebt,
        deleteFixedDebt,
        registerDebtPayment
    } = useFinance();

    // Form state handles strings for inputs to allow empty states during typing
    const [debtToEdit, setDebtToEdit] = useState<(Omit<FixedDebt, 'id'> & { id?: number, totalDueStr?: string, installmentStr?: string }) | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentFullYear = today.getFullYear();

    const openNewDebt = () => {
        setDebtToEdit({
            ...initialDebtState,
            startYear: currentYear, // Force start year to current view year
            totalDueStr: '',
            installmentStr: ''
        });
    };

    const openEditDebt = (debt: FixedDebt) => {
        setDebtToEdit({
            ...debt,
            totalDueStr: debt.totalDue.toString(),
            installmentStr: debt.installment.toString()
        });
    };

    const saveDebt = async () => {
        if (!debtToEdit || !debtToEdit.name) return;

        const totalDue = parseFloat(debtToEdit.totalDueStr || '0');
        const installment = parseFloat(debtToEdit.installmentStr || '0');

        if (isNaN(totalDue) || isNaN(installment)) return;

        const debtToSave: any = {
            id: debtToEdit.id || undefined,
            name: debtToEdit.name,
            totalDue: totalDue,
            installment: installment,
            debitDay: Number(debtToEdit.debitDay),
            startMonth: Number(debtToEdit.startMonth),
            startYear: Number(debtToEdit.startYear),
            isSuspended: debtToEdit.isSuspended,
            type: debtToEdit.type,
            fiscalCategory: debtToEdit.type === 'fiscal' ? (debtToEdit.fiscalCategory || 'tax') : undefined,
            paymentMode: debtToEdit.paymentMode || 'manual'
        };

        try {
            if (debtToEdit.id) {
                await updateFixedDebt({ ...debtToSave, id: debtToEdit.id });
            } else {
                await addFixedDebt(debtToSave);
            }
            setDebtToEdit(null);
        } catch (error) {
            console.error(error);
        }
    };

    const confirmDelete = (id: number) => {
        setDeleteModal({ isOpen: true, id });
    };

    const performDelete = async () => {
        if (deleteModal.id) {
            try {
                await deleteFixedDebt(deleteModal.id);
            } catch (error) {
                console.error(error);
            }
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    const toggleSuspension = async (id: number) => {
        const debt = fixedDebts.find(d => d.id === id);
        if (debt) {
            await updateFixedDebt({ ...debt, isSuspended: !debt.isSuspended });
        }
    };

    const handleRegisterPayment = async (id: number) => {
        try {
            await registerDebtPayment(id);
        } catch (error) {
            console.error(error);
        }
    };

    // Safety Checks
    const isHistorical = (debtStartYear: number) => debtStartYear < currentYear;

    const inputBaseClass = "w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500";

    return (
        <div className="space-y-6">
            <ConfirmDialog
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={performDelete}
                title="Elimina Debito"
                message="Sei sicuro di voler eliminare questo debito? L'operazione non è reversibile."
            />
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Debiti e Abbonamenti Fissi</h2>
                <button onClick={openNewDebt} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow hover:bg-blue-700 transition-colors">
                    <PlusCircle size={20} />Nuovo Debito {currentYear}
                </button>
            </div>

            {debtToEdit !== null && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-4 text-blue-700">{debtToEdit.id ? 'Modifica Debito' : 'Nuovo Debito'}</h3>

                    {/* Warning for editing historical data */}
                    {debtToEdit.id && isHistorical(debtToEdit.startYear) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex gap-3 text-sm text-yellow-800">
                            <AlertTriangle className="flex-shrink-0" size={20} />
                            <div>
                                <strong>Attenzione: Modifica Storico</strong>
                                <p>Questo debito è iniziato nel passato ({debtToEdit.startYear}). Modificando l'importo della rata, altererai i calcoli degli anni precedenti.</p>
                                <p className="mt-1 font-medium underline">Consiglio: Se la rata è cambiata, sospendi questo debito e creane uno nuovo per l'anno corrente.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            <input type="text" value={debtToEdit.name} onChange={(e) => setDebtToEdit({ ...debtToEdit, name: e.target.value })} className={inputBaseClass} placeholder="Mutuo, Netflix" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Totale (€)</label>
                            <input type="number" step="0.01" value={debtToEdit.totalDueStr} onChange={(e) => setDebtToEdit({ ...debtToEdit, totalDueStr: e.target.value })} className={inputBaseClass} placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rata Mensile (€)</label>
                            <input type="number" step="0.01" value={debtToEdit.installmentStr} onChange={(e) => setDebtToEdit({ ...debtToEdit, installmentStr: e.target.value })} className={inputBaseClass} placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipologia</label>
                            <select
                                value={debtToEdit.type}
                                onChange={(e) => setDebtToEdit({ ...debtToEdit, type: e.target.value as any })}
                                className={inputBaseClass}
                            >
                                <option value="debt">Debito Generico</option>
                                <option value="subscription">Abbonamento</option>
                                <option value="fiscal">Fiscale (Arretrati)</option>
                            </select>
                        </div>
                        {debtToEdit.type === 'fiscal' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Fiscale</label>
                                <select
                                    value={debtToEdit.fiscalCategory || 'tax'}
                                    onChange={(e) => setDebtToEdit({ ...debtToEdit, fiscalCategory: e.target.value as any })}
                                    className={inputBaseClass}
                                >
                                    <option value="tax">Imposta Sostitutiva</option>
                                    <option value="inps">Contributi INPS (Deducibili)</option>
                                </select>
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Modalità Pagamento</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="paymentMode"
                                        value="manual"
                                        checked={debtToEdit.paymentMode === 'manual'}
                                        onChange={(e) => setDebtToEdit({ ...debtToEdit, paymentMode: e.target.value as 'auto' | 'manual' })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Manuale</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="paymentMode"
                                        value="auto"
                                        checked={debtToEdit.paymentMode === 'auto'}
                                        onChange={(e) => setDebtToEdit({ ...debtToEdit, paymentMode: e.target.value as 'auto' | 'manual' })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Automatico</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giorno Addebito</label>
                            <input type="number" min="1" max="28" value={debtToEdit.debitDay} onChange={(e) => setDebtToEdit({ ...debtToEdit, debitDay: parseInt(e.target.value) || 1 })} className={inputBaseClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mese Inizio</label>
                            <select
                                value={debtToEdit.startMonth}
                                onChange={(e) => setDebtToEdit({ ...debtToEdit, startMonth: parseInt(e.target.value) })}
                                className={inputBaseClass}
                                disabled={!!debtToEdit.id && isHistorical(debtToEdit.startYear)} // Lock start date for history
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(currentFullYear, m - 1).toLocaleString('it-IT', { month: 'long' })}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Anno Inizio</label>
                            <input
                                type="number"
                                min={debtToEdit.id ? 2000 : currentYear} // New debts cannot start in past relative to view
                                max={currentFullYear + 5}
                                value={debtToEdit.startYear}
                                onChange={(e) => setDebtToEdit({ ...debtToEdit, startYear: parseInt(e.target.value) || currentFullYear })}
                                className={inputBaseClass}
                                disabled={!!debtToEdit.id && isHistorical(debtToEdit.startYear)} // Lock start date for history
                            />
                            {!debtToEdit.id && <p className="text-xs text-gray-500 mt-1">Per anni passati, cambia anno in alto.</p>}
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button onClick={saveDebt} disabled={!debtToEdit.name || !debtToEdit.totalDueStr || !debtToEdit.installmentStr} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
                            <Save size={20} />{debtToEdit.id ? 'Aggiorna' : 'Salva'}
                        </button>
                        <button onClick={() => setDebtToEdit(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Annulla</button>
                    </div>
                </div>
            )}

            {fixedDebts.length === 0 && !debtToEdit ? (
                <EmptyState
                    title="Nessun Debito Fisso"
                    message="Tieni traccia di mutui, prestiti, abbonamenti e servizi ricorrenti che si rinnovano automaticamente."
                    icon={Repeat}
                    actionLabel="Aggiungi Debito"
                    onAction={openNewDebt}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fixedDebts.map(debt => {
                        const elapsedMonthsTotal = getMonthsElapsed(debt.startYear, debt.startMonth, currentFullYear, currentMonth + 1);
                        const paidAmount = debt.isSuspended ? 0 : (debt.installment * elapsedMonthsTotal);
                        const remainingBalance = Math.max(0, debt.totalDue - paidAmount);
                        const isHistoricalDebt = isHistorical(debt.startYear);

                        return (
                            <div key={debt.id} className={`bg-white rounded-xl shadow-lg p-6 border ${debt.isSuspended ? 'border-yellow-300 opacity-70' : 'border-gray-100 hover:border-blue-400'} transition-all`}>
                                <div className="flex justify-between items-start gap-3">
                                    <div className="overflow-hidden flex-1">
                                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-1">
                                            <span className="truncate">{debt.name}</span>
                                            {debt.isSuspended && (
                                                <PauseCircle className="text-yellow-500 flex-shrink-0" size={18} />
                                            )}
                                            {isHistoricalDebt && (
                                                <Calendar className="text-gray-400 flex-shrink-0" size={16} title={`Debito storico (iniziato nel ${debt.startYear})`} />
                                            )}
                                        </h3>
                                        <div className="text-sm text-gray-600 flex items-center gap-1">
                                            <Repeat size={14} className="text-blue-500 flex-shrink-0" />
                                            <span className="font-semibold">{formatCurrency(debt.installment)}</span>
                                            <span>/ Mese</span>
                                        </div>
                                        <div className="flex gap-1 mt-1">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${debt.paymentMode === 'auto' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                {debt.paymentMode === 'auto' ? 'AUTO' : 'MANUALE'}
                                            </span>
                                            {debt.type === 'subscription' && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 uppercase">
                                                    ABBONAMENTO
                                                </span>
                                            )}
                                            {debt.type === 'fiscal' && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 uppercase">
                                                    FISCALE ({debt.fiscalCategory === 'inps' ? 'INPS' : 'TASSE'})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => openEditDebt(debt)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors" title="Modifica">
                                            <Pencil size={16} />
                                        </button>
                                        {isHistoricalDebt ? (
                                            <button
                                                onClick={() => alert(`Non puoi eliminare questo debito perché è iniziato nel ${debt.startYear} (anno precedente). Se l'hai estinto o vuoi interromperlo, usa il tasto 'Sospendi'. Eliminandolo altereresti i bilanci degli anni passati.`)}
                                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-not-allowed"
                                                title="Impossibile eliminare dati storici"
                                            >
                                                <Lock size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => confirmDelete(debt.id)}
                                                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                title="Elimina"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 border-t pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-500">Totale Dovuto</div>
                                            <div className="font-medium text-gray-900">{formatCurrency(debt.totalDue)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Residuo</div>
                                            <div className={`font-bold text-xl ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(remainingBalance)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-3 truncate">
                                        <Calendar size={12} className="inline text-gray-400 mr-1" />
                                        Giorno {debt.debitDay}
                                        {remainingBalance > 0 && debt.totalDue > 0 && ` • ${Math.ceil(remainingBalance / debt.installment)} rate`}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t space-y-2">
                                    <button
                                        onClick={() => handleRegisterPayment(debt.id)}
                                        disabled={debt.paymentMode === 'auto'}
                                        className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${debt.paymentMode === 'auto'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                            }`}
                                        title={debt.paymentMode === 'auto' ? 'Pagamento automatico attivo' : 'Registra pagamento manualmente'}
                                    >
                                        <Repeat size={16} className="flex-shrink-0" />
                                        Registra Pagamento
                                    </button>
                                    <button
                                        onClick={() => toggleSuspension(debt.id)}
                                        className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${debt.isSuspended ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                            }`}
                                    >
                                        {debt.isSuspended ? <><CheckCircle size={16} className="flex-shrink-0" />Riattiva</> : <><PauseCircle size={16} className="flex-shrink-0" />Sospendi</>}
                                    </button>
                                    {debt.isSuspended && isHistoricalDebt && (
                                        <p className="text-[10px] text-center text-gray-400 mt-1">Sospeso dal calcolo corrente</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
            }

            {/* Informative Legend */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    ℹ️ Modalità Pagamento
                </h3>
                <div className="text-xs text-blue-800 space-y-1">
                    <p><strong>• Automatico:</strong> Il sistema crea automaticamente una transazione il giorno dell'addebito impostato.</p>
                    <p><strong>• Manuale:</strong> Usa il pulsante "Registra Pagamento" quando effettui il pagamento per creare la transazione.</p>
                </div>
            </div>
        </div >
    );
};

export default FixedDebtsView;