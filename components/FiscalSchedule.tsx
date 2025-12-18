import React from 'react';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { FiscalDeadline } from '../types';
import { formatCurrency } from '../constants';

interface FiscalScheduleProps {
    deadlines: {
        june: FiscalDeadline;
        november: FiscalDeadline;
    };
    taxesPaid: number;
}

const FiscalSchedule: React.FC<FiscalScheduleProps> = ({ deadlines, taxesPaid }) => {

    const renderDeadlineCard = (deadline: FiscalDeadline, isJune: boolean) => {
        const isPast = new Date(deadline.date) < new Date();
        const isPaid = isJune ? (taxesPaid >= deadline.total) : (taxesPaid >= (deadlines.june.total + deadline.total));

        // Simpler check for payment: if taxesPaid covers the June amount, we treat it as paid for visual feedback
        // In a real app we'd track transaction dates vs deadlines
        const status = isPaid ? 'paid' : (isPast ? 'overdue' : 'pending');

        return (
            <div className={`p-4 rounded-xl border transition-all ${status === 'paid' ? 'bg-green-50 border-green-100' :
                    status === 'overdue' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className={status === 'paid' ? 'text-green-600' : 'text-gray-400'} />
                        <span className="font-bold text-gray-800">{deadline.label}</span>
                    </div>
                    {status === 'paid' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} /> VERSATO
                        </span>
                    ) : status === 'overdue' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            <AlertCircle size={10} /> SCADUTO
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            <Clock size={10} /> IN ARRIVO
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Imposta Sostitutiva:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(deadline.tax)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Contributi INPS:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(deadline.inps)}</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between items-baseline">
                        <span className="text-xs font-bold text-gray-700 uppercase">Totale:</span>
                        <span className="text-lg font-extrabold text-gray-900">{formatCurrency(deadline.total)}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 text-right italic">
                        Scadenza: {new Date(deadline.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                Scadenzario Fiscale
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderDeadlineCard(deadlines.june, true)}
                {renderDeadlineCard(deadlines.november, false)}
            </div>
            <p className="text-[10px] text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                <strong>Nota:</strong> Gli acconti sono calcolati sulla base della stima del fatturato attuale (Metodo Previsionale).
            </p>
        </div>
    );
};

export default FiscalSchedule;
