import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Wallet, ArrowDownCircle, ArrowUpCircle, Trash2, Clock } from 'lucide-react';
import { Reminder } from '../types';

const CalendarView: React.FC = () => {
    const { reminders, fixedDebts, stats, addReminder, deleteReminder, updateReminder, currentYear } = useFinance();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

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
                time: r.time,
                id: r.id,
                obj: r
            });
        });

        // 2. Fixed Debts
        fixedDebts.forEach(debt => {
            if (debt.isSuspended) return;
            const debtDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), debt.debitDay);
            if (debtDate.getMonth() !== currentDate.getMonth()) {
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

        // 3. Fiscal Deadlines (from stats)
        stats.deadlines.forEach((deadline, index) => {
            const dDate = new Date(deadline.date);
            // Check if deadline date is within the visible month
            if (dDate.getMonth() === currentDate.getMonth() && dDate.getFullYear() === currentDate.getFullYear()) {
                allEvents.push({
                    type: 'fiscal',
                    date: dDate,
                    title: deadline.label,
                    id: `fiscal-${index}`
                });
            }
        });

        return allEvents.sort((a, b) => {
            if (a.time && b.time) return a.time.localeCompare(b.time);
            if (a.time) return -1;
            if (b.time) return 1;
            return 0;
        });
    }, [reminders, fixedDebts, currentDate]);

    const getEventsForDay = (day: Date) => {
        return events.filter(e => isSameDay(e.date, day));
    };

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setEditingReminder(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (e: React.MouseEvent, evt: any) => {
        e.stopPropagation();
        if (evt.type === 'reminder') {
            setEditingReminder(evt.obj);
            setSelectedDate(new Date(evt.obj.date));
            setIsModalOpen(true);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="text-blue-600 dark:text-blue-400" />
                        Calendario Scadenze
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Gestisci le tue scadenze e visualizza i flussi di cassa previsti.</p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-lg w-40 text-center capitalize text-gray-800 dark:text-white">
                        {format(currentDate, 'MMMM yyyy', { locale: it })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                    {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                        <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr bg-white dark:bg-slate-800">
                    {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-32 bg-gray-50/30 dark:bg-slate-900/20 border-b border-r border-gray-100 dark:border-slate-700"></div>
                    ))}

                    {days.map(day => {
                        const dayEvents = getEventsForDay(day);
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                className={`h-32 border-b border-r border-gray-100 dark:border-slate-700 p-2 relative group hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${isCurrentDay ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                onClick={() => handleDayClick(day)}
                            >
                                <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'}`}>
                                    {format(day, 'd')}
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[88px] no-scrollbar">
                                    {dayEvents.map((evt, idx) => (
                                        <div
                                            key={`${evt.id}-${idx}`}
                                            onClick={(e) => handleEventClick(e, evt)}
                                            className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 transition-colors
                                                ${evt.type === 'debt' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                                    evt.type === 'fiscal' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                                                        'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:brightness-95'}`}
                                            title={evt.title}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 
                                                ${evt.type === 'debt' ? 'bg-red-500' :
                                                    evt.type === 'fiscal' ? 'bg-orange-500' :
                                                        'bg-indigo-500'}`}
                                            />
                                            {evt.time && <span className="opacity-70 font-bold">{evt.time}</span>}
                                            {evt.title}
                                        </div>
                                    ))}
                                </div>

                                <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded-full text-blue-600 transition-all">
                                    <Plus size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isModalOpen && selectedDate && (
                <ReminderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    date={selectedDate}
                    reminder={editingReminder}
                    onSave={async (data) => {
                        if (editingReminder) {
                            await updateReminder({ ...editingReminder, ...data });
                        } else {
                            await addReminder({
                                ...data,
                                date: format(selectedDate, 'yyyy-MM-dd'),
                                isCompleted: false
                            });
                        }
                    }}
                    onDelete={editingReminder ? async () => {
                        await deleteReminder(editingReminder.id);
                    } : undefined}
                />
            )}
        </div>
    );
};

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    reminder: Reminder | null;
    onSave: (data: { title: string, type: 'payment' | 'collection' | 'memo', time?: string }) => Promise<void>;
    onDelete?: () => Promise<void>;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, date, reminder, onSave, onDelete }) => {
    const [title, setTitle] = useState(reminder?.title || '');
    const [type, setType] = useState<'payment' | 'collection' | 'memo'>(reminder?.type || 'memo');
    const [time, setTime] = useState(reminder?.time || '');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ title, type, time: time || undefined });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        setLoading(true);
        try {
            await onDelete();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl m-4 border dark:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold dark:text-white">{reminder ? 'Modifica' : 'Nuovo'} Promemoria</h3>
                    {onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Elimina"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Per il giorno {format(date, 'd MMMM yyyy', { locale: it })}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                            Titolo <span className="text-red-500">*</span>
                        </label>
                        <input
                            autoFocus
                            type="text"
                            className="w-full rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Es. Chiamare commercialista"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                <Clock size={14} /> Orario
                            </label>
                            <input
                                type="time"
                                className="w-full rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="memo">Memo</option>
                                <option value="payment">Pagamento</option>
                                <option value="collection">Incasso</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Salvataggio...' : reminder ? 'Aggiorna' : 'Salva'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CalendarView;
