import React, { useMemo } from 'react';
import { Clock, CheckCircle, AlertCircle, Calendar, Repeat, ArrowRight } from 'lucide-react';
import { FixedDebt, Transaction } from '../types';
import { formatCurrency } from '../constants';

interface UpcomingPaymentsProps {
    fixedDebts: FixedDebt[];
    transactions: Transaction[];
    currentYear: number;
}

const UpcomingPayments: React.FC<UpcomingPaymentsProps> = ({ fixedDebts, transactions, currentYear }) => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentActualYear = today.getFullYear();

    const upcoming = useMemo(() => {
        // Only show if we are viewing the current actual year
        if (currentYear !== currentActualYear) return [];

        return fixedDebts
            .filter(debt => !debt.isSuspended)
            .filter(debt => {
                // Check if debt has started
                if (debt.startYear > currentActualYear) return false;
                if (debt.startYear === currentActualYear && debt.startMonth > currentMonth) return false;
                return true;
            })
            .map(debt => {
                const paymentTag = `debito-fisso-${debt.id}-${currentActualYear}-${currentMonth}`;
                const isPaid = transactions.some(t => t.tags && t.tags.includes(paymentTag));

                return {
                    ...debt,
                    isPaid,
                    dueDate: new Date(currentActualYear, currentMonth - 1, debt.debitDay)
                };
            })
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    }, [fixedDebts, transactions, currentYear, currentActualYear, currentMonth]);

    if (upcoming.length === 0) return null;

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                Scadenze Ricorrenti (Mese Corrente)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcoming.map(item => (
                    <div
                        key={item.id}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${item.isPaid ? 'bg-green-50 border-green-100 opacity-80' : 'bg-white border-gray-200 shadow-sm'
                            }`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.isPaid ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                <Repeat size={16} />
                            </div>
                            <div className="overflow-hidden">
                                <div className="font-bold text-gray-900 text-sm truncate">{item.name}</div>
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <Calendar size={10} />
                                    {item.dueDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                    <span className="mx-1">•</span>
                                    {item.paymentMode === 'auto' ? 'Auto' : 'Manuale'}
                                </div>
                            </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                            <div className={`font-bold text-sm ${item.isPaid ? 'text-green-600' : 'text-gray-900'}`}>
                                {formatCurrency(item.installment)}
                            </div>
                            {item.isPaid ? (
                                <span className="text-[9px] font-bold text-green-700 uppercase">Pagato</span>
                            ) : (
                                <span className={`text-[9px] font-bold uppercase ${item.dueDate < today ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                    {item.dueDate < today ? 'In ritardo' : 'In sospeso'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UpcomingPayments;
