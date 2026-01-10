import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../constants';
import { PieChart, TrendingUp, DollarSign, Activity, Briefcase, Info, AlertCircle } from 'lucide-react';

const BusinessAnalysisView: React.FC = () => {
    const { stats, atecoCodes, currentYear } = useFinance();

    const atecoStats = useMemo(() => {
        const breakdown = stats.atecoBreakdown || {};
        return Object.entries(breakdown).map(([id, data]) => {
            const code = atecoCodes.find(c => c.id === id);
            // Explicit type casting to avoid 'unknown' errors from Object.entries
            const d = data as {
                revenue: number;
                dedicatedExpenses: number;
                allocatedOverhead: number;
                netProfit: number;
                efficiency: number;
                forecastedRevenue: number;
                forecastedNetProfit: number;
                forecastedEfficiency: number;
            };
            return {
                id,
                code: code?.code || '???',
                description: code?.description || 'Codice Sconosciuto',
                coefficient: code?.coefficient || 0.78,
                revenue: d.revenue,
                dedicatedExpenses: d.dedicatedExpenses,
                allocatedOverhead: d.allocatedOverhead,
                netProfit: d.netProfit,
                efficiency: d.efficiency,
                forecastedRevenue: d.forecastedRevenue,
                forecastedNetProfit: d.forecastedNetProfit,
                forecastedEfficiency: d.forecastedEfficiency
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [stats.atecoBreakdown, atecoCodes]);

    const totalRevenue = stats.businessIncome;
    const totalExpenses = stats.realExpenses; // Note: this includes personal, but we focus on business context

    if (atecoCodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700">
                <Briefcase className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Nessun Codice ATECO</h3>
                <p className="text-gray-500 dark:text-slate-400 text-center max-w-sm">
                    Configura i tuoi codici ATECO nelle impostazioni per sbloccare l'analisi dettagliata del tuo business.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Analisi Business Multi-ATECO</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Rendimento e profittabilità suddivisi per attività</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-900/30 font-bold">
                    {currentYear}
                </div>
            </div>

            {/* OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Fatturato Totale</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.businessIncome)}</div>
                    {stats.forecastedBusinessIncome > stats.businessIncome && (
                        <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span>Previsionale:</span>
                            <span className="font-bold">{formatCurrency(stats.forecastedBusinessIncome)}</span>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Activity size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Efficienza Media</span>
                        <div className="group relative ml-auto">
                            <Info size={16} className="text-gray-400 cursor-help" />
                            <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600 leading-relaxed">
                                Indica quanto ti rimane realmente in tasca su scala globale. <br />
                                <span className="text-gray-400 mt-1 block">
                                    Include spese fisse (es. Minimali INPS) che possono portare il valore in negativo se il fatturato è basso, anche se le singole attività sono positive.
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                        {stats.businessIncome > 0 ? (stats.estimatedNetIncome / stats.businessIncome * 100).toFixed(1) : 0}%
                    </div>
                    {stats.forecastedBusinessIncome > stats.businessIncome && (
                        <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                            Previsto: {(stats.forecastedNetIncome / stats.forecastedBusinessIncome * 100).toFixed(1)}%
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <PieChart size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Mix Attività</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{atecoStats.length} Ateco</div>
                </div>
            </div>

            {/* DETAILED BREAKDOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {atecoStats.map((item, index) => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-5 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-white ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                    {index + 1}
                                </span>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{item.code}</h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[200px]">{item.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-slate-400">Peso su Fatturato</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {totalRevenue > 0 ? (item.revenue / totalRevenue * 100).toFixed(0) : 0}%
                                </div>
                                {item.forecastedRevenue > item.revenue && (
                                    <div className="text-[10px] text-blue-500 font-medium">
                                        Quota prevista: {stats.forecastedBusinessIncome > 0 ? (item.forecastedRevenue / stats.forecastedBusinessIncome * 100).toFixed(0) : 0}%
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-slate-500 block mb-1">Entrate (Lordo)</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.revenue)}</span>
                                        {item.forecastedRevenue > item.revenue && (
                                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                                                +{formatCurrency(item.forecastedRevenue - item.revenue)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500 dark:text-slate-500 block mb-1">Efficienza Netta</span>
                                    <span className={`font-bold ${item.efficiency > 70 ? 'text-emerald-500' : item.efficiency > 40 ? 'text-blue-500' : 'text-orange-500'}`}>
                                        {item.efficiency.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Profit Bar */}
                            <div className="h-3 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                <div className="h-full bg-emerald-500" style={{ width: `${item.efficiency}%` }}></div>
                                <div className="h-full bg-red-400/50" style={{ width: `${100 - item.efficiency}%` }}></div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 dark:border-slate-700 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-slate-400">Spese Dedicate</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.dedicatedExpenses)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                                        Quota Spese Condivise
                                        <div className="group relative inline-block">
                                            <Info size={12} className="text-gray-400" />
                                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                Ripartite in base alla quota di fatturato rispetto al totale business.
                                            </div>
                                        </div>
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.allocatedOverhead)}</span>
                                </div>
                                <div className="flex justify-between text-sm pb-1 border-b border-gray-50 dark:border-slate-700">
                                    <span className="text-gray-600 dark:text-slate-400">Stima Tasse & INPS</span>
                                    <span className="font-medium text-red-500">-{formatCurrency(item.revenue * item.coefficient * (stats.taxRateApplied)) /* Minimal estimate */}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Margine Netto</span>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(item.netProfit)}</div>
                                        {item.forecastedNetProfit > item.netProfit && (
                                            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">
                                                Previsionale: {formatCurrency(item.forecastedNetProfit)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* SHARED EXPENSE EXPLANATION */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                <div className="flex gap-4">
                    <div className="mt-1">
                        <AlertCircle className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-1">Come leggiamo i dati?</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                            Ogni attività (ATECO) viene analizzata come un business a sé stante. Le spese sono divise in
                            <span className="font-bold"> dedicate</span> (assegnate specificamente a un codice) e
                            <span className="font-bold"> condivise</span> (spese generali come affitto o software, ripartite pro-rata in base al fatturato).
                            Il margine netto tiene conto anche della tassazione forfettaria specifica del tuo coefficiente ATECO.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessAnalysisView;
