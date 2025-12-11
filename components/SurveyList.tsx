import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Survey, SurveyResponse, University } from '../types';
import { Calendar, Users, ArrowRight, Share2, Pencil, Eye, BarChart3, School, PlayCircle, StopCircle, RefreshCcw, Activity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ShareDialog } from './ShareDialog';

interface SurveyListProps {
  surveys: Survey[];
  responses: SurveyResponse[];
  universities: University[];
  onUpdateSurvey?: (survey: Survey) => void;
}

export const SurveyList: React.FC<SurveyListProps> = ({ surveys, responses, universities, onUpdateSurvey }) => {
  const { t } = useLanguage();
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [filterUnivId, setFilterUnivId] = useState<string>('');

  const filteredSurveys = surveys.filter(s => filterUnivId ? s.universityId === filterUnivId : true);

  const handleStatusChange = (survey: Survey, newStatus: 'ACTIVE' | 'COMPLETED' | 'DRAFT') => {
    if (onUpdateSurvey) {
        onUpdateSurvey({ ...survey, status: newStatus });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('survey_list_title')}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t('survey_list_desc')}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-slate-400" />
            <select
                value={filterUnivId}
                onChange={(e) => setFilterUnivId(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
                <option value="">{t('filter_all')}</option>
                {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredSurveys.map(survey => {
            const responseCount = responses.filter(r => r.surveyId === survey.id).length;
            const univ = universities.find(u => u.id === survey.universityId);
            
            return (
              <div key={survey.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Info Section */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${survey.status === 'ACTIVE' ? 'bg-green-500 ring-2 ring-green-100 dark:ring-green-900' : survey.status === 'COMPLETED' ? 'bg-slate-500' : 'bg-orange-300'}`}></span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{survey.title}</h3>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                      <span>{new Date(survey.createdAt).toLocaleDateString()}</span>
                    </div>
                    {univ && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full flex items-center gap-1">
                            <School className="w-3 h-3" />
                            {univ.name}
                        </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{survey.description}</p>
                </div>
                
                {/* Participation Status Section */}
                <div className="flex flex-col justify-center items-start md:items-end min-w-[120px] px-4 py-2 border-l border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{t('lbl_participation')}</span>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{responseCount}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{t('count_responses')}</span>
                  </div>
                </div>

                {/* Status Toggle Actions */}
                <div className="flex flex-col items-end gap-2 px-2 min-w-[100px] justify-center">
                   {survey.status === 'DRAFT' && (
                       <button 
                        onClick={() => handleStatusChange(survey, 'ACTIVE')}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors w-full justify-center"
                       >
                           <PlayCircle className="w-3.5 h-3.5" />
                           {t('btn_start_survey')}
                       </button>
                   )}
                   {survey.status === 'ACTIVE' && (
                       <button 
                        onClick={() => handleStatusChange(survey, 'COMPLETED')}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm transition-colors w-full justify-center animate-pulse"
                        title="Click to stop"
                       >
                           <Activity className="w-3.5 h-3.5" />
                           {t('btn_end_survey')} {/* Maps to "설문중" */}
                       </button>
                   )}
                   {survey.status === 'COMPLETED' && (
                       <button 
                        onClick={() => handleStatusChange(survey, 'ACTIVE')}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors w-full justify-center"
                       >
                           <PlayCircle className="w-3.5 h-3.5" />
                           {t('btn_restart_survey')} {/* Maps to "설문시작" */}
                       </button>
                   )}
                </div>

                {/* Actions Section */}
                <div className="flex flex-wrap gap-2 items-center border-l pl-4 border-slate-100 dark:border-slate-700">
                  <Link 
                    to={`/take/${survey.id}`}
                    className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    title={t('btn_preview')}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden lg:inline">{t('btn_preview')}</span>
                  </Link>
                  
                  <Link 
                    to={`/edit/${survey.id}`}
                    className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    title={t('btn_edit')}
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="hidden lg:inline">{t('btn_edit')}</span>
                  </Link>
                  
                  <button
                    onClick={() => setSharingId(survey.id)}
                    className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    title={t('btn_share')}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden lg:inline">{t('btn_share')}</span>
                  </button>
                  
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                  <Link 
                    to={`/analyze/${survey.id}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <span className="hidden sm:inline">{t('btn_analytics')}</span>
                    <span className="sm:hidden">Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredSurveys.length === 0 && (
             <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
               <p className="text-slate-500 dark:text-slate-400 mb-4">{t('no_surveys')}</p>
               <Link to="/create" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">{t('create_first')}</Link>
             </div>
          )}
        </div>
      </div>
      
      {sharingId && (
        <ShareDialog 
          isOpen={!!sharingId} 
          onClose={() => setSharingId(null)} 
          surveyId={sharingId} 
        />
      )}
    </>
  );
};