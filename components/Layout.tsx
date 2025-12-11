import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, GraduationCap, Globe, ClipboardList, Menu, X, Gift, Moon, Sun, PieChart, School, Database } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simulate user role based on path (just for demo UX)
  const isStudentView = location.pathname.includes('/take');

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // If in student view (SurveyTaker), we might want to hide the standard layout elements or keep them minimal
  if (isStudentView) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
         <Outlet />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Mobile Header (Visible only on mobile) */}
      <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-20 sticky top-0 transition-colors duration-200">
        <Link to="/" className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-lg">
          <GraduationCap className="w-6 h-6" />
          <span>{t('app_name')}</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 dark:text-slate-300 focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`
        bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        md:w-64 flex-shrink-0 flex flex-col justify-between
        fixed md:sticky top-0 h-screen z-10 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 w-full' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 hidden md:block">
          <Link to="/" className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xl">
            <GraduationCap className="w-8 h-8" />
            <span>{t('app_name')}</span>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('app_subtitle')}</p>
        </div>

        <div className="flex flex-col p-4 md:p-0 gap-1 md:gap-0 mt-4 md:mt-0">
          <NavLink 
            to="/" 
            end
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-6 py-4 md:py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600 dark:border-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {t('nav_dashboard')}
          </NavLink>
          <NavLink 
            to="/universities" 
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-6 py-4 md:py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600 dark:border-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <School className="w-5 h-5" />
            {t('nav_university')}
          </NavLink>
          <NavLink 
            to="/create" 
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-6 py-4 md:py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600 dark:border-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <PlusCircle className="w-5 h-5" />
            {t('nav_create')}
          </NavLink>
          <NavLink 
            to="/list" 
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-6 py-4 md:py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600 dark:border-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <ClipboardList className="w-5 h-5" />
            {t('nav_management')}
          </NavLink>
          <NavLink 
            to="/analytics" 
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-6 py-4 md:py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600 dark:border-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <PieChart className="w-5 h-5" />
            {t('nav_analytics')}
          </NavLink>
          <NavLink 
            to="/prize" 
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-6 py-4 md:py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600 dark:border-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <Gift className="w-5 h-5" />
            {t('nav_prize')}
          </NavLink>
          <NavLink 
            to="/settings" 
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-6 py-4 md:py-3 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600 dark:border-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <Database className="w-5 h-5" />
            {t('nav_settings')}
          </NavLink>
        </div>

        <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-700 space-y-2">
           <button 
             onClick={toggleLanguage}
             className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
           >
             <Globe className="w-4 h-4" />
             <span>{language === 'ko' ? 'English' : '한국어'}</span>
           </button>

           <button 
             onClick={toggleTheme}
             className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg mb-4 transition-colors"
           >
             {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
           </button>

           <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg transition-colors">
             <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase">Current User</p>
             <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t('user_role')}</p>
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen relative scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};