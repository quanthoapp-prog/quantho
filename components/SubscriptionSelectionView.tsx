import React, { useState } from 'react';
import { Check, CreditCard, Shield, Star, Calendar, Zap, Lock } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

const SubscriptionSelectionView: React.FC = () => {
    const { profile, updateProfile, fetchAllProfiles } = useFinance();
    const [selectedPlan, setSelectedPlan] = useState<'trial' | 'monthly' | 'annual' | null>(null);
    const [step, setStep] = useState<'selection' | 'payment'>('selection');
    const [isProcessing, setIsProcessing] = useState(false);

    // Mock Pricing Data
    const PLANS = {
        trial: {
            id: 'trial',
            title: '15 Giorni Gratis',
            subtitle: 'Poi 9,99€/mese',
            price: '0€',
            period: 'per 15 giorni',
            features: ['Tutte le funzionalità incluse', 'Nessun addebito immediato', 'Disdici quando vuoi', 'Supporto prioritario'],
            color: 'blue',
            badge: 'Consigliato'
        },
        monthly: {
            id: 'monthly',
            title: 'Mensile',
            subtitle: 'Flessibilità totale',
            price: '9,99€',
            period: '/mese',
            features: ['Accesso completo', 'Fatturazione mensile', 'Disdici in qualsiasi momento', 'Aggiornamenti inclusi'],
            color: 'gray',
            badge: null
        },
        annual: {
            id: 'annual',
            title: 'Annuale',
            subtitle: 'Risparmi il 20%',
            price: '99,00€',
            period: '/anno',
            features: ['2 Mesi Gratis', 'Unico pagamento annuale', 'Prezzo bloccato per 12 mesi', 'Supporto Premium'],
            color: 'green',
            badge: 'Risparmio'
        }
    };

    const handleSelectPlan = (planId: 'trial' | 'monthly' | 'annual') => {
        setSelectedPlan(planId);
        setStep('payment');
    };

    const handleSimulatedPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan || !profile) return;

        setIsProcessing(true);

        // Simulation of payment processing delay (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // Call the secure RPC function we created in SQL
            // This handles the status update and date calculation safely on the server
            const { error } = await supabase.rpc('activate_subscription', {
                plan_type: selectedPlan
            });

            if (error) throw error;

            // Calculate local date just for immediate UI update without refetch
            // (The real truth is in the DB, but this makes the UI snappy)
            let newStatus = 'active';
            let endDate = new Date();

            if (selectedPlan === 'trial') {
                newStatus = 'trial';
                endDate.setDate(endDate.getDate() + 15);
            } else if (selectedPlan === 'monthly') {
                newStatus = 'active';
                endDate.setMonth(endDate.getMonth() + 1);
            } else if (selectedPlan === 'annual') {
                newStatus = 'active';
                endDate.setFullYear(endDate.getFullYear() + 1);
            }

            // We update the local context manually to unlock the UI immediately
            await updateProfile(profile.id, {
                subscriptionStatus: newStatus as any,
                subscriptionEndDate: endDate.toISOString()
            });

            toast.success('Abbonamento attivato con successo!');
            // Navigation is handled by the parent layout or routing logic usually
            // but here we just update state, and the main Layout should detect the change and redirect/unlock features

        } catch (error) {
            console.error('Payment Error:', error);
            toast.error('Errore durante il pagamento. Riprova.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (step === 'payment' && selectedPlan) {
        const plan = PLANS[selectedPlan];
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row">
                    {/* Summary Side */}
                    <div className="bg-gray-900 text-white p-8 md:w-1/3 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="bg-white/10 p-2 rounded-lg">
                                    <Star className="text-yellow-400" size={24} fill="currentColor" />
                                </div>
                                <span className="font-bold text-xl">Quant'ho Premium</span>
                            </div>
                            <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Hai selezionato</h3>
                            <div className="text-2xl font-bold mb-1">{plan.title}</div>
                            <div className="text-3xl font-bold text-blue-400 mb-4">{plan.price}<span className="text-lg text-gray-400 font-normal">{plan.period}</span></div>
                            <ul className="space-y-3 mt-6">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                                        <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button
                            onClick={() => setStep('selection')}
                            className="text-gray-400 hover:text-white text-sm mt-8 flex items-center gap-2 transition-colors"
                        >
                            ← Cambia piano
                        </button>
                    </div>

                    {/* Payment Form Side */}
                    <div className="p-8 md:w-2/3">
                        <div className="flex items-center gap-2 mb-6 text-gray-800">
                            <Lock size={20} className="text-green-600" />
                            <h2 className="text-2xl font-bold">Dati di Pagamento</h2>
                        </div>

                        <form onSubmit={handleSimulatedPayment} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Intestatario Carta</label>
                                    <input required type="text" placeholder="Mario Rossi" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Numero Carta</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input required type="text" placeholder="0000 0000 0000 0000" className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza</label>
                                        <input required type="text" placeholder="MM/AA" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                                        <input required type="text" placeholder="123" maxLength={3} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                                <Shield className="text-blue-600 shrink-0 mt-0.5" size={18} />
                                <p className="text-xs text-blue-800">
                                    Pagamento sicuro crittografato SSL. {selectedPlan === 'trial' ? 'Nessun addebito verrà effettuato oggi. Ti addebiteremo ' + PLANS.monthly.price + ' solo alla fine dei 15 giorni di prova.' : 'L\'importo verrà addebitato immediatamente.'}
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-blue-200/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <LoadingSpinner size="sm" color="white" /> : (
                                    <>
                                        {selectedPlan === 'trial' ? 'Inizia Prova Gratuita' : `Paga ${plan.price}`}
                                        <Check size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Scegli il piano perfetto per te</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Inizia a gestire il tuo regime forfettario senza stress. Scegli come preferisci pagare dopo il periodo di prova.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {/* Trial Plan */}
                    <PlanCard
                        plan={PLANS.trial}
                        onSelect={() => handleSelectPlan('trial')}
                        icon={<Zap size={32} className="text-blue-500" />}
                    />

                    {/* Monthly Plan */}
                    <PlanCard
                        plan={PLANS.monthly}
                        onSelect={() => handleSelectPlan('monthly')}
                        icon={<Calendar size={32} className="text-gray-600" />}
                    />

                    {/* Annual Plan */}
                    <PlanCard
                        plan={PLANS.annual}
                        onSelect={() => handleSelectPlan('annual')}
                        icon={<Star size={32} className="text-green-500" />}
                    />
                </div>

                <p className="text-center text-gray-400 text-sm mt-12 flex items-center justify-center gap-2">
                    <Lock size={14} /> Pagamenti processati in sicurezza. Disdici quando vuoi dalle impostazioni.
                </p>
            </div>
        </div>
    );
};

const PlanCard: React.FC<{ plan: any; onSelect: () => void; icon: React.ReactNode }> = ({ plan, onSelect, icon }) => (
    <div className={`bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${plan.badge ? 'border-blue-500 transform scale-105 z-10' : 'border-transparent'}`}>
        {plan.badge && (
            <div className="bg-blue-600 text-white text-center text-xs font-bold py-1 uppercase tracking-wider">
                {plan.badge}
            </div>
        )}
        <div className="p-8">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-gray-50`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.title}</h3>
            <p className="text-gray-500 text-sm mb-6">{plan.subtitle}</p>

            <div className="flex items-baseline mb-8">
                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 ml-2">{plan.period}</span>
            </div>

            <button
                onClick={onSelect}
                className={`w-full py-3 rounded-xl font-bold mb-8 transition-colors ${plan.badge ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
            >
                Scegli {plan.title}
            </button>

            <ul className="space-y-4">
                {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                        <Check size={18} className="text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export default SubscriptionSelectionView;
