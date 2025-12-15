import React, { useState, useEffect, useMemo } from 'react';
import { Target, Trophy, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../constants';

const GoalsView: React.FC = () => {
    const { settings, updateSettings, stats, currentYear, transactions } = useFinance();
    const [tempGoal, setTempGoal] = useState(settings.annualGoal);

    useEffect(() => {
        setTempGoal(settings.annualGoal);
    }, [settings.annualGoal]);

    const handleSaveGoal = () => {
        updateSettings({
            ...settings,
            annualGoal: tempGoal
        });
    };

    const handleSaveExpenseGoal = (tag: string, limit: number) => {
        const newExpenseGoals = { ...settings.expenseGoals, [tag]: limit };
        if (limit === 0) delete newExpenseGoals[tag]; // Remove if 0

        updateSettings({
            ...settings,
            expenseGoals: newExpenseGoals
        });
    };

    // --- EXPENSE GOALS LOGIC ---
    // 1. Get all unique tags from transactions AND existing goals
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        // Add existing goals keys
        Object.keys(settings.expenseGoals || {}).forEach(t => tags.add(t));
        // Add from transactions
        transactions.forEach(t => {
            if (t.tags) {
                const tTags = t.tags.split(',').map(s => s.trim()).filter(Boolean);
                tTags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [transactions, settings.expenseGoals]);

    // 2. Calculate stats per tag for Current Year and Previous Year
    const tagStats = useMemo(() => {
        const currentStats: { [tag: string]: number } = {};
        const previousStats: { [tag: string]: number } = {};

        transactions.forEach(t => {
            if (!t.tags || t.type !== 'expense') return; // Only expenses

            const tYear = new Date(t.date).getFullYear();
            const yearKey = tYear === currentYear ? 'current' : (tYear === currentYear - 1 ? 'prev' : null);

            if (!yearKey) return;

            const tTags = t.tags.split(',').map(s => s.trim()).filter(Boolean);
            tTags.forEach(tag => {
                const amount = t.amount;
                if (yearKey === 'current') {
                    currentStats[tag] = (currentStats[tag] || 0) + amount;
                } else {
                    previousStats[tag] = (previousStats[tag] || 0) + amount;
                }
            });
        });
        return { currentStats, previousStats };
    }, [transactions, currentYear]);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Obiettivi</h1>
                <p className="text-sm text-gray-500 mt-1">Imposta i tuoi traguardi di incasso e di spesa</p>
            </div>

            {/* A. ANNUAL REVENUE GOAL */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Obiettivo Fatturato {currentYear}</h2>
                        <p className="text-sm text-gray-500">Quanto vuoi incassare quest'anno?</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                    <div className="w-full sm:w-64">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Target Annuale (€)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={tempGoal}
                                onChange={(e) => setTempGoal(parseFloat(e.target.value) || 0)}
                                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 font-bold text-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">EUR</div>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveGoal}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Target size={20} />
                        Salva
                    </button>
                </div>

                {/* Progress Visualization */}
                <div className="mt-8">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-3xl font-extrabold text-blue-600">{stats.income.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                            <span className="text-gray-400 font-medium ml-2">raggiunti</span>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-semibold text-gray-600">{stats.goalPercentage.toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${Math.min(100, stats.goalPercentage)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* B. EXPENSE GOALS */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Target size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Budget Spese per Tag</h2>
                        <p className="text-sm text-gray-500">Controlla i costi impostando dei limiti per categoria.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {allTags.length === 0 && (
                        <p className="text-gray-400 text-sm italic">Nessun tag trovato nelle transazioni.</p>
                    )}

                    {allTags.map(tag => {
                        const currentSpent = tagStats.currentStats[tag] || 0;
                        const prevSpent = tagStats.previousStats[tag] || 0;
                        const goal = settings.expenseGoals?.[tag] || 0;
                        const hasGoal = goal > 0;
                        const percent = hasGoal ? (currentSpent / goal) * 100 : 0;
                        const isOver = currentSpent > goal;

                        return (
                            <div key={tag} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800 text-lg capitalize">{tag}</span>
                                            {prevSpent > 0 && (
                                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                                    Prev Year: {prevSpent.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            Speso quest'anno: <span className={`font-semibold ${isOver && hasGoal ? 'text-red-600' : 'text-gray-900'}`}>{currentSpent.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Limit:</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            defaultValue={goal === 0 ? '' : goal}
                                            onBlur={(e) => handleSaveExpenseGoal(tag, parseFloat(e.target.value) || 0)}
                                            className="w-32 px-3 py-2 border rounded-lg font-medium text-right focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                </div>

                                {/* Progress Bar for Budget */}
                                {hasGoal && (
                                    <div className="relative pt-1">
                                        <div className="flex mb-2 items-center justify-between text-xs">
                                            <div className={`font-semibold ${isOver ? 'text-red-600' : 'text-orange-600'}`}>
                                                {percent.toFixed(0)}% utilizzato
                                            </div>
                                        </div>
                                        <div className="overflow-hidden h-2.5 text-xs flex rounded bg-orange-100">
                                            <div
                                                style={{ width: `${Math.min(100, percent)}%` }}
                                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${isOver ? 'bg-red-500' : 'bg-orange-500'}`}
                                            ></div>
                                        </div>
                                        {isOver && (
                                            <div className="text-xs text-red-500 mt-1 font-medium">
                                                Attenzione: Hai superato il budget di {(currentSpent - goal).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Suggestions / Tips */}
            {!settings.annualGoal && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
                    <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold">Nessun obiettivo impostato</h4>
                        <p className="text-sm">
                            Impostare un obiettivo ti aiuta a focalizzarti. Un buon obiettivo è solitamente il 20-30% superiore al tuo fatturato di pareggio ({formatCurrency(stats.breakEvenTurnover)}).
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalsView;