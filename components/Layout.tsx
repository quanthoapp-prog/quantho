import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { Wallet, LogOut, Menu, X, FileText, TrendingUp, Banknote, Users, Target, Settings, ShieldCheck, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Toaster } from 'react-hot-toast';
import NotificationPanel from './NotificationPanel';

const Layout: React.FC = () => {
    const { currentYear, availableYears, setCurrentYear, profile } = useFinance();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            // Start sign out
            supabase.auth.signOut();

            // Clear local storage as safety
            localStorage.clear();

            // Force redirect and reload after a tiny delay to allow signOut to start
            setTimeout(() => {
                window.location.href = '#/';
                window.location.reload();
            }, 100);
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.clear();
            window.location.href = '#/';
            window.location.reload();
        }
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: FileText },
        { path: '/transactions', label: 'Transazioni', icon: TrendingUp },
        { path: '/calendar', label: 'Calendario', icon: Calendar },
        { path: '/fixed-debts', label: 'Debiti Fissi', icon: Banknote },
        { path: '/clients', label: 'Clienti', icon: Users },
        { path: '/goals', label: 'Obiettivi', icon: Target },
        { path: '/settings', label: 'Impostazioni', icon: Settings },
        ...(profile?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: ShieldCheck }] : [])
    ];

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300">
            {/* Navbar */}
            <div className="bg-white dark:bg-slate-800 shadow sticky top-0 z-20 border-b border-transparent dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-700 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden">
                                <img src="/pwa-192x192-v2.png" alt="Logo" className="w-10 h-10 object-contain" />
                                <div className="pr-3 flex flex-col hidden sm:flex">
                                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none tracking-tight">Quant'Ho</span>
                                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Premium</span>
                                </div>
                            </div>
                        </div>

                        {/* Desktop: Year Selector & Logout */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Anno:</label>
                                <select
                                    value={currentYear}
                                    onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                                    className="bg-transparent border-none font-bold text-gray-900 dark:text-white focus:ring-0 cursor-pointer"
                                    style={{ outline: "none" }}
                                >
                                    {availableYears.map(year => <option key={year} value={year} className="dark:bg-slate-800">{year}</option>)}
                                </select>
                            </div>
                            <div className="h-6 w-px bg-gray-300 dark:bg-slate-600"></div>

                            {/* Notification Panel */}
                            <NotificationPanel />

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                                <LogOut size={18} />
                                Esci
                            </button>
                        </div>

                        {/* Mobile: Notification & Hamburger */}
                        <div className="md:hidden flex items-center gap-2">
                            <NotificationPanel />
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300">
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-800 border-b dark:border-slate-700 shadow-lg sticky top-16 z-10 animate-in slide-in-from-top-2">
                    <div className="px-4 py-3 space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-700">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Anno Fiscale:</label>
                            <select
                                value={currentYear}
                                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                                className="border dark:border-slate-600 rounded-lg px-3 py-1.5 font-semibold bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            >
                                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>

                        {navItems.map(item => (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive(item.path)
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="px-4 py-3 border-t dark:border-slate-700">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <LogOut size={20} />
                            Disconnetti Account
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Navigation Bar (Tabs) */}
            <div className="hidden md:block bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {navItems.map(item => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${isActive(item.path)
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 fade-in">
                <Outlet />
            </main>
            <Toaster position="top-right" toastOptions={{
                className: 'dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700'
            }} />
        </div>
    );
};

export default Layout;
