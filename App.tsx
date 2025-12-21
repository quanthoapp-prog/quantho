import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AuthView from './components/AuthView';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import ClientsView from './components/ClientsView';
import FixedDebtsView from './components/FixedDebtsView';
import GoalsView from './components/GoalsView';
import SettingsView from './components/SettingsView';
import AdminPanelView from './components/AdminPanelView';
import { FinanceProvider } from './context/FinanceContext';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecovering, setIsRecovering] = useState(false);

    // Auth Listener
    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user?.email ?? null);
            setUserId(session?.user?.id ?? null);
            setIsLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovering(true);
            }
            setUser(session?.user?.email ?? null);
            setUserId(session?.user?.id ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = () => {
        // This is mainly for the AuthView callback, 
        // but the actual state update happens via onAuthStateChange
    };

    if (isLoading) {
        return <LoadingSpinner fullScreen text="Avvio applicazione..." />;
    }

    if (!user || !userId || isRecovering) {
        return <AuthView onLogin={handleLogin} recoveryMode={isRecovering} onPasswordReset={() => setIsRecovering(false)} />;
    }

    return (
        <HashRouter>
            <FinanceProvider userId={userId} userEmail={user}>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<DashboardView />} />
                        <Route path="/transactions" element={<TransactionsView />} />
                        <Route path="/clients" element={<ClientsView />} />
                        <Route path="/fixed-debts" element={<FixedDebtsView />} />
                        <Route path="/goals" element={<GoalsView />} />
                        <Route path="/settings" element={<SettingsView />} />
                        <Route path="/admin" element={<AdminPanelView />} />
                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </FinanceProvider>
        </HashRouter>
    );
};

export default App;