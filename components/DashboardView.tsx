import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, FileText, AlertCircle, Banknote, ShieldCheck, PieChart, Calendar, Target, PlusCircle, History, Trophy, Info, ChevronRight, Calculator } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, LIMITE_FORFETTARIO } from '../constants';
import IncomeExpenseChart from './charts/IncomeExpenseChart';
import CategoryPieChart from './charts/CategoryPieChart';
import FiscalSchedule from './FiscalSchedule';
import TaxBreakdownModal from './TaxBreakdownModal';
import UpcomingPayments from './UpcomingPayments';

const DashboardView: React.FC = () => {
    const { stats, currentYear, transactions, settings, fixedDebts } = useFinance();
    const navigate = useNavigate();
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);

    const taxPaymentPercentage = stats.totalTaxEstimate > 0 ? (stats.taxesPaid / stats.totalTaxEstimate) * 100 : 0;

    // Filter and sort transactions for the current year
    const recentTransactions = transactions
        .filter(t => new Date(t.date).getFullYear() === currentYear)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    // Calculate Expense Distribution by Tag
    const expenseDistribution = useMemo(() => {
        const expenses = transactions.filter(t =>
            new Date(t.date).getFullYear() === currentYear &&
            t.type === 'expense'
        );

        const distribution: { [key: string]: number } = {};
        let total = 0;

        expenses.forEach(t => {
            const rawTag = t.tags ? t.tags.trim() : '';
            const mainTag = rawTag.split(',')[0].trim().toLowerCase() || 'non categorizzato';
            const label = mainTag.charAt(0).toUpperCase() + mainTag.slice(1);

            distribution[label] = (distribution[label] || 0) + t.amount;
            total += t.amount;
        });

        return Object.entries(distribution)
            .map(([tag, amount]) => ({
                tag,
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [transactions, currentYear]);

    const taxRateDisplay = (stats.taxRateApplied * 100).toFixed(0);

    return (
        <div className="space-y-6">
            {/* TOP ACTIONS */}
            <div className="flex gap-3 justify-end">
                <button
                    onClick={() => navigate('/goals')}
                    className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm border hover:bg-gray-50 transition-colors text-sm"
                >
                    <Target size={18} />
                    Imposta Obiettivi
                </button>
                <button
                    onClick={() => navigate('/transactions', { state: { startAdding: true } })}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition-colors text-sm"
                >
                    <PlusCircle size={18} />
                    Nuova Transazione
                </button>
            </div>

            {stats.percentualeSoglia > 80 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-semibold text-yellow-900">Attenzione soglia forfettario</h4>
                        <p className="text-sm text-yellow-800">
                            Hai raggiunto il {stats.percentualeSoglia.toFixed(1)}% della soglia di {formatCurrency(LIMITE_FORFETTARIO)} per l'anno {currentYear}.
                        </p>
                    </div>
                </div>
            )}

            {/* MAIN STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100">Fatturato annuo ({currentYear})</span>
                        <TrendingUp size={24} />
                    </div>
                    <div className="text-3xl font-bold">{formatCurrency(stats.income)}</div>
                    <div className="text-sm text-blue-100 mt-1">
                        {stats.percentualeSoglia.toFixed(1)}% del limite
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-red-100">Spese totali (Cassa)</span>
                        <TrendingDown size={24} />
                    </div>
                    <div className="text-3xl font-bold">{formatCurrency(stats.realExpenses)}</div>
                    <div className="text-sm text-red-100 mt-1">
                        {stats.scheduledExpenses > 0
                            ? `Spese prossime: ${formatCurrency(stats.scheduledExpenses)}`
                            : 'Uscite Business, Personali, F24'
                        }
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-green-100">Liquidità di Cassa</span>
                        <DollarSign size={24} />
                    </div>
                    <div className="text-3xl font-bold">{formatCurrency(stats.currentLiquidity)}</div>
                    <div className="text-sm text-green-100 mt-1 flex gap-1">
                        Flusso {currentYear} {formatCurrency(stats.realNetIncome)}
                        {Math.abs(stats.currentLiquidity - stats.realNetIncome) > 0.01 && (
                            <span className="opacity-80"> + Riporto</span>
                        )}
                    </div>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" /> Andamento Mensile
                    </h3>
                    <IncomeExpenseChart transactions={transactions} year={currentYear} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center gap-2">
                        <PieChart size={20} className="text-purple-600" /> Ripartizione Spese
                    </h3>
                    <CategoryPieChart transactions={transactions} year={currentYear} />
                </div>
            </div>

            {/* NEW: Upcoming Fixed Payments (Phase 5) */}
            <UpcomingPayments
                fixedDebts={fixedDebts}
                transactions={transactions}
                currentYear={currentYear}
            />

            {/* ANALISI E OBIETTIVI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-800 font-semibold mb-1">
                            <Target size={18} />
                            Fatturato di Pareggio
                        </div>
                        <div className="text-2xl font-bold text-indigo-900">{formatCurrency(stats.breakEvenTurnover)}</div>
                    </div>
                    <div className="text-xs text-indigo-600 mt-2">
                        Per coprire spese stimate, debiti fissi e tasse.
                    </div>
                </div>

                <div className="bg-teal-50 rounded-xl p-5 border border-teal-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-teal-800 font-semibold mb-1">
                            <Calendar size={18} />
                            Stipendio Mensile Netto
                        </div>
                        <div className="text-2xl font-bold text-teal-900">{formatCurrency(stats.monthlyNetIncome)}</div>
                    </div>
                    <div className="text-xs text-teal-600 mt-2">
                        Reddito Disponibile / 12 mesi
                    </div>
                </div>

                <div className="bg-violet-50 rounded-xl p-5 border border-violet-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-2 text-violet-800 font-semibold mb-1">
                            <span className="flex items-center gap-2"><Trophy size={18} /> Raggiungimento Obiettivo</span>
                            <span className="text-xs font-bold">{stats.goalPercentage.toFixed(0)}%</span>
                        </div>
                        {stats.goalPercentage > 0 ? (
                            <div className="mt-2">
                                <div className="w-full bg-violet-200 rounded-full h-3">
                                    <div className="bg-violet-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(stats.goalPercentage, 100)}%` }}></div>
                                </div>
                                <div className="text-xs text-violet-700 mt-2">Mancano {formatCurrency(stats.gapToGoal)}</div>
                            </div>
                        ) : (
                            <div className="text-sm text-violet-600 mt-1 cursor-pointer hover:underline" onClick={() => navigate('/goals')}>
                                Imposta un obiettivo per iniziare!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FISCAL RECAP */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700">
                            <FileText size={20} />
                            Riepilogo Stima Fiscale {currentYear}
                        </h3>
                        <button
                            onClick={() => setIsTaxModalOpen(true)}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                            <Calculator size={14} />
                            DETTAGLIO CALCOLO
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Reddito Imponibile</div>
                            <div className="text-xl font-bold text-gray-900">{formatCurrency(stats.redditoImponibile)}</div>
                            <div className="text-xs text-gray-500">Coeff. - INPS versati</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Flat Tax ({taxRateDisplay}%)</div>
                            <div className="text-xl font-bold text-orange-600">{formatCurrency(stats.flatTax)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Stima INPS</div>
                            <div className="text-xl font-bold text-purple-600">{formatCurrency(stats.inps)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Debiti Fissi Annui</div>
                            <div className="text-xl font-bold text-red-700">{formatCurrency(stats.totalFixedDebtEstimate)}</div>
                            <div className="text-xs text-gray-500">Pianificazione</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Reddito Disponibile</div>
                            <div className="text-2xl font-extrabold text-green-600">{formatCurrency(stats.netAvailableIncome)}</div>
                            <div className="text-xs text-gray-500">Netto - Debiti Fissi</div>
                        </div>
                    </div>

                    {/* NEW: Fiscal Deadlines Schedule */}
                    <div className="pt-6 border-t">
                        <FiscalSchedule deadlines={stats.deadlines} taxesPaid={stats.taxesPaid} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 flex flex-col justify-between h-fit">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800">
                            <Banknote size={20} className="text-red-500" />
                            Accantonamento Tasse
                        </h3>
                        <div className="text-sm text-gray-600 mb-4">
                            Ti consigliamo di tenere da parte <span className="font-bold text-gray-900">{formatCurrency(stats.totalTaxEstimate)}</span> per le tasse di quest'anno.
                        </div>

                        <div className="mb-4">
                            <div className="text-sm text-gray-600 flex justify-between">
                                <span>Versati (Tasse + INPS)</span>
                                <span className="font-bold text-green-600">{formatCurrency(stats.taxesPaid)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(taxPaymentPercentage, 100)}%` }}></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {taxPaymentPercentage.toFixed(1)}% coperto
                                {stats.inpsPaid > 0 && <span className="block text-purple-600">di cui INPS: {formatCurrency(stats.inpsPaid)}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="text-lg font-bold flex justify-between items-center">
                            <span>Manca alla stima:</span>
                            <span className={`${stats.remainingTaxDue > 0 ? 'text-red-600' : 'text-green-600'} text-2xl font-extrabold`}>
                                {formatCurrency(stats.remainingTaxDue)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 italic">Basato sul fatturato incassato finora</p>
                    </div>
                </div>
            </div>

            <TaxBreakdownModal
                isOpen={isTaxModalOpen}
                onClose={() => setIsTaxModalOpen(false)}
                stats={stats}
                settings={settings}
            />

            {/* SEPARATED SECTIONS: EXPENSE REPORT & RECENT TRANSACTIONS */}
            <div className="space-y-6">

                {/* REPORT SPESE */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
                        <PieChart size={20} className="text-blue-600" />
                        Report Spese ({currentYear})
                    </h3>
                    {expenseDistribution.length > 0 ? (
                        <div className="space-y-4">
                            {expenseDistribution.map((item, index) => {
                                const rawTagForGoal = Object.keys(settings?.expenseGoals || {}).find(k => k.toLowerCase() === item.tag.toLowerCase());
                                const goal = rawTagForGoal ? settings.expenseGoals[rawTagForGoal] : 0;
                                const hasGoal = goal > 0;
                                const goalPercent = hasGoal ? (item.amount / goal) * 100 : 0;
                                const isOver = item.amount > goal;

                                return (
                                    <div key={index}>
                                        <div className="flex justify-between items-end mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-700">{item.tag}</span>
                                                {hasGoal && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${isOver ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                        Budget: {formatCurrency(goal)}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                                        </div>
                                        <div className="relative">
                                            {/* Main Distribution Bar (Blue) */}
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1 overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>

                                            {/* Goal Progress Bar (Thin line below) */}
                                            {hasGoal && (
                                                <div className="w-full bg-gray-100 rounded-full h-1 mt-0.5 overflow-hidden flex">
                                                    <div
                                                        className={`h-1 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(goalPercent, 100)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-start mt-0.5">
                                            <div className="text-[10px] text-gray-400">
                                                {hasGoal ? (
                                                    <span className={isOver ? 'text-red-500 font-semibold' : 'text-green-600'}>
                                                        {goalPercent.toFixed(0)}% del budget
                                                    </span>
                                                ) : (
                                                    <span>No budget</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">{item.percentage.toFixed(1)}% tot</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-8 text-sm">
                            Nessuna spesa registrata per quest'anno.
                        </div>
                    )}
                </div>

                {/* ULTIME TRANSAZIONI */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        <History size={20} className="text-gray-500" />
                        Ultime transazioni ({currentYear})
                    </h3>
                    {recentTransactions.length > 0 ? (
                        recentTransactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        {t.type === 'income' ? <TrendingUp size={20} /> : (
                                            t.category === 'tax' ? <Banknote size={20} /> :
                                                t.category === 'inps' ? <ShieldCheck size={20} /> :
                                                    <TrendingDown size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium">{t.description}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(t.date).toLocaleDateString('it-IT')}
                                            {t.category === 'tax' ? ' | F24 TASSE' :
                                                t.category === 'inps' ? ' | F24 INPS' :
                                                    t.category === 'business' ? ' | Business' : ' | Personale'}
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-8">Nessuna transazione per {currentYear}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;