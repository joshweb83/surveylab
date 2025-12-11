import React, { useState } from 'react';
import { Survey, SurveyResponse, PrizeDrawRecord, University } from '../types';
import { Button } from './Button';
import { Gift, Trophy, Users, Clock, Trash2, ChevronRight, School } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrizeManagementProps {
  surveys: Survey[];
  responses: SurveyResponse[];
  history: PrizeDrawRecord[];
  universities: University[];
  onSaveRecord: (record: PrizeDrawRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const PrizeManagement: React.FC<PrizeManagementProps> = ({ surveys, responses, history, universities, onSaveRecord, onDeleteRecord }) => {
  const { t } = useLanguage();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [filterUnivId, setFilterUnivId] = useState<string>('');
  const [winnerCount, setWinnerCount] = useState(1);
  const [prizeName, setPrizeName] = useState('');
  const [currentDraw, setCurrentDraw] = useState<PrizeDrawRecord | null>(null);

  // Filter available surveys based on university filter
  const filteredSurveys = surveys.filter(s => filterUnivId ? s.universityId === filterUnivId : true);

  // Filter history based on university filter
  const filteredHistory = history.filter(h => {
    if (!filterUnivId) return true;
    const survey = surveys.find(s => s.id === h.surveyId);
    return survey?.universityId === filterUnivId;
  });

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);
  const surveyResponses = responses.filter(r => r.surveyId === selectedSurveyId);

  const handlePrizeDraw = () => {
    if (surveyResponses.length === 0 || !selectedSurvey) return;
    
    const shuffled = [...surveyResponses].sort(() => 0.5 - Math.random());
    const count = Math.min(winnerCount, surveyResponses.length);
    const winners = shuffled.slice(0, count);
    
    const newRecord: PrizeDrawRecord = {
        id: Math.random().toString(36).substr(2, 9),
        surveyId: selectedSurvey.id,
        surveyTitle: selectedSurvey.title,
        prizeName: prizeName,
        drawnAt: new Date().toISOString(),
        winnerCount: count,
        winners: winners
    };

    setCurrentDraw(newRecord);
    onSaveRecord(newRecord); // Auto save to history
  };

  const handleSurveyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSurveyId(e.target.value);
    setCurrentDraw(null);
  };

  const viewHistoryRecord = (record: PrizeDrawRecord) => {
      setCurrentDraw(record);
  };

  return (
    <div className="space-y-6 h-full min-h-[calc(100vh-100px)]">
      
      {/* Page Header with Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="w-8 h-8 text-orange-500" />
                {t('draw_title')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{t('draw_desc')}</p>
        </div>
        <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-slate-400" />
            <select
                value={filterUnivId}
                onChange={(e) => {
                    setFilterUnivId(e.target.value);
                    setSelectedSurveyId(''); // Reset selection when filter changes
                    setCurrentDraw(null);
                }}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
                <option value="">{t('filter_all')}</option>
                {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content (Left) */}
        <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Selection & Controls */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('label_select_survey')}</label>
                        <select
                        value={selectedSurveyId}
                        onChange={handleSurveyChange}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                        <option value="">{t('ph_select_survey')}</option>
                        {filteredSurveys.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                        </select>

                        {selectedSurvey && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('lbl_participation')}</p>
                                <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    {surveyResponses.length} {t('count_responses')}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('label_prize_name')}</label>
                            <input 
                                type="text" 
                                value={prizeName}
                                onChange={(e) => setPrizeName(e.target.value)}
                                placeholder={t('ph_prize_name')}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('label_winner_count')}</label>
                            <input 
                                type="number" 
                                min="1" 
                                max={Math.max(1, surveyResponses.length)} 
                                value={winnerCount}
                                disabled={!selectedSurveyId || surveyResponses.length === 0}
                                onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                            />
                        </div>

                        <Button 
                            onClick={handlePrizeDraw} 
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white border-none py-3"
                            disabled={!selectedSurveyId || surveyResponses.length === 0}
                        >
                            <Trophy className="w-5 h-5" />
                            {t('btn_draw_start')}
                        </Button>
                    </div>
                </div>

                {/* Results Area */}
                <div className="md:col-span-2">
                <div className={`
                    p-6 rounded-xl border min-h-[400px] transition-colors
                    ${currentDraw 
                        ? 'bg-gradient-to-br from-orange-50 to-pink-50 dark:from-slate-800 dark:to-slate-800 border-orange-100 dark:border-slate-700' 
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 border-dashed'}
                `}>
                    {currentDraw ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-400 flex items-center justify-center gap-2 mb-2">
                                    <span>🎉</span> {t('draw_winners_title')} <span>🎉</span>
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {currentDraw.surveyTitle} 
                                    {currentDraw.prizeName && <span className="font-bold text-orange-600 dark:text-orange-400 mx-1"> - {currentDraw.prizeName}</span>}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">{new Date(currentDraw.drawnAt).toLocaleString()}</p>
                            </div>
                        
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {currentDraw.winners.map((w, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-orange-100 dark:border-slate-600 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 flex items-center justify-center font-bold text-sm">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{w.id}</div>
                                                <div className="text-xs text-slate-400 dark:text-slate-400">{new Date(w.submittedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <Trophy className="w-4 h-4 text-orange-400" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 space-y-4">
                            <Gift className="w-16 h-16 opacity-20" />
                            <p>
                                {!selectedSurveyId 
                                    ? t('draw_no_survey') 
                                    : surveyResponses.length === 0 
                                        ? t('draw_no_responses')
                                        : t('draw_desc')}
                            </p>
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>

        {/* Sidebar: History (Right) */}
        <div className="lg:w-80 flex-shrink-0 space-y-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-full max-h-[600px] flex flex-col">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    추첨 이력
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredHistory.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-8">
                            저장된 추첨 이력이 없습니다.
                        </p>
                    ) : (
                        filteredHistory.map(record => (
                            <div 
                                key={record.id}
                                onClick={() => viewHistoryRecord(record)}
                                className={`p-3 rounded-lg border text-sm cursor-pointer transition-all group relative ${
                                    currentDraw?.id === record.id
                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50'
                                    : 'bg-white dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                            {record.surveyTitle}
                                        </div>
                                        {record.prizeName && (
                                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 font-medium truncate">
                                                {record.prizeName}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex justify-between items-center">
                                            <span>{new Date(record.drawnAt).toLocaleString()}</span>
                                            <span className="font-semibold text-slate-600 dark:text-slate-300 ml-2">{record.winnerCount}명</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteRecord(record.id); }}
                                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};