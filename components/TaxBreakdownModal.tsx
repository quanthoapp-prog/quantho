import React from 'react';
import { X, Info, Calculator, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { Stats, UserSettings } from '../types';
import { formatCurrency } from '../constants';

interface TaxBreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: Stats;
    settings: UserSettings;
}

const TaxBreakdownModal: React.FC<TaxBreakdownModalProps> = ({ isOpen, onClose, stats, settings }) => {
    if (!isOpen) return null;

    const coefficientDisplay = (stats.redditoImponibile + stats.inpsPaid) / stats.income || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Calculator size={24} />
                        <div>
                            <h3 className="text-xl font-bold">Dettaglio Calcolo Fiscale</h3>
                            <p className="text-blue-100 text-xs">Trasparenza sulla stima delle tasse</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                    {/* Step 1: Fatturato to Imponibile Lordo */}
                    <section>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase mb-3 px-1">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                            Determinazione Reddito Imponibile
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Fatturato Lordo (Incassato)</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(stats.income)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                    Coefficiente di Redditività (Medio) <HelpCircle size={12} className="text-gray-400" />
                                </span>
                                <span className="font-semibold text-blue-600">x {(coefficientDisplay * 100).toFixed(0)}%</span>
                            </div>
                            <div className="pt-2 border-t flex justify-between items-center font-medium">
                                <span className="text-sm text-gray-700 italic">Reddito Imponibile Lordo</span>
                                <span className="text-gray-900">{formatCurrency(stats.redditoImponibile + stats.inpsPaid)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Step 2: Deducibilità INPS */}
                    <section>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase mb-3 px-1">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">2</span>
                            Deduzione Contributi Versati
                        </h4>
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 italic">Nel regime forfettario, gli unici costi deducibili sono i contributi previdenziali versati nell'anno.</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700">Contributi INPS pagati nell'anno</span>
                                <span className="font-bold text-red-600">- {formatCurrency(stats.inpsPaid)}</span>
                            </div>
                            <div className="pt-2 border-t flex justify-between items-center font-bold text-lg">
                                <span className="text-gray-900">Reddito Imponibile NETTO</span>
                                <span className="text-green-700">{formatCurrency(stats.redditoImponibile)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Step 3: Calcolo Imposta e INPS */}
                    <section>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase mb-3 px-1">
                            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs">3</span>
                            Calcolo Imposte e Contributi
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                <div className="text-xs text-orange-700 font-bold uppercase mb-1">Imposta Sostitutiva</div>
                                <div className="text-sm text-gray-600 mb-2">{stats.redditoImponibile.toFixed(0)} x {(stats.taxRateApplied * 100)}%</div>
                                <div className="text-xl font-bold text-orange-600">{formatCurrency(stats.flatTax)}</div>
                                <div className="text-[10px] text-orange-800 mt-2 italic">Aliquota {settings.taxRateType}</div>
                            </div>
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                <div className="text-xs text-indigo-700 font-bold uppercase mb-1">Contributi INPS (Stima)</div>
                                <div className="text-sm text-gray-600 mb-2">Basato su tipo {settings.inpsType}</div>
                                <div className="text-xl font-bold text-indigo-600">{formatCurrency(stats.inps)}</div>
                                <div className="text-[10px] text-indigo-800 mt-2 italic">Saldo e acconti stimati</div>
                            </div>
                        </div>
                    </section>

                    {/* Final Recap Card */}
                    <div className="bg-blue-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-blue-200">Pressione Fiscale Totale</span>
                            <span className="font-bold text-xl">{((stats.totalTaxEstimate / stats.income) * 100 || 0).toFixed(1)}% sul lordo</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-blue-800 pt-4">
                            <div>
                                <span className="text-blue-200 text-xs block mb-1">Totale da Versare nell'anno</span>
                                <span className="text-3xl font-extrabold">{formatCurrency(stats.totalTaxEstimate)}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-blue-200 text-xs block mb-1">Efficienza per 1.000€</span>
                                <span className="text-xl font-bold text-green-400">{formatCurrency(stats.taxEfficiencyPer1000)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                        <Info className="text-yellow-600 flex-shrink-0" size={20} />
                        <p className="text-xs text-yellow-800">
                            <strong>Disclaimer:</strong> Questi calcoli hanno valore puramente indicativo e previsionale.
                            Le cifre reali dipendono da scadenze, acconti e saldi definitivi che vanno verificati con il proprio consulente fiscale.
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                    >
                        Ho capito
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaxBreakdownModal;
