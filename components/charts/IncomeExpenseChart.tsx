import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '../../types';
import { formatCurrency } from '../../constants';

interface IncomeExpenseChartProps {
    transactions: Transaction[];
    year: number;
}

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ transactions, year }) => {
    const isDark = document.documentElement.classList.contains('dark');

    // Aggregate data by month
    const monthlyData = useMemo(() => {
        const data = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(year, i).toLocaleString('it-IT', { month: 'short' }),
            entrate: 0,
            uscite: 0,
            monthIndex: i
        }));

        const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === year);

        yearTransactions.forEach(t => {
            const month = new Date(t.date).getMonth();
            if (t.type === 'income') {
                data[month].entrate += t.amount;
            } else if (t.type === 'expense') {
                data[month].uscite += t.amount;
            }
        });

        return data;
    }, [transactions, year]);

    if (transactions.length === 0) return null;

    const gridColor = isDark ? '#334155' : '#f1f5f9';
    const axisColor = isDark ? '#cbd5e1' : '#64748b'; // Lighter slate for better contrast
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipText = isDark ? '#f8fafc' : '#374151';

    return (
        <div className="h-[350px] w-full p-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={monthlyData}
                    margin={{
                        top: 20,
                        right: 10,
                        left: -20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: axisColor }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: axisColor }}
                        tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: isDark ? '#334155' : '#f3f4f6' }}
                        contentStyle={{
                            backgroundColor: tooltipBg,
                            borderRadius: '12px',
                            border: isDark ? '1px solid #475569' : 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelStyle={{ color: tooltipText, fontWeight: 'bold' }}
                        itemStyle={{ color: tooltipText }}
                    />
                    <Legend
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px' }}
                    />
                    <Bar
                        dataKey="entrate"
                        name="Entrate"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                        barSize={12}
                    />
                    <Bar
                        dataKey="uscite"
                        name="Uscite"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        barSize={12}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default IncomeExpenseChart;
