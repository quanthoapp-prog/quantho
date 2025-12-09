
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronsRight, Mail, Lock, ArrowRight, Loader2, CheckCircle, Info } from 'lucide-react';

interface AuthViewProps {
    onLogin: (email: string) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // onLogin is handled by the parent listening to auth state changes, 
                // but we can call it here or just let the app redirect.
                // However, App.tsx likely needs refactoring to listen to state instead of callback.
                // For now, let's keep the callback as a success signal if needed, 
                // but proper flow is App.tsx reacting to session.
                onLogin(email);
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setRegistrationSuccess(true);
            }
        } catch (err: any) {
            if (err.message && err.message.includes("User already registered")) {
                setError('Mail già registrata');
            } else {
                setError(err.message || 'Si è verificato un errore durante l\'autenticazione.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (registrationSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <div className="flex justify-center items-center gap-3 mb-6">
                        <div className="bg-green-600 text-white p-3 rounded-2xl shadow-lg">
                            <Mail size={40} strokeWidth={3} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Controlla la tua email</h2>
                    <p className="text-gray-600 mb-8">
                        Abbiamo inviato un link di conferma a <strong>{email}</strong>.<br />
                        Clicca sul link per attivare il tuo account e iniziare a usare Quantho.
                    </p>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mx-4">
                        <div className="flex items-center gap-3 text-left text-sm text-gray-600 mb-4">
                            <Info size={20} className="text-blue-500 flex-shrink-0" />
                            <p>Se non trovi l'email, controlla nella cartella <strong>Spam</strong> o <strong>Posta Indesiderata</strong>.</p>
                        </div>
                        <button
                            onClick={() => { setRegistrationSuccess(false); setIsLogin(true); setEmail(''); setPassword(''); }}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            Torna al Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                {/* LOGO */}
                <div className="flex justify-center items-center gap-3 mb-6">
                    <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg">
                        <ChevronsRight size={40} strokeWidth={3} />
                    </div>
                    <div className="text-left">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                            Quantho
                        </h1>
                        <p className="text-xs font-bold text-blue-600 tracking-wide uppercase mt-0.5">
                            Controlla le spese, vivi meglio!
                        </p>
                    </div>
                </div>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    {isLogin ? 'Accedi al tuo account' : 'Crea il tuo spazio finanziario'}
                </h2>
                <p className="mt-2 text-sm text-gray-600 max-w-xs mx-auto">
                    La dashboard completa per il regime forfettario.
                    Monitora tasse, fatturato e previsioni in un unico posto.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Indirizzo Email
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border"
                                    placeholder="tuo@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2.5 border"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-3">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {isLogin ? 'Accedi' : 'Registrati Gratuitamente'} <ArrowRight size={16} />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    {isLogin ? 'Nuovo su Quantho?' : 'Hai già un account?'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                                className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                {isLogin ? 'Crea un nuovo account' : 'Torna al Login'}
                            </button>
                        </div>
                    </div>
                </div>

                {!isLogin && (
                    <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-gray-500 max-w-sm mx-auto">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            <span>Privacy Garantita</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            <span>Backup in Cloud</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            <span>Multi-device</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            <span>Export Dati</span>
                        </div>
                    </div>
                )}
            </div>

            <footer className="mt-auto py-6 text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Quantho. Tutti i diritti riservati.
            </footer>
        </div>
    );
};

export default AuthView;
