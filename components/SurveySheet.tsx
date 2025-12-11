import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Survey, SurveyResponse } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './Button';
import { ArrowLeft, Download, Table as TableIcon } from 'lucide-react';

interface SurveySheetProps {
  surveys: Survey[];
  responses: SurveyResponse[];
}

export const SurveySheet: React.FC<SurveySheetProps> = ({ surveys, responses }) => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const survey = surveys.find(s => s.id === id);
  const surveyResponses = responses.filter(r => r.surveyId === id);

  if (!survey) return <div className="p-8 text-slate-500 dark:text-slate-400">Survey not found</div>;

  const getAnswerText = (response: SurveyResponse, questionId: string): string => {
    const val = response.answers[questionId];
    if (Array.isArray(val)) return val.join(', ');
    if (val === undefined || val === null) return '-';
    return String(val);
  };

  const handleExportCSV = () => {
    // 1. Header Row
    const headers = [t('col_time'), ...survey.questions.map(q => `"${q.text.replace(/"/g, '""')}"`)];
    
    // 2. Data Rows
    const rows = surveyResponses.map(r => {
      const time = new Date(r.submittedAt).toLocaleString();
      const answers = survey.questions.map(q => {
        const text = getAnswerText(r, q.id);
        return `"${text.replace(/"/g, '""')}"`;
      });
      return [time, ...answers].join(',');
    });

    // 3. Combine
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // 4. Download
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel support
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${survey.title}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Link to={`/analyze/${survey.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {t('back_to_analytics')}
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TableIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t('sheet_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t('sheet_desc')}</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={surveyResponses.length === 0}>
          <Download className="w-4 h-4" />
          {t('btn_export_csv')}
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap w-48 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                  {t('col_time')}
                </th>
                {survey.questions.map(q => (
                  <th key={q.id} className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 min-w-[200px] max-w-[400px]">
                    <div className="truncate" title={q.text}>{q.text}</div>
                    <div className="text-xs font-normal text-slate-400 dark:text-slate-400 mt-1 uppercase">{q.type.replace('_', ' ')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {surveyResponses.length > 0 ? (
                surveyResponses.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 border-r border-slate-100 dark:border-slate-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                      {new Date(r.submittedAt).toLocaleString()}
                    </td>
                    {survey.questions.map(q => (
                      <td key={q.id} className="px-6 py-4 text-slate-700 dark:text-slate-300 align-top">
                        {getAnswerText(r, q.id)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={survey.questions.length + 1} className="px-6 py-12 text-center text-slate-400">
                    {t('no_responses_yet')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};