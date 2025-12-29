
export interface AtecoCode {
    id: string;
    code: string;
    description: string;
    coefficient: number; // 0.0 - 1.0 (e.g., 0.78)
}

export interface UserSettings {
    openingHistory: { [year: number]: number }; // Saldo al 1° Gennaio per anno specifico
    taxRateType: '5%' | '15%';
    inpsType: 'separata' | 'artigiani';
    // For Artigiani/Commercianti
    artigianiFixedIncome: number; // Il reddito minimale (es. 18.415)
    artigianiFixedCost: number;   // Il contributo fisso (es. 4.427)
    artigianiExceedRate: number;  // Aliquota sull'eccedenza (es. 24%)
    annualGoal: number; // Obiettivo di fatturato annuo
    expenseGoals: { [tag: string]: number }; // Obiettivi di spesa per tag
    savedTags?: string[]; // Tag salvati per autocomplete
    // Fiscal Manual Data
    manualSaldo?: number; // Saldo anno precedente inserito manualmente
    manualAccontiPaid?: number; // Acconti già versati per l'anno corrente
}

export interface Transaction {
    id: number;
    date: string;
    type: 'income' | 'expense';
    category: 'business' | 'personal' | 'tax' | 'inps' | 'extra'; // extra = non-taxable income/other
    amount: number;
    description: string;
    client: string;
    tags: string;
    atecoCodeId?: string;
    status?: 'active' | 'scheduled'; // 'scheduled' for future transactions
}

export interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
}

export interface FixedDebt {
    id: number;
    name: string;
    totalDue: number;
    installment: number;
    debitDay: number;
    isSuspended: boolean;
    type: 'debt' | 'subscription' | 'fiscal';
    fiscalCategory?: 'tax' | 'inps'; // Only for type 'fiscal'
    startMonth: number;
    startYear: number;
    paymentMode: 'auto' | 'manual'; // auto = automatic transaction creation, manual = user registers payment
}

export interface FiscalDeadline {
    tax: number;
    inps: number;
    total: number;
    label: string;
    date: string;
}

export interface Stats {
    income: number; // Total income (Business + Extra)
    businessIncome: number; // Taxable Turnover (Fatturato)
    extraIncome: number;    // Non-taxable / Extra turnover
    realExpenses: number; // Includes Business, Personal, Tax, INPS
    taxesPaid: number;    // Tax + INPS
    inpsPaid: number;     // Specific tracking for deductibility
    realNetIncome: number; // Cash flow current year only
    currentLiquidity: number; // Opening Balance + realNetIncome
    redditoImponibile: number;
    flatTax: number;
    inps: number;
    totalTaxEstimate: number;
    estimatedNetIncome: number; // Netto Fiscale (Imponibile - Tasse)
    netAvailableIncome: number; // Netto Disponibile (Netto Fiscale - Debiti Fissi)
    remainingTaxDue: number;
    totalFixedDebtEstimate: number;
    percentualeSoglia: number;
    taxRateApplied: number; // 0.05 or 0.15
    // Deadlines
    deadlines: {
        june: FiscalDeadline;
        november: FiscalDeadline;
    };
    // Forecasting
    breakEvenTurnover: number; // Fatturato di pareggio (Gross Up di Spese + Debiti)
    monthlyNetIncome: number; // Stipendio mensile equivalente (Netto Disponibile / 12)
    taxEfficiencyPer1000: number; // Quanto rimane di una fattura da 1000€
    // Goal
    goalPercentage: number; // % raggiunta dell'obiettivo utente
    gapToGoal: number; // Quanto manca
    scheduledExpenses: number; // Total of future/scheduled expenses
    // Forecast including contracts
    forecastedBusinessIncome: number; // businessIncome + pending contracts
    forecastedNetIncome: number;      // Net including contracts
    forecastedTaxTotal: number;      // Estimated tax including contracts
    forecastedLiquidity: number;     // final liquidity if all contracts are paid
}

export interface Contract {
    id: number;
    title: string;
    clientName: string;
    amount: number;
    atecoCodeId: string;
    status: 'pending' | 'signed' | 'completed';
    expectedDate: string; // YYYY-MM-DD
    notes?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    role: 'user' | 'admin';
    subscriptionStatus: 'trial' | 'active' | 'expired' | 'canceled' | 'pending';
    subscriptionEndDate: string | null;
    createdAt: string;
}

export type TabId = 'dashboard' | 'transactions' | 'fixedDebts' | 'clients' | 'settings' | 'goals' | 'admin';

export interface Reminder {
    id: number;
    title: string;
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm
    type: 'payment' | 'collection' | 'memo';
    isCompleted: boolean;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    isRead: boolean;
    createdAt: string;
    link?: string;
    reminderId?: number; // Optional reference to a reminder
    deadlineId?: string; // Optional reference to a fiscal deadline or debt
}