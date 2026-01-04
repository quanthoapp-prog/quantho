import React from 'react';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { FiscalDeadline } from '../types';
import { formatCurrency } from '../constants';

interface FiscalScheduleProps {
    deadlines: FiscalDeadline[];
    taxesPaid: number;
}

const FiscalSchedule: React.FC<FiscalScheduleProps> = ({ deadlines, taxesPaid }) => {

    const renderDeadlineCard = (deadline: FiscalDeadline, index: number) => {
        const isPast = new Date(deadline.date) < new Date();

        // Cumulative check: is the sum of all deadlines up to this one covered by taxesPaid?
        const totalDueUntilNow = deadlines.slice(0, index + 1).reduce((sum, d) => sum + d.total, 0);
        const isPaid = taxesPaid >= (totalDueUntilNow - 5); // 5 euro tolerance for rounding

        const status = isPaid ? 'paid' : (isPast ? 'overdue' : 'pending');

        return (
            <div key={index} className={`p-4 rounded-xl border transition-all ${status === 'paid' ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/40' :
                status === 'overdue' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40' : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700'
                }`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className={status === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'} />
                        <span className="font-bold text-gray-800 dark:text-white">{deadline.label}</span>
                    </div>
                    {status === 'paid' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} /> VERSATO
                        </span>
                    ) : status === 'overdue' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">
                            <AlertCircle size={10} /> SCADUTO
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                            <Clock size={10} /> IN ARRIVO
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-slate-400">Imposta Sostitutiva:</span>
                        <span className="font-medium text-gray-900 dark:text-slate-200">{formatCurrency(deadline.tax)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-slate-400">Contributi INPS:</span>
                        <span className="font-medium text-gray-900 dark:text-slate-200">{formatCurrency(deadline.inps)}</span>
                    </div>
                    <div className="pt-2 border-t dark:border-slate-600 flex justify-between items-baseline">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Totale:</span>
                        <span className="text-lg font-extrabold text-gray-900 dark:text-white">{formatCurrency(deadline.total)}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500 text-right italic">
                        Scadenza: {new Date(deadline.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                Scadenzario Fiscale
            </h4>
            <div className={`grid grid-cols-1 gap-4 ${deadlines.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                {deadlines.map((d, i) => renderDeadlineCard(d, i))}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-900/40">
                <strong>Nota:</strong> Gli acconti sono calcolati sulla base della stima del fatturato attuale (Metodo Previsionale).
            </p>
        </div>
    );
};

export default FiscalSchedule;
