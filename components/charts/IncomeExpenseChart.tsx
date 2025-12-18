import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '../../types';
import { formatCurrency } from '../../constants';

interface IncomeExpenseChartProps {
    transactions: Transaction[];
    year: number;
}

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ transactions, year }) => {

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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelStyle={{ color: '#374151', fontWeight: 'bold' }}
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
