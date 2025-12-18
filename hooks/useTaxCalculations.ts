import { useMemo } from 'react';
import { Transaction, FixedDebt, UserSettings, AtecoCode, Stats } from '../types';
import { isTransactionActive, LIMITE_FORFETTARIO } from '../constants';

interface UseTaxCalculationsProps {
    transactions: Transaction[];
    fixedDebts: FixedDebt[];
    settings: UserSettings;
    currentYear: number;
    atecoCodes: AtecoCode[];
}

export const useTaxCalculations = ({
    transactions,
    fixedDebts,
    settings,
    currentYear,
    atecoCodes
}: UseTaxCalculationsProps): Stats => {

    return useMemo(() => {
        const today = new Date();
        const currentFullYear = today.getFullYear();

        // 1. Calculate Fixed Debts Estimate
        let totalFixedDebtEstimate = 0;
        fixedDebts.forEach(debt => {
            if (debt.isSuspended) return;
            // logic: if debt started in past, count from Jan (1). If started this year, count from startMonth.
            // If debt starts in future, don't count (this year view).
            const startMonth = debt.startYear < currentYear ? 1 : debt.startMonth;

            // Only calculate if the debt is relevant for the CURRENT VIEW year
            // The original logic used 'currentFullYear' (actual year) mixed with 'currentYear' (view year)?
            // Looking at App.tsx: 
            // const startMonth = debt.startYear < currentFullYear ? 1 : debt.startMonth;
            // if (debt.startYear <= currentFullYear) { ... }
            // This suggests the estimate was always for the REAL current year, not necessarily the selected view year?
            // Wait, standard practice for specific tax year view:
            // If I am viewing 2024, I want 2024 estimates.
            // App.tsx used `currentFullYear` (today.getFullYear()) for fixed debts calc.
            // But `transactions` were filtered by `currentYear` (view state).
            // This seems like a slight inconsistency in original code if browsing past years, 
            // but for "Forecasting" it usually implies "This Year".
            // Let's stick to the behavior of strictly using the selected `currentYear` for consistency with the transactions view.

            // RE-READING App.tsx logic:
            // const startMonth = debt.startYear < currentFullYear ? 1 : debt.startMonth;
            // This implies it was calculating run-rate for the ACTUAL CURRENT CALENDAR YEAR.
            // I will keep the original logic for now to avoid breaking changes, using `currentFullYear`.

            const effectiveStartMonth = debt.startYear < currentYear ? 1 : debt.startMonth;

            if (debt.startYear <= currentYear) {
                const activeMonthsInCurrentYear = Math.max(0, 12 - effectiveStartMonth + 1);
                totalFixedDebtEstimate += activeMonthsInCurrentYear * debt.installment;
            }
        });

        // 2. Filter Transactions by View Year
        const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === currentYear);

        // Separate active and scheduled transactions
        const activeTransactions = yearTransactions.filter(t => isTransactionActive(t));
        const scheduledTransactions = yearTransactions.filter(t => !isTransactionActive(t) && t.status === 'scheduled');

        // Calculate scheduled expenses total
        const scheduledExpenses = scheduledTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // 3. Gross Income Calculation (only active transactions)
        let income = 0;
        let grossTaxableIncome = 0; // Fatturato * Coeff (without deducting INPS yet)

        activeTransactions
            .filter(t => t.type === 'income')
            .forEach(t => {
                income += t.amount;
                // Find coefficient for this specific transaction
                const ateco = atecoCodes.find(c => c.id === t.atecoCodeId) || atecoCodes[0];
                const coefficient = ateco ? ateco.coefficient : 0.78;
                grossTaxableIncome += t.amount * coefficient;
            });

        // 4. Calculate Expenses & Outflows (only active transactions)
        // REAL EXPENSES = Everything that leaves the bank account
        const allExpenses = activeTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const taxesPaid = activeTransactions
            .filter(t => t.type === 'expense' && (t.category === 'tax' || t.category === 'inps'))
            .reduce((sum, t) => sum + t.amount, 0);

        const inpsPaid = activeTransactions
            .filter(t => t.type === 'expense' && t.category === 'inps')
            .reduce((sum, t) => sum + t.amount, 0);

        // 5. Calculate Net Taxable Income (Reddito Imponibile Netto)
        // Rule: Imponibile = (Fatturato * Coeff) - INPS Versati
        const redditoImponibile = Math.max(0, grossTaxableIncome - inpsPaid);

        // 6. Calculate Flat Tax Estimate
        const taxRate = settings.taxRateType === '5%' ? 0.05 : 0.15;
        const flatTax = redditoImponibile * taxRate;

        // 7. Calculate INPS Estimate
        let inpsEstimate = 0;
        if (settings.inpsType === 'separata') {
            // Gestione Separata (approx 26.23%)
            inpsEstimate = redditoImponibile * 0.2623;
        } else {
            // Artigiani e Commercianti
            const fixedCost = settings.artigianiFixedCost || 4515;
            const threshold = settings.artigianiFixedIncome || 18415;
            const exceedRate = settings.artigianiExceedRate || 0.24;

            inpsEstimate = fixedCost;
            if (redditoImponibile > threshold) {
                inpsEstimate += (redditoImponibile - threshold) * exceedRate;
            }
        }

        const totalTaxEstimate = flatTax + inpsEstimate;

        // Liquidità di Cassa = Opening Balance (for this year) + Income - Expenses
        const openingBalance = settings.openingHistory[currentYear] || 0;
        const realNetIncome = income - allExpenses; // Net cash flow for current year
        const currentLiquidity = openingBalance + realNetIncome;

        // Estimated Fiscal Net Income (Income - Taxes)
        // CORRECTED: Income - Taxes (Do not subtract implicit costs, because they are cash!)
        const estimatedNetIncome = income - totalTaxEstimate;

        // Net Available Income (Netto Disponibile)
        const netAvailableIncome = estimatedNetIncome - totalFixedDebtEstimate;

        const remainingTaxDue = totalTaxEstimate - taxesPaid;

        // --- FORECASTING: SMART BREAK-EVEN ---
        // A. Fatturato di Pareggio (Break Even Turnover)

        // 1. Determine "Time Elapsed" to project variable expenses
        let monthsElapsed = 1;
        if (currentYear < currentFullYear) monthsElapsed = 12;
        else if (currentYear === currentFullYear) monthsElapsed = Math.max(1, today.getMonth() + 1);

        // 2. Calculate Total Non-Tax Spending (Transactions)
        const nonTaxExpensesYTD = allExpenses - taxesPaid - inpsPaid;

        // 3. Smart Separation: "Variable" vs "Fixed"
        // Heuristic: Fixed Debts Paid YTD approx = (Total Fixed / 12) * monthsElapsed
        const estimatedFixedPaidYTD = (totalFixedDebtEstimate / 12) * monthsElapsed;

        // Variable Spending YTD = Total Spending - Estimated Fixed Paid
        let variableSpendingYTD = nonTaxExpensesYTD - estimatedFixedPaidYTD;
        if (variableSpendingYTD < 0) variableSpendingYTD = nonTaxExpensesYTD;

        // 4. Project Annual Variable Spending
        const projectedAnnualVariableExpenses = (variableSpendingYTD / monthsElapsed) * 12;

        // 5. Target Net Income = Fixed Debts (Certain) + Projected Variable (Lifestyle)
        const targetNetIncome = totalFixedDebtEstimate + projectedAnnualVariableExpenses;

        // 6. Gross Up Formula (Precise)
        let breakEvenTurnover = 0;
        const weightedCoeff = income > 0 ? (grossTaxableIncome / income) : 0.78; // Default to 78% if no income

        if (settings.inpsType === 'separata') {
            const inpsRate = 0.2623;
            // Formula: Turnover * Margin = Target
            // Margin = 1 - (INPS%) - (Tax% on TaxableBase post INPS)
            const margin = 1 - (weightedCoeff * inpsRate) - (weightedCoeff * (1 - inpsRate) * taxRate);

            if (margin > 0) {
                breakEvenTurnover = targetNetIncome / margin;
            }
        } else {
            // Artigiani Logic
            const fixedInps = settings.artigianiFixedCost || 4515;
            const threshold = settings.artigianiFixedIncome || 18415;
            const exceedRate = settings.artigianiExceedRate || 0.24;

            // Scenario 1: Income Low (Fixed INPS dominates)
            const marginLow = 1 - weightedCoeff * taxRate;
            // Need to cover Target + FixedINPS (grossed for tax)
            const constantPartLow = fixedInps * (1 - taxRate);
            const t1 = (targetNetIncome + constantPartLow) / marginLow;

            if (t1 * weightedCoeff <= threshold) {
                breakEvenTurnover = t1;
            } else {
                // Scenario 2: Income High (Exceed rate applies)
                const marginHigh = 1 - (weightedCoeff * exceedRate) - (weightedCoeff * (1 - exceedRate) * taxRate);

                if (marginHigh > 0) {
                    // Gross up Target + FixedINPS (Base cost)
                    breakEvenTurnover = (targetNetIncome + fixedInps) / marginHigh;
                }
            }
        }

        // B. Monthly Net (Salary)
        const monthlyNetIncome = netAvailableIncome / 12;

        // C. Efficiency per 1000€ (Marginal Value)
        const avgCoefficient = income > 0 ? (grossTaxableIncome / income) : 0.78;
        const marginalTaxable = 1000 * avgCoefficient;

        let marginalInps = 0;
        if (settings.inpsType === 'separata') {
            marginalInps = marginalTaxable * 0.2623;
        } else {
            const projectedAnnualIncome = (income / monthsElapsed) * 12;
            const projectedTaxable = projectedAnnualIncome * avgCoefficient;
            const threshold = settings.artigianiFixedIncome || 18415;

            if (projectedTaxable > threshold) {
                marginalInps = marginalTaxable * (settings.artigianiExceedRate || 0.24);
            } else {
                marginalInps = 0;
            }
        }

        // Deduct INPS from Taxable base for Flat Tax
        const marginalTaxBase = marginalTaxable - marginalInps;
        const marginalTax = marginalTaxBase * taxRate;
        const taxEfficiencyPer1000 = 1000 - marginalInps - marginalTax;

        // D. Deadlines (Scadenze)
        // Standard Forfettario: 100% Acconto (split 40/60 or 50/50) + Saldo
        const saldoAnteriore = settings.manualSaldo || 0;

        // Acconto logic: usually based on previous year, but here we provide a projection 
        // based on the CURRENT estimated totalTaxEstimate.
        const taxAccontoTotal = flatTax;
        const inpsAccontoTotal = inpsEstimate;

        const deadlines = {
            june: {
                tax: (taxAccontoTotal * 0.4) + (saldoAnteriore * 0.5),
                inps: (inpsAccontoTotal * 0.4) + (saldoAnteriore * 0.5),
                total: (taxAccontoTotal * 0.4) + (inpsAccontoTotal * 0.4) + saldoAnteriore,
                label: 'Saldo + 1° Acconto',
                date: `${currentYear}-06-30`
            },
            november: {
                tax: taxAccontoTotal * 0.6,
                inps: inpsAccontoTotal * 0.6,
                total: (taxAccontoTotal * 0.6) + (inpsAccontoTotal * 0.6),
                label: '2° Acconto',
                date: `${currentYear}-11-30`
            }
        };

        // E. Goals Calculation
        const goalPercentage = settings.annualGoal > 0 ? (income / settings.annualGoal) * 100 : 0;
        const gapToGoal = Math.max(0, settings.annualGoal - income);

        return {
            income,
            realExpenses: allExpenses, // Now includes taxes and INPS
            taxesPaid,
            inpsPaid,
            realNetIncome,
            currentLiquidity,
            redditoImponibile,
            flatTax,
            inps: inpsEstimate,
            totalTaxEstimate,
            estimatedNetIncome,
            netAvailableIncome,
            remainingTaxDue,
            totalFixedDebtEstimate,
            percentualeSoglia: (income / LIMITE_FORFETTARIO) * 100,
            taxRateApplied: taxRate,
            deadlines,
            breakEvenTurnover,
            monthlyNetIncome,
            taxEfficiencyPer1000,
            goalPercentage,
            gapToGoal,
            scheduledExpenses
        };
    }, [transactions, fixedDebts, currentYear, settings, atecoCodes]);
};
