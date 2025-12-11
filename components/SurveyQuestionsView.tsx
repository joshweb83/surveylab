import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Survey } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './Button';
import { ArrowLeft, FileText, Download, LayoutTemplate } from 'lucide-react';

interface SurveyQuestionsViewProps {
  surveys: Survey[];
}

export const SurveyQuestionsView: React.FC<SurveyQuestionsViewProps> = ({ surveys }) => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const survey = surveys.find(s => s.id === id);

  if (!survey) return <div className="p-8 text-slate-500 dark:text-slate-400">Survey not found</div>;

  const handleExportCSV = () => {
      // Headers
      const headers = [t('col_question'), t('col_type'), t('col_options')];
      
      // Data
      const rows = survey.questions.map(q => {
          const text = `"${q.text.replace(/"/g, '""')}"`;
          const type = q.type;
          const options = q.options ? `"${q.options.join(', ').replace(/"/g, '""')}"` : '';
          return [text, type, options].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${survey.title}_questions.csv`);
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
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t('questions_sheet_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t('questions_sheet_desc')}</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
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
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 w-12">#</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 min-w-[300px]">{t('col_question')}</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 w-40">{t('col_type')}</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">{t('col_options')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {survey.questions.map((q, idx) => (
                  <tr key={q.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${q.type === 'SECTION' ? 'bg-slate-50 dark:bg-slate-900/50' : ''}`}>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {idx + 1}
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">
                        {q.type === 'SECTION' ? (
                            <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <LayoutTemplate className="w-4 h-4" />
                                {q.text}
                            </span>
                        ) : (
                            q.text
                        )}
                    </td>
                    <td className="px-6 py-4">
                        {q.type !== 'SECTION' && (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {q.type.replace('_', ' ')}
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {q.options && q.options.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {q.options.map((opt, i) => (
                                    <span key={i} className="px-2 py-0.5 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs">
                                        {opt}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};