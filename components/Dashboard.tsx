import React from 'react';
import { Survey, University } from '../types';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, ClipboardCheck, TrendingUp, AlertCircle, Settings, School, MapPin, BrainCircuit, Map, BarChart3, PieChart, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  surveys: Survey[];
  universities?: University[];
}

export const Dashboard: React.FC<DashboardProps> = ({ surveys, universities = [] }) => {
  const { t } = useLanguage();
  const activeSurveys = surveys.filter(s => s.status === 'ACTIVE');
  
  // Mock data for the chart
  const participationData = [
    { name: 'Mon', responses: 40 },
    { name: 'Tue', responses: 85 },
    { name: 'Wed', responses: 60 },
    { name: 'Thu', responses: 120 },
    { name: 'Fri', responses: 95 },
  ];

  const analysisMethods = [
    { id: 'basic', icon: BrainCircuit, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/30' },
    { id: 'ipa', icon: Map, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-900/30' },
    { id: 'boxplot', icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-900/30' },
    { id: 'mca', icon: PieChart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-900/30' },
    { id: 'demographic', icon: Users, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-100 dark:border-pink-900/30' },
    { id: 'vision', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-900/30' },
  ];

  // Prepare duplicate list for smooth infinite scroll
  // We repeat the list enough times to ensure it covers a wide screen if the list is short
  const marqueeUniversities = universities.length > 0 
    ? [...universities, ...universities, ...universities, ...universities]
    : [];

  return (
    <div className="space-y-6 pb-10">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dash_title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('dash_welcome')}</p>
        </div>
        <Link to="/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-2">
           {t('btn_create')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('stat_active')}</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{activeSurveys.length}</h3>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('stat_responses')}</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">1,248</h3>
          </div>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('stat_satisfaction')}</p>
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">4.2<span className="text-sm text-slate-400 font-normal">/5</span></h3>
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('stat_attention')}</p>
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">2</h3>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity / Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('trend_title')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={participationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: 'rgba(241, 245, 249, 0.5)'}}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1e293b', 
                    color: '#fff' 
                  }}
                />
                <Bar dataKey="responses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Surveys List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('recent_surveys')}</h3>
           <div className="space-y-4">
             {surveys.slice(0, 3).map(survey => (
               <div key={survey.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{survey.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      survey.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>{survey.status === 'ACTIVE' ? t('status_active') : t('status_draft')}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{survey.description.substring(0, 50)}...</p>
                  <div className="flex gap-3 text-xs">
                     <Link to={`/analyze/${survey.id}`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        {t('btn_analytics')}
                     </Link>
                     <span className="text-slate-300 dark:text-slate-600">|</span>
                     <Link to={`/take/${survey.id}`} className="text-slate-600 dark:text-slate-400 hover:underline group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {t('btn_preview')}
                     </Link>
                     <span className="text-slate-300 dark:text-slate-600">|</span>
                     <Link to={`/list`} className="text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        {t('btn_manage')}
                     </Link>
                  </div>
               </div>
             ))}
             {surveys.length === 0 && (
               <div className="text-center py-8 text-slate-400 text-sm">{t('no_surveys')}</div>
             )}
           </div>
        </div>
      </div>

      {/* Registered Institutions Section (Marquee) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-500" />
                {t('univ_title')}
            </h3>
            <Link to="/universities" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                {t('link_univ_manage')} <ArrowRight className="w-3 h-3" />
            </Link>
        </div>
        
        {universities.length === 0 ? (
            <div className="col-span-full text-center py-6 text-slate-400 text-sm">
                {t('univ_empty')}
            </div>
        ) : (
            <div className="relative w-full group">
                 {/* Fading Edges */}
                 <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-slate-800 to-transparent z-10 pointer-events-none"></div>
                 <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-slate-800 to-transparent z-10 pointer-events-none"></div>
                 
                 <div className="flex animate-marquee w-max gap-4 hover:pause">
                      {/* Need two sets of identical content for seamless loop when translating -50% */}
                      {/* Set 1 */}
                      <div className="flex gap-4">
                         {marqueeUniversities.map((u, i) => (
                             <div key={`orig-${u.id}-${i}`} className="flex items-center gap-3 p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 w-64 flex-shrink-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${u.logoColor || 'bg-blue-100'} text-slate-700 dark:text-slate-800`}>
                                    <School className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{u.name}</h4>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{u.region}</div>
                                </div>
                             </div>
                         ))}
                      </div>
                      
                      {/* Set 2 (Duplicate) */}
                      <div className="flex gap-4">
                         {marqueeUniversities.map((u, i) => (
                             <div key={`copy-${u.id}-${i}`} className="flex items-center gap-3 p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 w-64 flex-shrink-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${u.logoColor || 'bg-blue-100'} text-slate-700 dark:text-slate-800`}>
                                    <School className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{u.name}</h4>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{u.region}</div>
                                </div>
                             </div>
                         ))}
                      </div>
                 </div>
            </div>
        )}
      </div>

      {/* Analysis Methods Overview */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
             <BrainCircuit className="w-5 h-5 text-slate-500" />
             {t('method_select')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
           {analysisMethods.map((method) => {
             const Icon = method.icon;
             return (
               <div key={method.id} className={`p-4 rounded-xl border ${method.border} hover:shadow-md transition-shadow`}>
                  <div className={`w-10 h-10 ${method.bg} ${method.color} rounded-lg flex items-center justify-center mb-3`}>
                     <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">{t(`method_${method.id}`)}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                     {t(`desc_method_${method.id}`)}
                  </p>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};