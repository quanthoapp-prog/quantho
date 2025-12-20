import { useMemo } from 'react';
import { Transaction, FixedDebt, UserSettings, AtecoCode, Stats } from '../types';
import { calculateFiscalStats } from '../lib/fiscalLogic';

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
        return calculateFiscalStats({
            transactions,
            fixedDebts,
            settings,
            currentYear,
            atecoCodes
        });
    }, [transactions, fixedDebts, currentYear, settings, atecoCodes]);
};
