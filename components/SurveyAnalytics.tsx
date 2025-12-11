import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Survey, SurveyResponse, QuestionType, AIAnalysisResult, AnalysisMethod, University } from '../types';
import { analyzeSurveyResponses } from '../services/geminiService';
import { Button } from './Button';
import { BrainCircuit, Table as TableIcon, Trash2, FileDown, Loader2, Check, BarChart3, PieChart as PieIcon, Map, Users, FileText, ArrowLeft, FileQuestion, RotateCw, Info, ThumbsUp, ThumbsDown, Target, Lightbulb, Link as LinkIcon, AlertTriangle, Quote, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine, LabelList
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, ImageRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import saveAs from 'file-saver';

interface SurveyAnalyticsProps {
  surveys: Survey[];
  responses: SurveyResponse[];
  universities?: University[];
  onUpdateSurvey?: (survey: Survey) => void;
}

interface StatSummary {
  id: string;
  question: string;
  mean: number;
  stdDev: number;
  count: number;
  idx: number; // Question Number
}

// Order: Basic (Comprehensive) -> IPA -> Boxplot -> MCA -> Demographic -> Vision
const ANALYSIS_METHODS = [
  { type: AnalysisMethod.BASIC, icon: BrainCircuit },
  { type: AnalysisMethod.IPA, icon: Map },
  { type: AnalysisMethod.BOXPLOT, icon: BarChart3 },
  { type: AnalysisMethod.MCA, icon: PieIcon },
  { type: AnalysisMethod.DEMOGRAPHIC, icon: Users },
  { type: AnalysisMethod.VISION, icon: Target },
];

export const SurveyAnalytics: React.FC<SurveyAnalyticsProps> = ({ surveys, responses, universities = [], onUpdateSurvey }) => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const survey = surveys.find(s => s.id === id);
  const surveyResponses = responses.filter(r => r.surveyId === id);
  const university = universities.find(u => u.id === survey?.universityId);
  
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  
  // Track if we've initiated auto-analysis to prevent double triggering
  const autoAnalysisInitiated = useRef(false);

  // Refs for capturing
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const analysisTextRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const dataTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If analysis history exists, show the most recent one (even if it's pending)
    if (survey && survey.analysisHistory && survey.analysisHistory.length > 0 && !analysis) {
      setAnalysis(survey.analysisHistory[0]);
    } else if (survey && (!survey.analysisHistory || survey.analysisHistory.length === 0)) {
      setAnalysis(null);
    }
  }, [id, survey]);

  // Auto-run Basic Analysis if no history exists and there are responses
  useEffect(() => {
    if (
      survey && 
      surveyResponses.length > 0 && 
      (!survey.analysisHistory || survey.analysisHistory.length === 0) &&
      !autoAnalysisInitiated.current
    ) {
      autoAnalysisInitiated.current = true;
      handleMethodClick(AnalysisMethod.BASIC);
    }
  }, [survey, surveyResponses]);

  if (!survey) return <div>Survey not found</div>;

  // --- Statistics Calculation ---
  const calculateStats = (): StatSummary[] => {
    let questionCounter = 0;
    return survey.questions
      .map(q => {
          if(q.type !== QuestionType.LIKERT) return null;
          questionCounter++;
          const values: number[] = [];
          surveyResponses.forEach(r => {
            const val = r.answers[q.id];
            if (typeof val === 'number') values.push(val);
          });
          
          const count = values.length;
          if (count === 0) return { id: q.id, question: q.text, mean: 0, stdDev: 0, count: 0, idx: questionCounter };

          const mean = values.reduce((a, b) => a + b, 0) / count;
          const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
          const stdDev = Math.sqrt(variance);

          return {
            id: q.id,
            question: q.text,
            mean: parseFloat(mean.toFixed(2)),
            stdDev: parseFloat(stdDev.toFixed(2)),
            count,
            idx: questionCounter
          };
      })
      .filter((item): item is StatSummary => item !== null);
  };

  const stats = calculateStats();

  // --- Parallel Analysis Execution ---
  const handleMethodClick = async (method: AnalysisMethod) => {
    // Check Pre-requisites for Vision Analysis
    if (method === AnalysisMethod.VISION && (!university || !university.vision)) {
        // Instead of alerting (which might be blocked or ignored), generate a FAILED state immediately
        const tempId = Math.random().toString(36).substr(2, 9);
        const failedAnalysis: AIAnalysisResult = {
            id: tempId,
            createdAt: new Date().toISOString(),
            method: method,
            summary: t('vision_not_found_desc'),
            status: 'FAILED'
        };

        const currentHistory = survey.analysisHistory || [];
        const updatedHistory = [failedAnalysis, ...currentHistory];
        const updatedSurvey = { ...survey, analysisHistory: updatedHistory };

        if (onUpdateSurvey) {
            onUpdateSurvey(updatedSurvey);
        }
        setAnalysis(failedAnalysis);
        return;
    }

    // 1. Check if we already have this analysis
    const existingAnalysis = survey.analysisHistory?.find(h => h.method === method);

    // If it exists and is COMPLETED or PENDING, just view it.
    // If it is FAILED, we re-run it (Retry logic on tab click)
    if (existingAnalysis && existingAnalysis.status !== 'FAILED') {
        setAnalysis(existingAnalysis);
        return;
    }

    // 2. If not (or if failed), generate it
    if (surveyResponses.length === 0) {
        alert(t('alert_no_res'));
        autoAnalysisInitiated.current = false;
        return;
    }

    // Create a placeholder "Pending" Analysis
    const tempId = Math.random().toString(36).substr(2, 9);
    const pendingAnalysis: AIAnalysisResult = {
      id: tempId,
      createdAt: new Date().toISOString(),
      method: method,
      summary: "",
      status: 'PENDING'
    };

    // Update Survey State Immediately (Optimistic UI)
    const currentHistory = survey.analysisHistory || [];
    // Remove old failed analysis of same method if exists
    const filteredHistory = currentHistory.filter(h => h.method !== method);
    const updatedHistory = [pendingAnalysis, ...filteredHistory];
    
    const updatedSurvey = { ...survey, analysisHistory: updatedHistory };
    
    if (onUpdateSurvey) {
      onUpdateSurvey(updatedSurvey);
    }
    
    // Set view to this new pending item
    setAnalysis(pendingAnalysis);

    // Trigger Async Generation (Non-blocking)
    analyzeSurveyResponses(survey, surveyResponses, language, method, university).then((result) => {
      // On completion, update the specific item in history
      const finalAnalysis = { ...result, id: tempId, status: 'COMPLETED' as const };
      
      const finalizedHistory = updatedHistory.map(item => item.id === tempId ? finalAnalysis : item);
      const finalSurvey = { ...survey, analysisHistory: finalizedHistory };
      
      if (onUpdateSurvey) {
        onUpdateSurvey(finalSurvey);
      }
      
      setAnalysis(prev => prev && prev.id === tempId ? finalAnalysis : prev);
    }).catch(err => {
      // Handle Error State
      const failedAnalysis = { 
        ...pendingAnalysis, 
        summary: "Analysis generation failed.", 
        status: 'FAILED' as const 
      };
      const finalizedHistory = updatedHistory.map(item => item.id === tempId ? failedAnalysis : item);
      if (onUpdateSurvey) {
         onUpdateSurvey({ ...survey, analysisHistory: finalizedHistory });
      }
      setAnalysis(prev => prev && prev.id === tempId ? failedAnalysis : prev);
    });
  };

  const handleRefreshAnalysis = async () => {
    if (!analysis) return;
    const method = analysis.method;

    if (surveyResponses.length === 0) {
        alert(t('alert_no_res'));
        return;
    }

    // Check Vision requirement again for retry
    if (method === AnalysisMethod.VISION && (!university || !university.vision)) {
        alert(t('vision_not_found_desc'));
        return;
    }

    // 1. Create Pending State
    const tempId = Math.random().toString(36).substr(2, 9);
    const pendingAnalysis: AIAnalysisResult = {
      id: tempId,
      createdAt: new Date().toISOString(),
      method: method,
      summary: "",
      status: 'PENDING'
    };

    // 2. Optimistic Update: Replace current analysis with new pending one
    const currentHistory = survey.analysisHistory || [];
    const updatedHistory = [pendingAnalysis, ...currentHistory.filter(h => h.id !== analysis.id)];
    
    const updatedSurvey = { ...survey, analysisHistory: updatedHistory };
    if (onUpdateSurvey) {
      onUpdateSurvey(updatedSurvey);
    }
    setAnalysis(pendingAnalysis);

    // 3. API Call
    try {
        const result = await analyzeSurveyResponses(survey, surveyResponses, language, method, university);
        const finalAnalysis = { ...result, id: tempId, status: 'COMPLETED' as const };
        
        const finalizedHistory = updatedHistory.map(item => item.id === tempId ? finalAnalysis : item);
        const finalSurvey = { ...survey, analysisHistory: finalizedHistory };
        
        if (onUpdateSurvey) {
            onUpdateSurvey(finalSurvey);
        }
        setAnalysis(prev => prev && prev.id === tempId ? finalAnalysis : prev);
    } catch (err) {
        const failedAnalysis = { 
            ...pendingAnalysis, 
            summary: "Analysis generation failed.", 
            status: 'FAILED' as const 
        };
        const finalizedHistory = updatedHistory.map(item => item.id === tempId ? failedAnalysis : item);
        if (onUpdateSurvey) {
             onUpdateSurvey({ ...survey, analysisHistory: finalizedHistory });
        }
        setAnalysis(prev => prev && prev.id === tempId ? failedAnalysis : prev);
    }
  };

  // --- Export Functions ---
  const handleDownloadPDF = async () => {
    if (!analysis || !reportContainerRef.current) return;
    try {
      const canvas = await html2canvas(reportContainerRef.current, { scale: 1.5, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * (pdfWidth - margin * 2)) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = margin;
      let pageHeight = pdfHeight - margin * 2;

      pdf.addImage(imgData, 'PNG', margin, position, pdfWidth - margin * 2, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, margin - (imgHeight - heightLeft) - margin, pdfWidth - margin * 2, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${survey.title}_report.pdf`);
    } catch (err) {
      console.error("PDF error", err);
      alert("PDF generation failed");
    }
  };

  const handleDownloadWord = async () => {
    if (!analysis) return;
    try {
      let chartImageBlob: Blob | null = null;
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, { scale: 2 });
        chartImageBlob = await new Promise(resolve => canvas.toBlob(resolve));
      }

      const tableRows = [
        new TableRow({
          children: [t('col_question'), t('col_mean'), t('col_std_dev'), t('col_count')].map(text => 
            new TableCell({ children: [new Paragraph({ text, style: "strong" })], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { fill: "f3f4f6" } })
          )
        }),
        ...stats.map(s => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`Q${s.idx}. ${s.question}`)] }),
            new TableCell({ children: [new Paragraph(s.mean.toString())] }),
            new TableCell({ children: [new Paragraph(s.stdDev.toString())] }),
            new TableCell({ children: [new Paragraph(s.count.toString())] }),
          ]
        }))
      ];

      const children = [
        new Paragraph({ text: `${t('app_name')} Analysis Report`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: survey.title, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `Date: ${new Date().toLocaleDateString()}`, spacing: { after: 300 } }),
        new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ text: analysis.summary, spacing: { after: 300 } }),
      ];

      // Add Strengths/Weaknesses if available
      if (analysis.strengths) {
         children.push(new Paragraph({ text: t('report_strengths'), heading: HeadingLevel.HEADING_3 }));
         analysis.strengths.forEach(s => children.push(new Paragraph({ text: `• ${s}` })));
         children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      }
      if (analysis.weaknesses) {
        children.push(new Paragraph({ text: t('report_weaknesses'), heading: HeadingLevel.HEADING_3 }));
        analysis.weaknesses.forEach(w => children.push(new Paragraph({ text: `• ${w}` })));
        children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
     }

      const recs = analysis.improvementStrategies || analysis.recommendations;
      if (recs) {
        children.push(new Paragraph({ text: "Strategic Recommendations", heading: HeadingLevel.HEADING_3 }));
        recs.forEach(rec => children.push(new Paragraph({ text: `• ${rec}` })));
        children.push(new Paragraph({ text: "", spacing: { after: 300 } }));
      }

      if (chartImageBlob) {
        children.push(new Paragraph({ text: "Visual Analysis", heading: HeadingLevel.HEADING_3 }));
        const buffer = await chartImageBlob.arrayBuffer();
        children.push(new Paragraph({
          children: [new ImageRun({ data: buffer, transformation: { width: 500, height: 300 } })],
          spacing: { after: 300 }
        }));
      }

      children.push(new Paragraph({ text: t('table_summary_title'), heading: HeadingLevel.HEADING_3 }));
      children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${survey.title}_analysis.docx`);
    } catch (err) {
      console.error("Word error", err);
      alert("Word generation failed");
    }
  };

  // --- Render Helpers ---
  const renderBasicAnalysis = (res: AIAnalysisResult) => (
    <div ref={analysisTextRef} className="space-y-6 mb-6">
      
      {/* 1. Executive Summary & Sentiment */}
      <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-white dark:bg-slate-700 p-5 rounded-lg border border-slate-100 dark:border-slate-600 shadow-sm">
             <h3 className="text-sm font-bold uppercase text-indigo-500 mb-3 flex items-center gap-2">
                 <FileText className="w-4 h-4" /> {t('label_overview')}
             </h3>
             <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-sm whitespace-pre-line">{res.summary}</p>
          </div>
          
          <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-700/50 p-5 rounded-lg border border-slate-100 dark:border-slate-600 flex flex-col justify-center">
             {res.sentimentScore !== undefined && (
               <div className="text-center">
                  <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">{t('label_sentiment')}</h3>
                  <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200 dark:text-slate-600" />
                          <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                  strokeDasharray={351.86} 
                                  strokeDashoffset={351.86 - (351.86 * res.sentimentScore) / 100} 
                                  className={`${res.sentimentScore > 70 ? 'text-green-500' : res.sentimentScore > 40 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`} />
                      </svg>
                      <span className="absolute text-3xl font-bold text-slate-800 dark:text-white">{res.sentimentScore}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Index Score (0-100)</p>
               </div>
             )}
          </div>
      </div>

      {/* 2. Strengths & Weaknesses Grid (Professional Report Style) */}
      {(res.strengths || res.weaknesses) && (
          <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-green-50/50 dark:bg-green-900/10 p-5 rounded-lg border border-green-100 dark:border-green-900/30">
                  <h3 className="text-sm font-bold uppercase text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" /> {t('report_strengths')}
                  </h3>
                  <ul className="space-y-2">
                      {res.strengths?.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                          </li>
                      ))}
                  </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-red-50/50 dark:bg-red-900/10 p-5 rounded-lg border border-red-100 dark:border-red-900/30">
                  <h3 className="text-sm font-bold uppercase text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4" /> {t('report_weaknesses')}
                  </h3>
                   <ul className="space-y-2">
                      {res.weaknesses?.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <Target className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      )}

      {/* 3. Detailed Diagnosis */}
      {res.comprehensiveDiagnosis && (
          <div className="bg-white dark:bg-slate-700 p-5 rounded-lg border border-slate-100 dark:border-slate-600 shadow-sm">
             <h3 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                 <BrainCircuit className="w-4 h-4" /> {t('report_diagnosis')}
             </h3>
             <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line border-l-4 border-indigo-200 dark:border-indigo-500 pl-4">
                 {res.comprehensiveDiagnosis}
             </p>
          </div>
      )}

      {/* 4. Strategic Action Plan */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <h3 className="text-sm font-bold uppercase text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> {t('report_strategy')}
          </h3>
          <div className="space-y-3">
             {(res.improvementStrategies || res.recommendations || []).map((rec, i) => (
                 <div key={i} className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-blue-50 dark:border-slate-600">
                     <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-bold shrink-0">
                         {i + 1}
                     </span>
                     <p className="text-sm text-slate-700 dark:text-slate-300">{rec}</p>
                 </div>
             ))}
          </div>
      </div>
      
      {/* 5. Key Themes (Tags) */}
      {res.keyThemes && (
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">{t('label_themes')}</h3>
            <div className="flex flex-wrap gap-2">
              {res.keyThemes.map((theme, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-full text-xs font-semibold">
                  #{theme}
                </span>
              ))}
            </div>
          </div>
      )}
    </div>
  );

  const renderIPA = (res: AIAnalysisResult) => {
    if (!res.ipaData) return null;
    return (
      <div className="space-y-4">
        <div ref={analysisTextRef}>
           <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm">{res.summary}</p>
        </div>
        <div ref={chartRef} className="h-96 w-full bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
           <ResponsiveContainer width="100%" height="100%">
             <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
               <CartesianGrid />
               <XAxis type="number" dataKey="performance" name="Performance" domain={[0, 5]} label={{ value: t('chart_performance'), position: 'bottom', offset: 20, fill: '#64748b' }} />
               <YAxis type="number" dataKey="importance" name="Importance" domain={[0, 5]} label={{ value: t('chart_importance'), angle: -90, position: 'insideLeft', offset: -10, fill: '#64748b' }} />
               <ZAxis type="number" range={[100, 100]} />
               <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }} />
               <ReferenceLine x={2.5} stroke="gray" strokeDasharray="3 3" />
               <ReferenceLine y={2.5} stroke="gray" strokeDasharray="3 3" />
               <ReferenceLine x={4.5} y={4.5} stroke="none" label={{ value: t('chart_quadrant_1'), fill: '#10b981', fontSize: 12, fontWeight: 'bold' }} />
               <ReferenceLine x={0.5} y={4.5} stroke="none" label={{ value: t('chart_quadrant_2'), fill: '#f59e0b', fontSize: 12, fontWeight: 'bold' }} />
               <ReferenceLine x={0.5} y={0.5} stroke="none" label={{ value: t('chart_quadrant_3'), fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
               <ReferenceLine x={4.5} y={0.5} stroke="none" label={{ value: t('chart_quadrant_4'), fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }} />
               
               <Scatter name="Attributes" data={res.ipaData} fill="#3b82f6">
                  {res.ipaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.performance < 2.5 && entry.importance > 2.5 ? '#ef4444' : '#3b82f6'} />
                  ))}
                  <LabelList dataKey="label" position="top" style={{ fontSize: '10px', fill: '#64748b' }} />
               </Scatter>
             </ScatterChart>
           </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderBoxPlot = (res: AIAnalysisResult) => {
    if (!res.boxPlotData) return null;
    return (
      <div className="space-y-4">
         <div ref={analysisTextRef}>
           <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm">{res.summary}</p>
         </div>
         <div ref={chartRef} className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
             <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">{t('chart_boxplot_y')}</h4>
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2">Min</th>
                        <th className="px-4 py-2">Q1</th>
                        <th className="px-4 py-2">Median</th>
                        <th className="px-4 py-2">Q3</th>
                        <th className="px-4 py-2">Max</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {res.boxPlotData.map((row, i) => (
                        <tr key={i}>
                            <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{row.label}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{row.min}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{row.q1}</td>
                            <td className="px-4 py-2 font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">{row.median}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{row.q3}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{row.max}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
         </div>
      </div>
    );
  };

  const renderMCA = (res: AIAnalysisResult) => {
      if (!res.mcaData) return null;
      return (
        <div className="space-y-4">
            <div ref={analysisTextRef}>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm">{res.summary}</p>
            </div>
            <div ref={chartRef} className="h-96 w-full bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="Dimension 1" label={{ value: t('chart_mca_x'), position: 'bottom', offset: 0, fill: '#64748b' }} />
                <YAxis type="number" dataKey="y" name="Dimension 2" label={{ value: t('chart_mca_y'), angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }} />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <ReferenceLine x={0} stroke="#cbd5e1" />
                <Scatter name="Points" data={res.mcaData} fill="#8884d8">
                    {res.mcaData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.category === 'Demographics' ? '#f472b6' : '#818cf8'} />
                    ))}
                    <LabelList dataKey="label" position="top" style={{ fontSize: '10px', fill: '#475569' }} />
                </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
            </div>
        </div>
      );
  };

  const renderDemographic = (res: AIAnalysisResult) => {
      if (!res.demographicInsights) return null;
      return (
          <div className="space-y-4">
             <div ref={analysisTextRef}>
               <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm">{res.summary}</p>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> User Segmentation
                </h4>
                <ul className="space-y-2">
                    {res.demographicInsights.map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2 shrink-0"></span>
                            {item}
                        </li>
                    ))}
                </ul>
             </div>
          </div>
      );
  };

  const renderVisionAnalysis = (res: AIAnalysisResult) => {
      if (!res.visionAnalysis) return null;
      return (
          <div className="space-y-6">
              {/* Target Vision Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-xl border border-indigo-100 dark:border-slate-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Target className="w-32 h-32 text-indigo-500" />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                      <div className="flex-1">
                         <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                             <Quote className="w-5 h-5 fill-current opacity-50" />
                             <p className="text-xs font-bold uppercase tracking-wider">{t('lbl_vision_text')}</p>
                         </div>
                         <p className="text-lg font-serif italic text-slate-700 dark:text-slate-200 leading-relaxed pl-2 border-l-4 border-indigo-400 dark:border-indigo-600">
                             "{university?.vision || 'N/A'}"
                         </p>
                      </div>
                      
                      <div className="flex flex-col items-center bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-indigo-100 dark:border-slate-600 shadow-sm min-w-[120px]">
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{t('lbl_alignment_score')}</p>
                          <div className="relative inline-flex items-center justify-center">
                              <svg className="w-20 h-20 transform -rotate-90">
                                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200 dark:text-slate-700" />
                                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" 
                                          strokeDasharray={213.5} 
                                          strokeDashoffset={213.5 - (213.5 * res.visionAnalysis.alignmentScore) / 100} 
                                          strokeLinecap="round"
                                          className={`${res.visionAnalysis.alignmentScore > 75 ? 'text-green-500' : res.visionAnalysis.alignmentScore > 50 ? 'text-blue-500' : 'text-orange-500'} transition-all duration-1000 ease-out`} />
                              </svg>
                              <span className="absolute text-xl font-bold text-slate-800 dark:text-white">{res.visionAnalysis.alignmentScore}</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div ref={analysisTextRef} className="space-y-6">
                 {/* Detailed Summary */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Vision Alignment Summary
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm leading-relaxed border-l-4 border-slate-200 dark:border-slate-600 pl-4">
                        {res.visionAnalysis.alignmentSummary}
                    </p>
                 </div>

                 {/* Aligned vs Gap Areas Grid */}
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50/50 dark:bg-green-900/10 p-5 rounded-lg border border-green-100 dark:border-green-900/30">
                        <h4 className="text-sm font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                           <LinkIcon className="w-4 h-4" /> Aligned Areas (Strengths)
                        </h4>
                        <ul className="space-y-3">
                            {res.visionAnalysis.alignedAreas.map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded border border-green-50 dark:border-slate-700 shadow-sm">
                                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="bg-red-50/50 dark:bg-red-900/10 p-5 rounded-lg border border-red-100 dark:border-red-900/30">
                        <h4 className="text-sm font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                           <AlertTriangle className="w-4 h-4" /> Gap Areas (Misalignment)
                        </h4>
                        <ul className="space-y-3">
                            {res.visionAnalysis.gapAreas.map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded border border-red-50 dark:border-slate-700 shadow-sm">
                                    <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <Target className="w-3 h-3" />
                                    </div>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                 </div>
              </div>
          </div>
      );
  };

  const currentMethod = analysis?.method || AnalysisMethod.BASIC;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
             <Link to="/list" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t('survey_list_title')}
             </Link>
             <span>/</span>
             <span className="truncate max-w-[200px]">{survey.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
             <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
             {t('ai_summary_title')}
          </h1>
        </div>
        
        <div className="flex gap-2">
            <Link to={`/sheet/${survey.id}`}>
                <Button variant="outline" className="h-10 text-xs">
                    <TableIcon className="w-4 h-4" />
                    {t('btn_view_sheet')}
                </Button>
            </Link>
            <Link to={`/questions/${survey.id}`}>
                <Button variant="outline" className="h-10 text-xs">
                    <FileQuestion className="w-4 h-4" />
                    {t('btn_view_questions')}
                </Button>
            </Link>
        </div>
      </div>

      {/* Main Analysis Area - Removed sidebar flex layout, using block stack */}
      <div className="space-y-8">
         {/* Analysis Content */}
         <div className="w-full">
            
            {/* Analysis Method Tabs */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    {ANALYSIS_METHODS.map((m) => {
                        const Icon = m.icon;
                        const isActive = analysis?.method === m.type;
                        const hasHistory = survey.analysisHistory?.some(h => h.method === m.type);
                        
                        return (
                            <button
                                key={m.type}
                                onClick={() => handleMethodClick(m.type)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all relative top-[1px]
                                    ${isActive 
                                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 border-b-white dark:border-b-slate-800 shadow-sm' 
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : hasHistory ? 'text-green-500' : 'text-slate-400'}`} />
                                {t(`method_${m.type.toLowerCase()}`)}
                                {hasHistory && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1"></span>}
                            </button>
                        );
                    })}
                </div>

                {/* Method Description Box */}
                {analysis && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 flex gap-3 text-sm text-blue-800 dark:text-blue-200">
                     <Info className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                     <p>{t(`desc_method_${analysis.method.toLowerCase()}`)}</p>
                  </div>
                )}
            </div>

            {/* Content Display */}
            <div className="bg-white dark:bg-slate-800 rounded-b-xl rounded-tr-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm min-h-[400px] mt-2">
                {analysis ? (
                    <div className="animate-in fade-in duration-300">
                        {/* Status Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2">
                                {analysis.status === 'PENDING' ? (
                                    <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" /> {t('status_pending')}
                                    </span>
                                ) : analysis.status === 'FAILED' ? (
                                    <span className="text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {t('status_failed')}
                                    </span>
                                ) : (
                                    <span className="text-green-600 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Analysis Ready
                                    </span>
                                )}
                                <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(analysis.createdAt).toLocaleString()}</span>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={handleRefreshAnalysis} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title={t('btn_regenerate')}>
                                    <RotateCw className="w-4 h-4" />
                                </button>
                                <div className="h-8 w-px bg-slate-100 dark:bg-slate-700 mx-1"></div>
                                <Button onClick={handleDownloadPDF} variant="outline" className="h-8 text-xs px-2" disabled={analysis.status !== 'COMPLETED'}>
                                    <FileDown className="w-4 h-4 md:mr-1" /> <span className="hidden md:inline">PDF</span>
                                </Button>
                                <Button onClick={handleDownloadWord} variant="outline" className="h-8 text-xs px-2" disabled={analysis.status !== 'COMPLETED'}>
                                    <FileText className="w-4 h-4 md:mr-1" /> <span className="hidden md:inline">Word</span>
                                </Button>
                            </div>
                        </div>

                        {/* Analysis Body */}
                        <div ref={reportContainerRef} className="p-1"> 
                           {analysis.status === 'PENDING' ? (
                               <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 space-y-4">
                                   <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                                   <p>{t('btn_analyzing')}</p>
                                   <p className="text-xs max-w-xs text-center">AI is processing {surveyResponses.length} responses...</p>
                               </div>
                           ) : analysis.status === 'FAILED' ? (
                               <div className="flex flex-col items-center justify-center py-20 text-center">
                                   <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                                       <AlertTriangle className="w-6 h-6 text-red-500" />
                                   </div>
                                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Analysis Failed</h3>
                                   <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md whitespace-pre-line leading-relaxed">
                                       {analysis.summary}
                                   </p>
                                   {analysis.method === AnalysisMethod.VISION && (
                                       <div className="flex gap-2 justify-center">
                                           <Link to="/universities">
                                               <Button variant="primary" className="h-9">
                                                   Go to University Management
                                               </Button>
                                           </Link>
                                           <Button onClick={() => handleMethodClick(analysis.method)} variant="outline" className="h-9">
                                               Retry Analysis
                                           </Button>
                                       </div>
                                   )}
                                   {analysis.method !== AnalysisMethod.VISION && (
                                       <Button onClick={() => handleMethodClick(analysis.method)} variant="outline">
                                           Retry
                                       </Button>
                                   )}
                               </div>
                           ) : (
                               <>
                                   {analysis.method === AnalysisMethod.BASIC && renderBasicAnalysis(analysis)}
                                   {analysis.method === AnalysisMethod.IPA && renderIPA(analysis)}
                                   {analysis.method === AnalysisMethod.BOXPLOT && renderBoxPlot(analysis)}
                                   {analysis.method === AnalysisMethod.MCA && renderMCA(analysis)}
                                   {analysis.method === AnalysisMethod.DEMOGRAPHIC && renderDemographic(analysis)}
                                   {analysis.method === AnalysisMethod.VISION && renderVisionAnalysis(analysis)}
                                </>
                           )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-slate-500 space-y-4">
                        <BrainCircuit className="w-16 h-16 opacity-20" />
                        <p>{t('alert_no_res')}</p>
                        <Button onClick={() => handleMethodClick(AnalysisMethod.BASIC)}>
                            {t('btn_run_analysis')}
                        </Button>
                    </div>
                )}
            </div>
         </div>

         {/* Visual Stats Table (Bottom) */}
         <div className="w-full mt-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" ref={dataTableRef}>
                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    {t('table_summary_title')}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 font-semibold w-16">No.</th>
                                <th className="px-4 py-3 font-semibold">{t('col_question')}</th>
                                <th className="px-4 py-3 font-semibold w-48 text-center">{t('col_mean')} (Max 5.0)</th>
                                <th className="px-4 py-3 font-semibold w-32 text-center">{t('col_std_dev')}</th>
                                <th className="px-4 py-3 font-semibold w-24 text-center">{t('col_count')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {stats.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-400 dark:text-slate-500">
                                        Q{s.idx}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                        {s.question}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${s.mean >= 4 ? 'bg-green-500' : s.mean >= 3 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${(s.mean / 5) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className={`font-bold w-8 text-right ${s.mean >= 4 ? 'text-green-600' : s.mean >= 3 ? 'text-blue-600' : 'text-red-600'}`}>
                                                {s.mean}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 font-mono">
                                        {s.stdDev}
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 font-mono">
                                        {s.count}
                                    </td>
                                </tr>
                            ))}
                            {stats.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                        No data available for Likert scale questions.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};