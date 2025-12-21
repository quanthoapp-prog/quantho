import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { Wallet, LogOut, Menu, X, FileText, TrendingUp, Banknote, Users, Target, Settings, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC = () => {
    const { currentYear, availableYears, setCurrentYear, profile } = useFinance();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // The App component auth listener will handle the redirect/state change
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: FileText },
        { path: '/transactions', label: 'Transazioni', icon: TrendingUp },
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
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Navbar */}
            <div className="bg-white shadow sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600 rounded-lg p-2 text-white shadow-lg shadow-blue-200">
                                    <Wallet size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-extrabold text-slate-800 tracking-tight">Quant'ho</span>
                                    <div className="text-[10px] font-semibold text-slate-400 -mt-1 tracking-wider uppercase">Finance Manager</div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop: Year Selector & Logout */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                                <label className="text-sm font-medium text-gray-700">Anno:</label>
                                <select
                                    value={currentYear}
                                    onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                                    className="bg-transparent border-none font-bold text-gray-900 focus:ring-0 cursor-pointer"
                                    style={{ outline: "none" }}
                                >
                                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                            <div className="h-6 w-px bg-gray-300"></div>

                            {/* Desktop Navigation Links (Optional: Add here or keep mobile only style? 
                               Original app implied tab switching. A top navbar is nice. 
                               Let's add simple icons or text links here or keep it as "Mobile Menu style" for simplicity? 
                               Actually, the original app ONLY showed navigation in the Mobile Menu? 
                               Wait, looking at App.tsx lines 771+, that's the mobile menu.
                               Where were the DESKTOP tabs? 
                               Ah, step 77 doesn't show the full render method. 
                               Let me guess/check lines 800+ in app.tsx again if I missed desktop nav.
                               
                               Checking App.tsx content from previous step...
                               Line 785 is inside `mobileMenuOpen &&`.
                               
                               Wait, I missed the Desktop Sidebar or Tabs in App.tsx view.
                               Line 12 view_file ended at 800.
                               Let's assumed there was a Desktop sidebar or a tab list below the nav?
                               
                               Actually, standard Quantho screenshot usually shows a Sidebar?
                               Or was it just the mobile menu?
                               
                               Let's View App.tsx line 800-929 to be sure how desktop nav was handled.
                            */}

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                            >
                                <LogOut size={18} />
                                Esci
                            </button>
                        </div>

                        {/* Mobile: Hamburger */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b shadow-lg sticky top-16 z-10 animate-in slide-in-from-top-2">
                    <div className="px-4 py-3 space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b">
                            <label className="text-sm font-medium text-gray-700">Anno Fiscale:</label>
                            <select
                                value={currentYear}
                                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                                className="border rounded-lg px-3 py-1.5 font-semibold bg-white text-gray-900"
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
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Desktop Navigation Bar (Tabs) - Recreating assumed desktop nav */}
            <div className="hidden md:block bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {navItems.map(item => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${isActive(item.path)
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            <Toaster position="top-right" />
        </div>
    );
};

export default Layout;
