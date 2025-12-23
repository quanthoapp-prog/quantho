import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Reminder } from '../types';

const CalendarView: React.FC = () => {
    const { reminders, fixedDebts, addReminder, deleteReminder, updateReminder, currentYear } = useFinance();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- Calendar Logic ---
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // --- Events Aggregation ---
    const events = useMemo(() => {
        const allEvents: any[] = [];

        // 1. Reminders from DB
        reminders.forEach(r => {
            allEvents.push({
                type: 'reminder',
                date: new Date(r.date),
                title: r.title,
                id: r.id,
                obj: r
            });
        });

        // 2. Fixed Debts (generate for current view)
        fixedDebts.forEach(debt => {
            if (debt.isSuspended) return;
            // Simplified: check if debt is active in this month/year
            const debtDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), debt.debitDay);
            // Handle Feb 30/31 case
            if (debtDate.getMonth() !== currentDate.getMonth()) {
                // It skipped to next month (e.g. Feb 30 -> Mar 2), fix back to last day of month
                debtDate.setMonth(currentDate.getMonth());
                debtDate.setDate(endOfMonth(currentDate).getDate());
            }

            allEvents.push({
                type: 'debt',
                date: debtDate,
                title: `Rata: ${debt.name}`,
                amount: debt.installment,
                id: `debt-${debt.id}`,
                obj: debt
            });
        });

        // 3. Fiscal Deadlines
        const year = currentDate.getFullYear();
        // June 30
        if (currentDate.getMonth() === 5) { // June is 5
            allEvents.push({
                type: 'fiscal',
                date: new Date(year, 5, 30),
                title: 'Saldo + 1° Acconto',
                id: 'fiscal-june'
            });
        }
        // Nov 30
        if (currentDate.getMonth() === 10) { // Nov is 10
            allEvents.push({
                type: 'fiscal',
                date: new Date(year, 10, 30),
                title: '2° Acconto Tasse',
                id: 'fiscal-nov'
            });
        }

        return allEvents;
    }, [reminders, fixedDebts, currentDate]);

    const getEventsForDay = (day: Date) => {
        return events.filter(e => isSameDay(e.date, day));
    };

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setIsAddModalOpen(true);
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="text-blue-600" />
                        Calendario Scadenze
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Gestisci le tue scadenze e visualizza i flussi di cassa previsti.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-lg w-40 text-center capitalize text-gray-800">
                        {format(currentDate, 'MMMM yyyy', { locale: it })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                    {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                        <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 auto-rows-fr">
                    {/* Padding for start of month */}
                    {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-32 bg-gray-50/30 border-b border-r border-gray-100"></div>
                    ))}

                    {days.map(day => {
                        const dayEvents = getEventsForDay(day);
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                className={`h-32 border-b border-r border-gray-100 p-2 relative group hover:bg-blue-50/30 transition-colors cursor-pointer ${isCurrentDay ? 'bg-blue-50/50' : ''}`}
                                onClick={() => handleDayClick(day)}
                            >
                                <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : 'text-gray-700'}`}>
                                    {format(day, 'd')}
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[88px] no-scrollbar">
                                    {dayEvents.map((evt, idx) => (
                                        <div
                                            key={`${evt.id}-${idx}`}
                                            className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1
                                                ${evt.type === 'debt' ? 'bg-red-100 text-red-700' :
                                                    evt.type === 'fiscal' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-indigo-100 text-indigo-700'}`}
                                            title={evt.title}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 
                                                ${evt.type === 'debt' ? 'bg-red-500' :
                                                    evt.type === 'fiscal' ? 'bg-orange-500' :
                                                        'bg-indigo-500'}`}
                                            />
                                            {evt.title}
                                        </div>
                                    ))}
                                </div>

                                {/* Hover Add Button */}
                                <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded-full text-blue-600 transition-all">
                                    <Plus size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* New Reminder Modal */}
            {isAddModalOpen && selectedDate && (
                <AddReminderModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    date={selectedDate}
                    onSave={async (title, type) => {
                        await addReminder({
                            title,
                            type,
                            date: format(selectedDate, 'yyyy-MM-dd'),
                            isCompleted: false
                        });
                        setIsAddModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

// --- Subcomponents ---

const AddReminderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    onSave: (title: string, type: 'payment' | 'collection' | 'memo') => Promise<void>;
}> = ({ isOpen, onClose, date, onSave }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'payment' | 'collection' | 'memo'>('memo');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(title, type);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl m-4">
                <h3 className="text-lg font-bold mb-1">Nuovo Promemoria</h3>
                <p className="text-sm text-gray-500 mb-4">Per il giorno {format(date, 'd MMMM yyyy', { locale: it })}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                        <input
                            autoFocus
                            type="text"
                            className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Es. Chiamare commercialista"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('memo')}
                                className={`p-2 rounded-lg text-sm font-medium border ${type === 'memo' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                Memo
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('payment')}
                                className={`p-2 rounded-lg text-sm font-medium border ${type === 'payment' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                Pagamento
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('collection')}
                                className={`p-2 rounded-lg text-sm font-medium border ${type === 'collection' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                Incasso
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Salvataggio...' : 'Salva Promemoria'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CalendarView;
