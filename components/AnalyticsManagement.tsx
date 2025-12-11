import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Survey, SurveyResponse, QuestionType, AnalysisMethod, University, Question } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, BarChart2, Calendar, BrainCircuit, Check, PieChart, School, Upload, FileUp } from 'lucide-react';
import { Button } from './Button';

interface AnalyticsManagementProps {
  surveys: Survey[];
  responses: SurveyResponse[];
  universities: University[];
  onImportData?: (survey: Survey, responses: SurveyResponse[]) => void;
}

export const AnalyticsManagement: React.FC<AnalyticsManagementProps> = ({ surveys, responses, universities, onImportData }) => {
  const { t } = useLanguage();
  const [filterUnivId, setFilterUnivId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const filteredSurveys = surveys.filter(s => filterUnivId ? s.universityId === filterUnivId : true);

  // Helper to calculate score and prepare display data
  const chartData = filteredSurveys.map(s => {
    const sResponses = responses.filter(r => r.surveyId === s.id);
    
    // Try to find a sentiment score from AI history
    let score = 0;
    const latestAnalysis = s.analysisHistory && s.analysisHistory.length > 0 ? s.analysisHistory[0] : null;
    
    // Get unique analysis methods performed
    const methodsPerformed = s.analysisHistory 
        ? Array.from(new Set(s.analysisHistory.map(h => h.method)))
        : [];

    if (latestAnalysis?.sentimentScore) {
      score = latestAnalysis.sentimentScore; // 0-100
    } else {
      // Fallback: Calculate average of all Likert questions normalized to 100
      const likertQuestions = s.questions.filter(q => q.type === QuestionType.LIKERT);
      if (likertQuestions.length > 0 && sResponses.length > 0) {
        let totalSum = 0;
        let totalCount = 0;
        sResponses.forEach(r => {
          likertQuestions.forEach(q => {
             const val = r.answers[q.id];
             if (typeof val === 'number') {
               totalSum += val;
               totalCount++;
             }
          });
        });
        if (totalCount > 0) {
          const avg = totalSum / totalCount; // 1-5
          score = (avg / 5) * 100;
        }
      }
    }

    const universityName = universities.find(u => u.id === s.universityId)?.name;

    return {
      name: s.title,
      score: Math.round(score),
      responses: sResponses.length,
      id: s.id,
      lastAnalysis: latestAnalysis,
      methodsPerformed,
      createdAt: s.createdAt,
      universityName,
      source: s.source
    };
  });

  // Sort by created date desc
  chartData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImportData) return;

      setIsImporting(true);
      const reader = new FileReader();
      
      reader.onload = (event) => {
          try {
              const text = event.target?.result as string;
              processCSV(text, file.name);
          } catch (err) {
              console.error(err);
              alert(t('import_error'));
          } finally {
              setIsImporting(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      
      reader.readAsText(file);
  };

  const processCSV = (csvText: string, fileName: string) => {
      // Basic CSV Parser (Assumes simple structure, no multiline quoted fields for demo)
      const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
          alert("CSV must have at least a header row and one data row.");
          return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')); // Remove quotes
      const dataRows = lines.slice(1);

      // 1. Generate Survey ID & Basic Info
      const surveyId = Math.random().toString(36).substr(2, 9);
      const surveyTitle = fileName.replace('.csv', '');
      
      // 2. Determine Question Types based on first data row
      const firstRowValues = dataRows[0].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const questions: Question[] = headers.map((header, index) => {
          const sampleValue = firstRowValues[index];
          let type = QuestionType.OPEN_ENDED;
          
          // Heuristic: If value is number 1-5, assume Likert
          if (/^[1-5]$/.test(sampleValue)) {
              type = QuestionType.LIKERT;
          }
          
          return {
              id: `q${index}`,
              text: header,
              type: type,
              options: []
          };
      });

      // 3. Create Survey Object
      const newSurvey: Survey = {
          id: surveyId,
          title: `[External] ${surveyTitle}`,
          description: "Imported from external CSV data.",
          createdAt: new Date().toISOString(),
          status: 'COMPLETED',
          questions: questions,
          analysisHistory: [],
          source: 'EXTERNAL'
      };

      // 4. Create Response Objects
      const newResponses: SurveyResponse[] = dataRows.map(row => {
          const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const answers: Record<string, string | number> = {};
          
          questions.forEach((q, idx) => {
              if (idx < values.length) {
                  const val = values[idx];
                  if (q.type === QuestionType.LIKERT) {
                      answers[q.id] = parseInt(val) || 0;
                  } else {
                      answers[q.id] = val;
                  }
              }
          });

          return {
              id: Math.random().toString(36).substr(2, 9),
              surveyId: surveyId,
              answers: answers,
              submittedAt: new Date().toISOString()
          };
      });

      if (onImportData) {
          onImportData(newSurvey, newResponses);
          alert(t('import_success'));
      }
  };

  // Method Badge Helper
  const MethodBadge: React.FC<{ method: AnalysisMethod }> = ({ method }) => {
    let label = t(`method_${method.toLowerCase()}`);
    // Shorten labels for badges
    if (method === AnalysisMethod.BASIC) label = "종합";
    if (method === AnalysisMethod.IPA) label = "IPA";
    if (method === AnalysisMethod.BOXPLOT) label = "통계";
    if (method === AnalysisMethod.MCA) label = "MCA";
    if (method === AnalysisMethod.DEMOGRAPHIC) label = "응답자";

    const colors = {
        [AnalysisMethod.BASIC]: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        [AnalysisMethod.IPA]: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        [AnalysisMethod.BOXPLOT]: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        [AnalysisMethod.MCA]: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        [AnalysisMethod.DEMOGRAPHIC]: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border border-transparent ${colors[method] || "bg-gray-100 text-gray-700"}`}>
            {label}
        </span>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".csv" 
        className="hidden" 
        onChange={handleFileUpload} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {t('analytics_mgmt_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{t('analytics_mgmt_desc')}</p>
        </div>

        <div className="flex items-center gap-2">
            {onImportData && (
                <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline" 
                    className="flex items-center gap-2 mr-2"
                    isLoading={isImporting}
                >
                    <FileUp className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('btn_import_external')}</span>
                </Button>
            )}

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

      {/* Overview Chart */}
      {filteredSurveys.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-slate-500" />
                {t('lbl_overall_trend')} <span className="text-sm font-normal text-slate-400">(0-100 Scale)</span>
            </h3>
            <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} strokeOpacity={0.3} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score > 70 ? '#10b981' : entry.score > 40 ? '#f59e0b' : '#ef4444'} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>
      )}

      {/* Detailed List */}
      <div className="grid gap-4">
        {chartData.map((item) => (
           <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-300 dark:hover:border-blue-500 transition-colors group">
              {/* Info */}
              <div className="flex-1 space-y-2 text-center md:text-left w-full md:w-auto">
                 <div className="flex items-center justify-center md:justify-start gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[300px]" title={item.name}>{item.name}</h3>
                    {item.universityName && (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                            {item.universityName}
                        </span>
                    )}
                    {item.source === 'EXTERNAL' && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-700">
                            {t('tag_external')}
                        </span>
                    )}
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded">
                       <BarChart2 className="w-4 h-4" /> {item.responses} Responses
                    </span>
                    {item.lastAnalysis ? (
                       <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                          <Check className="w-3.5 h-3.5" /> Analyzed: {new Date(item.lastAnalysis.createdAt).toLocaleDateString()}
                       </span>
                    ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">No analysis yet</span>
                    )}
                 </div>

                 {/* Analysis Badges */}
                 {item.methodsPerformed.length > 0 && (
                     <div className="flex flex-wrap gap-1 mt-2 justify-center md:justify-start">
                         {item.methodsPerformed.map(method => <MethodBadge key={method} method={method} />)}
                     </div>
                 )}
              </div>

              {/* Score Badge */}
              <div className="flex flex-col items-center justify-center px-6 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg min-w-[120px] border border-slate-100 dark:border-slate-700">
                 <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{t('score_label')}</span>
                 <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${item.score > 70 ? 'text-green-500' : item.score > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {item.score}
                    </span>
                    <span className="text-sm text-slate-300 dark:text-slate-600">/100</span>
                 </div>
              </div>

              {/* Action */}
              <Link to={`/analyze/${item.id}`} className="w-full md:w-auto">
                 <Button className="w-full md:w-auto bg-blue-600 !text-white hover:bg-blue-700 border-2 border-transparent shadow-sm flex items-center justify-center">
                    {t('btn_go_analyze')} <ArrowRight className="w-4 h-4 ml-1 text-white" />
                 </Button>
              </Link>
           </div>
        ))}

        {filteredSurveys.length === 0 && (
           <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
               {t('no_surveys')}
           </div>
        )}
      </div>
    </div>
  );
};