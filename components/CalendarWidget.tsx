import React from 'react';
import { format, isToday, isTomorrow, isSameYear } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';

const CalendarWidget: React.FC = () => {
    const { reminders, fixedDebts } = useFinance();
    const navigate = useNavigate();

    // Logic similar to CalendarView to gather upcoming events
    const getUpcomingEvents = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const allEvents: any[] = [];

        // 1. Reminders
        reminders.forEach(r => {
            const rDate = new Date(r.date);
            if (rDate >= today && !r.isCompleted) {
                allEvents.push({
                    type: 'reminder',
                    date: rDate,
                    time: r.time,
                    title: r.title,
                    id: `rem-${r.id}`,
                    color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
                });
            }
        });

        // 2. Fixed Debts (next occurrence)
        fixedDebts.forEach(debt => {
            if (debt.isSuspended) return;
            const currentDay = today.getDate();
            let targetDate = new Date(today.getFullYear(), today.getMonth(), debt.debitDay);

            // If day passed, move to next month
            if (targetDate < today) {
                targetDate.setMonth(targetDate.getMonth() + 1);
            }

            allEvents.push({
                type: 'debt',
                date: targetDate,
                title: `Rata: ${debt.name}`,
                id: `debt-${debt.id}`,
                color: 'text-red-600 bg-red-50 border-red-100'
            });
        });

        // 3. Fiscal (next occurrence)
        const year = today.getFullYear();
        const juneDeadline = new Date(year, 5, 30);
        const novDeadline = new Date(year, 10, 30);

        if (juneDeadline >= today) {
            allEvents.push({
                type: 'fiscal',
                date: juneDeadline,
                title: 'Acconto Tasse (Giu)',
                id: 'fiscal-june',
                color: 'text-orange-600 bg-orange-50 border-orange-100'
            });
        }
        if (novDeadline >= today) {
            allEvents.push({
                type: 'fiscal',
                date: novDeadline,
                title: 'Acconto Tasse (Nov)',
                id: 'fiscal-nov',
                color: 'text-orange-600 bg-orange-50 border-orange-100'
            });
        }

        // Sort by date and take first 4
        return allEvents
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 4);
    };

    const upcomingEvents = getUpcomingEvents();

    const formatDateFriendly = (date: Date) => {
        if (isToday(date)) return 'Oggi';
        if (isTomorrow(date)) return 'Domani';
        const formatStr = isSameYear(date, new Date()) ? 'd MMM' : 'd MMM yyyy';
        return format(date, formatStr, { locale: it });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <CalendarIcon size={18} />
                    </div>
                    <h3 className="font-bold text-gray-800">Prossime Scadenze</h3>
                </div>
                <button
                    onClick={() => navigate('/calendar')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full transition-colors"
                >
                    Vedi tutto <ArrowRight size={12} />
                </button>
            </div>

            <div className="flex-1 space-y-3">
                {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(evt => (
                        <div
                            key={evt.id}
                            className={`flex items-center justify-between p-3 rounded-xl border ${evt.color} transition-transform hover:scale-[1.02] cursor-default`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full bg-white/60 backdrop-blur-sm`}>
                                    <Clock size={14} className="opacity-70" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold truncate max-w-[140px]">{evt.title}</span>
                                    {evt.time && <span className="text-[10px] font-bold opacity-60">ore {evt.time}</span>}
                                </div>
                            </div>
                            <span className="text-xs font-bold opacity-80 whitespace-nowrap bg-white/50 px-2 py-0.5 rounded-md">
                                {formatDateFriendly(evt.date)}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2 opacity-60">
                        <CheckCircle2 size={32} />
                        <p>Nessuna scadenza imminente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarWidget;
