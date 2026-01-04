import React, { useState } from 'react';
import { Check, CreditCard, Shield, Star, Calendar, Zap, Lock, Users, Clock, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

interface SubscriptionSelectionViewProps {
    isExpired?: boolean;
}

const SubscriptionSelectionView: React.FC<SubscriptionSelectionViewProps> = ({ isExpired }) => {
    const { profile, updateProfile } = useFinance();
    const [selectedPlan, setSelectedPlan] = useState<'trial' | 'monthly' | 'annual' | null>(null);
    const [step, setStep] = useState<'selection' | 'payment'>('selection');
    const [isProcessing, setIsProcessing] = useState(false);

    // Hide trial if it was already used (status is no longer 'pending')
    const showTrial = profile?.subscriptionStatus === 'pending';

    // Pricing Data - Updated for Early Bird 1000
    const PLANS = {
        trial: {
            id: 'trial',
            title: '15 Giorni Gratis',
            subtitle: 'Prova tutte le funzioni',
            price: '0€',
            originalPrice: null,
            period: 'per 15 giorni',
            features: [
                'Tutte le funzionalità incluse',
                'Nessun addebito immediato',
                'Disdici quando vuoi',
                'Nessuna carta richiesta'
            ],
            color: 'blue',
            badge: 'Inizia qui'
        },
        monthly: {
            id: 'monthly',
            title: 'Mensile Early Bird',
            subtitle: 'Primi 1000 abbonati',
            price: '1,99€',
            originalPrice: '3,90€',
            period: '/mese',
            features: [
                'Accesso completo illimitato',
                'Fatturazione mensile',
                'Prezzo bloccato per sempre',
                'Aggiornamenti inclusi'
            ],
            color: 'gray',
            badge: 'Limited Edition'
        },
        annual: {
            id: 'annual',
            title: 'Annuale Early Bird',
            subtitle: 'Miglior valore assoluto',
            price: '19,90€',
            originalPrice: '39,90€',
            period: '/anno',
            features: [
                '2 Mesi Gratis inclusi',
                'Massimo risparmio',
                'Priorità per nuove funzioni',
                'Supporto Premium 24/7'
            ],
            color: 'green',
            badge: 'Miglior Prezzo'
        }
    };

    const handleSelectPlan = (planId: 'trial' | 'monthly' | 'annual') => {
        setSelectedPlan(planId);
        setStep('payment');
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan || !profile) return;

        setIsProcessing(true);

        try {
            // Se è una prova gratuita, la attiviamo direttamente via RPC
            if (selectedPlan === 'trial') {
                const { error } = await supabase.rpc('activate_subscription', {
                    plan_type: 'trial'
                });
                if (error) throw error;

                // Aggiornamento locale rapido
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 15);
                await updateProfile(profile.id, {
                    subscriptionStatus: 'trial',
                    subscriptionEndDate: endDate.toISOString()
                });

                toast.success('Prova gratuita attivata! Divertiti.');

                // Forza il ricaricamento dell'app per aggiornare lo stato del profilo e accedere alla dashboard
                setTimeout(() => {
                    window.location.href = '#/';
                    window.location.reload();
                }, 1500);
                return;
            }

            // PER ABBONAMENTI A PAGAMENTO:
            // Chiamata alla Edge Function di Supabase che interagisce con Stripe
            // Nota: devi configurare la funzione 'create-checkout-session' su Supabase
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    plan: selectedPlan,
                    userId: profile.id,
                    userEmail: profile.email,
                    priceId: selectedPlan === 'monthly' ? 'price_1SizFxF1GflKFaFBQ3b7CDVY' : 'price_1SizGHF1GflKFaFBqpKLR77O'
                }
            });

            if (error) throw error;

            // Reindirizzamento a Stripe Checkout
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('Nessun URL di pagamento ricevuto');
            }

        } catch (error: any) {
            console.error('Checkout Error:', error);
            // Fallback per test (se la funzione non è ancora deployata)
            if (error.message?.includes('Function not found')) {
                toast.error('Configurazione Stripe in corso. Riprova tra poco.');
            } else {
                toast.error('Errore durante l\'avvio del pagamento. Riprova.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (step === 'payment' && selectedPlan) {
        const plan = PLANS[selectedPlan];
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row border border-gray-100">
                    {/* Summary Side */}
                    <div className="bg-slate-900 text-white p-10 md:w-1/3 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-white p-1 rounded-xl shadow-lg overflow-hidden">
                                    <img src="/pwa-192x192.png" alt="Logo" className="w-10 h-10 object-contain" />
                                </div>
                                <span className="font-bold text-xl tracking-tight">Quantho Pro</span>
                            </div>
                            <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-3">Piano Scelto</h3>
                            <div className="text-2xl font-bold mb-1">{plan.title}</div>

                            <div className="mt-4 flex flex-col">
                                {plan.originalPrice && (
                                    <span className="text-slate-500 line-through text-lg font-medium">{plan.originalPrice}</span>
                                )}
                                <div className="text-4xl font-black text-blue-400">
                                    {plan.price}
                                    <span className="text-lg text-slate-400 font-normal ml-1">{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mt-8">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                                        <div className="bg-green-500/20 p-0.5 rounded-full">
                                            <Check size={14} className="text-green-400 shrink-0" />
                                        </div>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button
                            onClick={() => setStep('selection')}
                            className="text-slate-400 hover:text-white text-sm mt-10 flex items-center gap-2 transition-all group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Cambia piano
                        </button>
                    </div>

                    {/* Payment Form Side */}
                    <div className="p-10 md:w-2/3 flex flex-col justify-center">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center p-4 bg-blue-50 rounded-2xl text-blue-600 mb-4">
                                <CreditCard size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Conferma Ordine</h2>
                            <p className="text-gray-500">Verrai reindirizzato al portale di pagamento sicuro di Stripe.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex gap-4 items-start shadow-sm shadow-amber-100/50">
                                <Shield className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-amber-900">Sicurezza Stripe</p>
                                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                        I tuoi dati di pagamento non toccano mai i nostri server. {selectedPlan === 'trial' ? 'Nessun addebito oggi.' : 'Transazione sicura gestita da Stripe checkout.'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                            >
                                {isProcessing ? <LoadingSpinner size="sm" color="white" /> : (
                                    <>
                                        {selectedPlan === 'trial' ? 'Attiva Prova Gratuita' : `Procedi al Pagamento`}
                                        <Zap size={20} fill="currentColor" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400">
                                Cliccando accetti i nostri termini di servizio e la policy sui rimborsi.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    {isExpired && (
                        <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 font-bold shadow-sm animate-pulse">
                            <AlertCircle size={24} />
                            <span>Il tuo periodo di prova o abbonamento è scaduto. Scegli un piano per continuare.</span>
                        </div>
                    )}
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest">
                        🚀 Offerta Lancio
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight">
                        Quantho Prime <span className="text-blue-600">Early Bird</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
                        Stiamo lanciando! I primi <span className="text-blue-600 font-bold">1000 abbonati</span> otterranno questo prezzo speciale <span className="underline decoration-blue-500 decoration-2">per sempre</span>.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 font-medium pt-2">
                        <div className="flex items-center gap-1.5">
                            <Users size={16} className="text-blue-500" />
                            <span>Posti limitati: <strong className="text-gray-900">142/1000</strong> già presi</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={16} className="text-blue-500" />
                            <span>Prezzo bloccato a vita</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {Object.values(PLANS)
                        .filter(plan => plan.id !== 'trial' || showTrial)
                        .map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onSelect={() => handleSelectPlan(plan.id as any)}
                            />
                        ))}
                </div>

                <div className="mt-16 text-center space-y-6">
                    <div className="max-w-2xl mx-auto bg-gray-100/50 p-6 rounded-3xl border border-gray-200/50">
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
                            <Lock size={14} /> Pagamenti protetti con crittografia AES-256 gestiti da Stripe.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlanCard: React.FC<{ plan: any; onSelect: () => void }> = ({ plan, onSelect }) => {
    const isSpecial = plan.badge !== null;

    return (
        <div className={`bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 flex flex-col h-full group ${isSpecial ? 'border-blue-500 scale-105 z-10 ring-4 ring-blue-500/5' : 'border-transparent'
            }`}>
            {plan.badge && (
                <div className="bg-blue-600 text-white text-center text-[10px] font-black py-2 uppercase tracking-[0.2em]">
                    {plan.badge}
                </div>
            )}
            <div className="p-10 flex flex-col h-full">
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.title}</h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">{plan.subtitle}</p>
                </div>

                <div className="mb-10 flex flex-col">
                    {plan.originalPrice && (
                        <span className="text-gray-400 line-through text-xl font-medium mb-1">{plan.originalPrice}</span>
                    )}
                    <div className="flex items-baseline">
                        <span className="text-5xl font-black text-gray-900 tracking-tighter">{plan.price}</span>
                        <span className="text-gray-400 font-bold ml-2 text-lg">{plan.period}</span>
                    </div>
                </div>

                <ul className="space-y-5 flex-1 mb-10">
                    {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-4">
                            <div className={`mt-1 rounded-full p-1 ${isSpecial ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Check size={14} strokeWidth={3} />
                            </div>
                            <span className="text-gray-600 text-sm font-semibold leading-snug">{feature}</span>
                        </li>
                    ))}
                </ul>

                <button
                    onClick={onSelect}
                    className={`w-full py-5 rounded-[1.25rem] font-black text-sm uppercase tracking-widest transition-all duration-300 ${isSpecial
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-gray-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                >
                    Attiva {plan.id === 'trial' ? 'Subito' : 'Premium'}
                </button>
            </div>
        </div>
    );
};

export default SubscriptionSelectionView;
