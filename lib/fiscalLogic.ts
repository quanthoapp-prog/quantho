import { Transaction, FixedDebt, UserSettings, AtecoCode, Stats } from '../types';
import { isTransactionActive, LIMITE_FORFETTARIO } from '../constants';

interface CalculateFiscalStatsProps {
    transactions: Transaction[];
    fixedDebts: FixedDebt[];
    settings: UserSettings;
    currentYear: number;
    atecoCodes: AtecoCode[];
    contracts: import('../types').Contract[];
}

export const calculateFiscalStats = ({
    transactions,
    fixedDebts,
    settings,
    currentYear,
    atecoCodes,
    contracts
}: CalculateFiscalStatsProps): Stats => {
    const today = new Date();
    const currentFullYear = today.getFullYear();

    // 1. Calculate Fixed Debts Estimate
    let totalFixedDebtEstimate = 0;
    fixedDebts.forEach(debt => {
        if (debt.isSuspended) return;
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
    let totalIncome = 0;
    let businessIncome = 0;
    let extraIncome = 0;
    let grossTaxableIncome = 0;

    activeTransactions
        .filter(t => t.type === 'income')
        .forEach(t => {
            totalIncome += t.amount;
            if (t.category === 'extra') {
                extraIncome += t.amount;
            } else {
                // Default to business if category is not 'extra' (business, or even if someone used personal/tax for income by mistake)
                businessIncome += t.amount;
                const ateco = atecoCodes.find(c => c.id === t.atecoCodeId) || atecoCodes[0];
                const coefficient = ateco ? ateco.coefficient : 0.78;
                grossTaxableIncome += t.amount * coefficient;
            }
        });

    // 4. Calculate Expenses & Outflows (only active transactions)
    const allExpenses = activeTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const taxesPaid = activeTransactions
        .filter(t => t.type === 'expense' && (t.category === 'tax' || t.category === 'inps'))
        .reduce((sum, t) => sum + t.amount, 0);

    const inpsPaid = activeTransactions
        .filter(t => t.type === 'expense' && t.category === 'inps')
        .reduce((sum, t) => sum + t.amount, 0);

    // 5. Calculate Net Taxable Income
    const redditoImponibile = Math.max(0, grossTaxableIncome - inpsPaid);

    // 6. Calculate Flat Tax Estimate
    const taxRate = settings.taxRateType === '5%' ? 0.05 : 0.15;
    const flatTax = redditoImponibile * taxRate;

    // 7. Calculate INPS Estimate
    let inpsEstimate = 0;
    if (settings.inpsType === 'separata') {
        inpsEstimate = redditoImponibile * 0.2623;
    } else {
        const fixedCost = settings.artigianiFixedCost || 4515;
        const threshold = settings.artigianiFixedIncome || 18415;
        const exceedRate = settings.artigianiExceedRate || 0.24;

        inpsEstimate = fixedCost;
        if (redditoImponibile > threshold) {
            inpsEstimate += (redditoImponibile - threshold) * exceedRate;
        }
    }

    const totalTaxEstimate = flatTax + inpsEstimate;

    // --- PIPELINE FORECASTING ---
    const activeContracts = contracts.filter(c => c.status !== 'completed' && new Date(c.expectedDate).getFullYear() === currentYear);
    const contractsExpectedIncome = activeContracts.reduce((sum, c) => sum + c.amount, 0);

    let contractsGrossTaxable = 0;
    activeContracts.forEach(c => {
        const ateco = atecoCodes.find(ac => ac.id === c.atecoCodeId) || atecoCodes[0];
        contractsGrossTaxable += c.amount * (ateco?.coefficient || 0.78);
    });

    const forecastedBusinessIncome = businessIncome + contractsExpectedIncome;
    const forecastedGrossTaxable = grossTaxableIncome + contractsGrossTaxable;
    const forecastedRedditoImponibile = Math.max(0, forecastedGrossTaxable - inpsPaid); // Simplification: assuming inpsPaid is known or similar

    const forecastedFlatTax = forecastedRedditoImponibile * taxRate;
    let forecastedInps = 0;
    if (settings.inpsType === 'separata') {
        forecastedInps = forecastedRedditoImponibile * 0.2623;
    } else {
        const fixedCost = settings.artigianiFixedCost || 4515;
        const threshold = settings.artigianiFixedIncome || 18415;
        const exceedRate = settings.artigianiExceedRate || 0.24;
        forecastedInps = fixedCost;
        if (forecastedRedditoImponibile > threshold) {
            forecastedInps += (forecastedRedditoImponibile - threshold) * exceedRate;
        }
    }
    const forecastedTaxTotal = forecastedFlatTax + forecastedInps;
    const forecastedNetIncome = forecastedBusinessIncome - forecastedTaxTotal - totalFixedDebtEstimate;

    // Liquidità di Cassa 
    const openingBalance = settings.openingHistory[currentYear] || 0;
    const realNetIncome = totalIncome - allExpenses;
    const currentLiquidity = openingBalance + realNetIncome;

    const estimatedNetIncome = businessIncome - totalTaxEstimate;
    const netAvailableIncome = estimatedNetIncome - totalFixedDebtEstimate;
    const remainingTaxDue = totalTaxEstimate - taxesPaid;

    // --- FORECASTING: SMART BREAK-EVEN ---
    let monthsElapsed = 1;
    if (currentYear < currentFullYear) monthsElapsed = 12;
    else if (currentYear === currentFullYear) monthsElapsed = Math.max(1, today.getMonth() + 1);

    const nonTaxExpensesYTD = allExpenses - taxesPaid - inpsPaid;
    const estimatedFixedPaidYTD = (totalFixedDebtEstimate / 12) * monthsElapsed;

    let variableSpendingYTD = nonTaxExpensesYTD - estimatedFixedPaidYTD;
    if (variableSpendingYTD < 0) variableSpendingYTD = nonTaxExpensesYTD;

    const projectedAnnualVariableExpenses = (variableSpendingYTD / monthsElapsed) * 12;
    const targetNetIncome = totalFixedDebtEstimate + projectedAnnualVariableExpenses;

    let breakEvenTurnover = 0;
    const weightedCoeff = businessIncome > 0 ? (grossTaxableIncome / businessIncome) : 0.78;

    if (settings.inpsType === 'separata') {
        const inpsRate = 0.2623;
        const margin = 1 - (weightedCoeff * inpsRate) - (weightedCoeff * (1 - inpsRate) * taxRate);
        if (margin > 0) {
            breakEvenTurnover = targetNetIncome / margin;
        }
    } else {
        const fixedInps = settings.artigianiFixedCost || 4515;
        const threshold = settings.artigianiFixedIncome || 18415;
        const exceedRate = settings.artigianiExceedRate || 0.24;

        const marginLow = 1 - weightedCoeff * taxRate;
        const constantPartLow = fixedInps * (1 - taxRate);
        const t1 = (targetNetIncome + constantPartLow) / marginLow;

        if (t1 * weightedCoeff <= threshold) {
            breakEvenTurnover = t1;
        } else {
            const marginHigh = 1 - (weightedCoeff * exceedRate) - (weightedCoeff * (1 - exceedRate) * taxRate);
            if (marginHigh > 0) {
                breakEvenTurnover = (targetNetIncome + fixedInps) / marginHigh;
            }
        }
    }

    const monthlyNetIncome = netAvailableIncome / 12;
    const avgCoefficient = businessIncome > 0 ? (grossTaxableIncome / businessIncome) : 0.78;
    const marginalTaxable = 1000 * avgCoefficient;

    let marginalInps = 0;
    if (settings.inpsType === 'separata') {
        marginalInps = marginalTaxable * 0.2623;
    } else {
        const projectedAnnualIncome = (businessIncome / monthsElapsed) * 12;
        const projectedTaxable = projectedAnnualIncome * avgCoefficient;
        const threshold = settings.artigianiFixedIncome || 18415;

        if (projectedTaxable > threshold) {
            marginalInps = marginalTaxable * (settings.artigianiExceedRate || 0.24);
        } else {
            marginalInps = 0;
        }
    }

    const marginalTaxBase = marginalTaxable - marginalInps;
    const marginalTax = marginalTaxBase * taxRate;
    const taxEfficiencyPer1000 = 1000 - marginalInps - marginalTax;

    const saldoAnteriore = settings.manualSaldo || 0;
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

    const goalPercentage = settings.annualGoal > 0 ? (businessIncome / settings.annualGoal) * 100 : 0;
    const gapToGoal = Math.max(0, settings.annualGoal - businessIncome);

    return {
        income: totalIncome,
        businessIncome,
        extraIncome,
        realExpenses: allExpenses,
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
        percentualeSoglia: (businessIncome / LIMITE_FORFETTARIO) * 100,
        taxRateApplied: taxRate,
        deadlines,
        breakEvenTurnover,
        monthlyNetIncome,
        taxEfficiencyPer1000,
        goalPercentage,
        gapToGoal,
        scheduledExpenses,
        forecastedBusinessIncome,
        forecastedNetIncome,
        forecastedTaxTotal,
        forecastedLiquidity: currentLiquidity + (forecastedBusinessIncome - businessIncome) - (forecastedTaxTotal - totalTaxEstimate)
    };
};
