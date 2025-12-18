import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '../../types';
import { formatCurrency } from '../../constants';

interface CategoryPieChartProps {
    transactions: Transaction[];
    year: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#f43f5e', '#ec4899', '#d946ef', '#a855f7'];

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions, year }) => {

    const categoryData = useMemo(() => {
        const yearExpenses = transactions.filter(t =>
            new Date(t.date).getFullYear() === year &&
            t.type === 'expense'
        );

        if (yearExpenses.length === 0) return [];

        const aggregation: Record<string, number> = {};

        yearExpenses.forEach(t => {
            const tags = t.tags && t.tags.trim() !== ''
                ? t.tags.split(',').map(s => s.trim()).filter(Boolean)
                : ['Senza tag'];

            const splitAmount = t.amount / tags.length;

            tags.forEach(tag => {
                // Capitalize first letter for better display
                const label = tag.charAt(0).toUpperCase() + tag.slice(1);
                aggregation[label] = (aggregation[label] || 0) + splitAmount;
            });
        });

        return Object.entries(aggregation)
            .map(([name, value]) => ({
                name,
                value
            }))
            .sort((a, b) => b.value - a.value) // Sort bigger slices first
            .slice(0, 10); // Limit to top 10 tags for readability

    }, [transactions, year]);

    if (categoryData.length === 0) return null;

    return (
        <div className="h-[400px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#374151' }}
                    />
                    <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Center Text displaying Total Expenses */}
            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Totale</p>
                <p className="text-lg font-bold text-gray-800">
                    {formatCurrency(categoryData.reduce((acc, curr) => acc + curr.value, 0))}
                </p>
            </div>
        </div>
    );
};

export default CategoryPieChart;
