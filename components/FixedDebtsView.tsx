import React, { useState } from 'react';
import { PlusCircle, Save, Repeat, Pencil, Trash2, Calendar, PauseCircle, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import { FixedDebt } from '../types';
import { formatCurrency, getMonthsElapsed } from '../constants';

interface FixedDebtsViewProps {
    fixedDebts: FixedDebt[];
    currentYear: number;
    onAddDebt: (debt: Omit<FixedDebt, 'id'>) => void;
    onUpdateDebt: (debt: FixedDebt) => void;
    onDeleteDebt: (id: number) => void;
    onRegisterPayment: (debtId: number) => void;
}

const initialDebtState: Omit<FixedDebt, 'id'> = {
    name: '', totalDue: 0, installment: 0, debitDay: 1, isSuspended: false, type: 'debt',
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear(),
    paymentMode: 'manual',
};

const FixedDebtsView: React.FC<FixedDebtsViewProps> = ({ fixedDebts, currentYear, onAddDebt, onUpdateDebt, onDeleteDebt, onRegisterPayment }) => {
    // Form state handles strings for inputs to allow empty states during typing
    const [debtToEdit, setDebtToEdit] = useState<(Omit<FixedDebt, 'id'> & { id?: number, totalDueStr?: string, installmentStr?: string }) | null>(null);

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

    const saveDebt = () => {
        if (!debtToEdit || !debtToEdit.name) return;

        const totalDue = parseFloat(debtToEdit.totalDueStr || '0');
        const installment = parseFloat(debtToEdit.installmentStr || '0');

        if (isNaN(totalDue) || isNaN(installment)) return;

        const debtToSave: FixedDebt = {
            id: debtToEdit.id || Date.now(),
            name: debtToEdit.name,
            totalDue: totalDue,
            installment: installment,
            debitDay: Number(debtToEdit.debitDay),
            startMonth: Number(debtToEdit.startMonth),
            startYear: Number(debtToEdit.startYear),
            isSuspended: debtToEdit.isSuspended,
            type: debtToEdit.type,
            paymentMode: debtToEdit.paymentMode || 'manual'
        };

        if (debtToEdit.id) {
            onUpdateDebt(debtToSave);
        } else {
            onAddDebt(debtToSave);
        }
        setDebtToEdit(null);
    };

    const deleteDebt = (id: number) => onDeleteDebt(id);

    const toggleSuspension = (id: number) => {
        const debt = fixedDebts.find(d => d.id === id);
        if (debt) {
            onUpdateDebt({ ...debt, isSuspended: !debt.isSuspended });
        }
    };

    // Safety Checks
    const isHistorical = (debtStartYear: number) => debtStartYear < currentYear;

    const inputBaseClass = "w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500";

    return (
        <div className="space-y-6">
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
                        <div className="col-span-2">
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
                                    <span className="text-sm text-gray-700">Manuale - Registra quando paghi</span>
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
                                    <span className="text-sm text-gray-700">Automatico - Crea transazione auto</span>
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
                                disabled={debtToEdit.id && isHistorical(debtToEdit.startYear)} // Lock start date for history
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
                                disabled={debtToEdit.id && isHistorical(debtToEdit.startYear)} // Lock start date for history
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fixedDebts.map(debt => {
                    const elapsedMonthsTotal = getMonthsElapsed(debt.startYear, debt.startMonth, currentFullYear, currentMonth + 1);
                    const paidAmount = debt.isSuspended ? 0 : (debt.installment * elapsedMonthsTotal);
                    const remainingBalance = Math.max(0, debt.totalDue - paidAmount);
                    const isHistoricalDebt = isHistorical(debt.startYear);

                    return (
                        <div key={debt.id} className={`bg-white rounded-xl shadow-lg p-6 border ${debt.isSuspended ? 'border-yellow-300 opacity-70' : 'border-gray-100'} transition-all`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                        {debt.name}
                                        {debt.isSuspended && (
                                            <span title="Sospeso">
                                                <PauseCircle className="text-yellow-500" size={18} />
                                            </span>
                                        )}
                                        {isHistoricalDebt && (
                                            <span title={`Debito storico (iniziato nel ${debt.startYear})`}>
                                                <Calendar className="text-gray-400" size={16} />
                                            </span>
                                        )}
                                    </h3>
                                    <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                        <Repeat size={14} className="text-blue-500" />
                                        <span className="font-semibold">{formatCurrency(debt.installment)}</span>
                                        <span className="ml-1">/ Mese</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
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
                                            onClick={() => deleteDebt(debt.id)}
                                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                                            title="Elimina"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 border-t pt-4 space-y-2">
                                <div>
                                    <div className="text-sm text-gray-500">Totale Dovuto</div>
                                    <div className="font-medium text-gray-900">{formatCurrency(debt.totalDue)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Residuo Stimato</div>
                                    <div className={`font-bold text-xl ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(remainingBalance)}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar size={12} className="text-gray-400" />
                                    Addebito: Giorno <span className="font-medium text-gray-800">{debt.debitDay}</span>
                                    {remainingBalance > 0 && debt.totalDue > 0 && ` (${Math.ceil(remainingBalance / debt.installment)} rate)`}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t space-y-2">
                                <button
                                    onClick={() => onRegisterPayment(debt.id)}
                                    disabled={debt.paymentMode === 'auto'}
                                    className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${debt.paymentMode === 'auto'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                    title={debt.paymentMode === 'auto' ? 'Pagamento automatico attivo' : 'Registra pagamento manualmente'}
                                >
                                    <Repeat size={16} />Registra Pagamento
                                </button>
                                <button onClick={() => toggleSuspension(debt.id)} className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${debt.isSuspended ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                                    {debt.isSuspended ? <><CheckCircle size={16} />Riattiva</> : <><PauseCircle size={16} />Sospendi</>}
                                </button>
                                {debt.isSuspended && isHistoricalDebt && (
                                    <p className="text-[10px] text-center text-gray-400 mt-1">Sospeso dal calcolo corrente</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

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
        </div>
    );
};

export default FixedDebtsView;