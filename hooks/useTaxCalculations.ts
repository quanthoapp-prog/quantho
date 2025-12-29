import { useMemo } from 'react';
import { Transaction, FixedDebt, UserSettings, AtecoCode, Stats } from '../types';
import { calculateFiscalStats } from '../lib/fiscalLogic';

interface UseTaxCalculationsProps {
    transactions: Transaction[];
    fixedDebts: FixedDebt[];
    settings: UserSettings;
    currentYear: number;
    atecoCodes: AtecoCode[];
    contracts: import('../types').Contract[];
}

export const useTaxCalculations = ({
    transactions,
    fixedDebts,
    settings,
    currentYear,
    atecoCodes,
    contracts
}: UseTaxCalculationsProps): Stats => {
    return useMemo(() => {
        return calculateFiscalStats({
            transactions,
            fixedDebts,
            settings,
            currentYear,
            atecoCodes,
            contracts
        });
    }, [transactions, fixedDebts, currentYear, settings, atecoCodes, contracts]);
};
