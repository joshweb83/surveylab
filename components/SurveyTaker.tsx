import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Survey, QuestionType, SurveyResponse, University } from '../types';
import { Button } from './Button';
import { CheckCircle2, ChevronRight, ChevronLeft, Square, CheckSquare, X, Info, ExternalLink, Loader2, School, Clock, FileText, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SurveyTakerProps {
  surveys: Survey[];
  universities?: University[];
  onSubmit: (response: SurveyResponse) => void;
}

export const SurveyTaker: React.FC<SurveyTakerProps> = ({ surveys, universities = [], onSubmit }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const survey = surveys.find(s => s.id === id);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // Intro screen state

  // Get university details if available
  const university = universities.find(u => u.id === survey?.universityId);

  // Dynamic Meta Tag Update for Sharing
  useEffect(() => {
    if (survey) {
      // Update Browser Title
      document.title = `${survey.title} - ${t('app_name')}`;

      // Helper to update or create meta tags
      const updateMeta = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('property', property);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      updateMeta('og:title', survey.title);
      updateMeta('og:description', survey.description || t('app_subtitle'));
    } else {
        document.title = t('app_name');
    }

    return () => {
        document.title = t('app_name');
    };
  }, [survey, t]);

  // Handle auto-redirect if completion and url exists
  useEffect(() => {
    if (completed && survey?.redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = survey.redirectUrl!;
      }, 3000); // 3 seconds delay
      return () => clearTimeout(timer);
    }
  }, [completed, survey]);

  if (!survey) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm max-w-sm w-full">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
           <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Survey Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The survey link might be invalid or the survey has been removed.</p>
        <Button onClick={() => navigate('/')} variant="outline" className="w-full">Return Home</Button>
      </div>
    </div>
  );

  // --- Intro View ---
  if (!hasStarted) {
      const questionCount = survey.questions.length;
      const estimatedTime = Math.ceil(questionCount * 0.8); // Rough estimate: 48 sec per question

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header Decoration / Image */}
                <div className={`relative ${survey.introImageUrl ? '' : (university?.logoColor || 'bg-blue-600')}`}>
                    {survey.introImageUrl ? (
                        <div className="w-full h-48 md:h-60 overflow-hidden bg-slate-200 dark:bg-slate-700">
                            <img src={survey.introImageUrl} alt="Survey Intro" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg z-10">
                                <School className={`w-10 h-10 ${university ? 'text-slate-700' : 'text-blue-600'}`} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 text-center">
                    {university && !survey.introImageUrl && (
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{university.name}</h3>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-snug">{survey.title}</h1>
                    
                    {/* Display Intro Message if available, else Description */}
                    <div className="text-slate-600 dark:text-slate-300 text-sm mb-8 leading-relaxed whitespace-pre-line">
                        {survey.introMessage || survey.description}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                             <div className="flex flex-col items-center gap-1">
                                 <FileText className="w-5 h-5 text-blue-500" />
                                 <span className="text-xs text-slate-400">{t('taker_intro_questions')}</span>
                                 <span className="font-bold text-slate-800 dark:text-white">{questionCount}</span>
                             </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                             <div className="flex flex-col items-center gap-1">
                                 <Clock className="w-5 h-5 text-green-500" />
                                 <span className="text-xs text-slate-400">{t('taker_intro_time')}</span>
                                 <span className="font-bold text-slate-800 dark:text-white">~{estimatedTime} {t('taker_intro_min')}</span>
                             </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-6 flex items-center justify-center gap-1">
                        <Info className="w-3 h-3" /> {t('taker_intro_anonymous')}
                    </p>

                    <Button onClick={() => setHasStarted(true)} className="w-full py-4 text-base shadow-lg shadow-blue-500/20">
                        {t('taker_intro_start')} <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
            
            {/* Close / Exit Button (Visible in Preview) */}
            <button 
                onClick={() => navigate(-1)} 
                className="mt-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm underline"
            >
                Exit
            </button>
        </div>
      );
  }

  // --- Existing Logic ---
  const handleNext = () => {
    if (currentStep < survey.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const response: SurveyResponse = {
        id: Math.random().toString(36).substr(2, 9),
        surveyId: survey.id,
        answers,
        submittedAt: new Date().toISOString()
      };
      onSubmit(response);
      setCompleted(true);
    }
  };

  const handleAnswer = (val: string | number, autoAdvance = false) => {
    setAnswers(prev => ({ ...prev, [survey.questions[currentStep].id]: val }));
    
    if (autoAdvance && currentStep < survey.questions.length - 1) {
        // Small delay for visual feedback
        setTimeout(() => {
            setCurrentStep(prev => prev + 1);
        }, 300);
    }
  };

  const handleMultiSelectAnswer = (option: string) => {
    const qId = survey.questions[currentStep].id;
    const currentSelected = (answers[qId] as string[]) || [];
    
    let newSelected;
    if (currentSelected.includes(option)) {
      newSelected = currentSelected.filter(item => item !== option);
    } else {
      newSelected = [...currentSelected, option];
    }
    
    setAnswers({ ...answers, [qId]: newSelected });
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else setHasStarted(false); // Go back to intro if at step 0
  };

  const handleExit = () => {
    // Navigate back to the previous page, or default to dashboard
    navigate(-1);
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center px-4">
        
        {survey.closingImageUrl ? (
            <div className="w-full max-w-sm rounded-xl overflow-hidden mb-6 shadow-md border border-slate-100 dark:border-slate-700">
                <img src={survey.closingImageUrl} alt="Survey Completed" className="w-full h-auto object-cover" />
            </div>
        ) : (
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-300" />
            </div>
        )}

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('taker_thank_you')}</h2>
        
        {/* Custom Closing Message or Default */}
        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md whitespace-pre-line leading-relaxed">
            {survey.closingMessage || t('taker_thank_msg')}
        </p>
        
        {survey.redirectUrl ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 {t('taker_redirecting')}
             </div>
             <Button onClick={() => window.location.href = survey.redirectUrl!} variant="primary" className="mt-2">
                 {t('btn_go_now')} <ExternalLink className="w-4 h-4" />
             </Button>
          </div>
        ) : (
          null // Removed Return to Dashboard button
        )}
      </div>
    );
  }

  const currentQuestion = survey.questions[currentStep];
  const progress = ((currentStep + 1) / survey.questions.length) * 100;
  
  // Check if current question is answered to enable Next button
  // For SECTION and INFO_MESSAGE type, it's always considered "answered" or skippable
  const isCurrentAnswered = () => {
    if (currentQuestion.type === QuestionType.SECTION || currentQuestion.type === QuestionType.INFO_MESSAGE) return true;
    
    const val = answers[currentQuestion.id];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== '';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-xl mx-auto md:py-10 relative">
        
        {/* Close Button for Preview */}
        <button 
          onClick={handleExit}
          className="absolute -top-2 right-0 md:-right-12 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 z-10"
          title="Exit Preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Title and Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
             {university && (
                 <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wide">
                     {university.name}
                 </span>
             )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white pr-8">{survey.title}</h1>
          <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>{t('taker_q_of')} {currentStep + 1} / {survey.questions.length}</span>
            <span>{Math.round(progress)}% {t('taker_completed')}</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px] flex flex-col transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {currentQuestion.type === QuestionType.SECTION ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                     <Info className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{currentQuestion.text}</h2>
                 <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Click Next to continue to this section.</p>
             </div>
          ) : currentQuestion.type === QuestionType.INFO_MESSAGE ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                 {currentQuestion.imageUrl && (
                    <img 
                        src={currentQuestion.imageUrl} 
                        alt="Intro/Outro" 
                        className="max-h-60 w-auto rounded-lg shadow-sm"
                    />
                 )}
                 <h2 className="text-xl font-bold text-slate-800 dark:text-white whitespace-pre-line leading-relaxed">
                     {currentQuestion.text}
                 </h2>
             </div>
          ) : (
            <>
              <h2 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6 leading-relaxed">
                <span className="text-blue-500 mr-2">Q{currentStep + 1}.</span>
                {currentQuestion.text}
                {currentQuestion.type === QuestionType.MULTIPLE_SELECT && (
                  <span className="block text-sm font-normal text-slate-400 dark:text-slate-500 mt-1">(Select all that apply)</span>
                )}
              </h2>

              {currentQuestion.imageUrl && (
                 <div className="mb-6">
                    <img 
                        src={currentQuestion.imageUrl} 
                        alt="Question Reference" 
                        className="w-full max-h-60 object-contain rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" 
                    />
                 </div>
              )}

              <div className="flex-1">
                {currentQuestion.type === QuestionType.LIKERT && (
                  <div className="space-y-3">
                    {/* Reverse order: 5 (Strongly Agree) at top, 1 (Strongly Disagree) at bottom */}
                    {[5, 4, 3, 2, 1].map((num) => {
                      const likertLabels: Record<number, string> = {
                        1: t('likert_1'), 2: t('likert_2'), 3: t('likert_3'), 4: t('likert_4'), 5: t('likert_5')
                      };
                      return (
                        <button
                          key={num}
                          onClick={() => handleAnswer(num, true)}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            answers[currentQuestion.id] === num
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shadow-sm ${
                              answers[currentQuestion.id] === num 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                            }`}>
                              {num}
                            </span>
                            <span>{likertLabels[num]}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswer(option, true)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          answers[currentQuestion.id] === option
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            answers[currentQuestion.id] === option ? 'border-blue-600' : 'border-slate-300 dark:border-slate-500'
                          }`}>
                            {answers[currentQuestion.id] === option && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                          </div>
                          {option}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === QuestionType.MULTIPLE_SELECT && (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option) => {
                      const isSelected = (answers[currentQuestion.id] as string[] || []).includes(option);
                      return (
                        <button
                          key={option}
                          onClick={() => handleMultiSelectAnswer(option)}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isSelected 
                              ? <CheckSquare className="w-5 h-5 text-blue-600" /> 
                              : <Square className="w-5 h-5 text-slate-300 dark:text-slate-500" />}
                            {option}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === QuestionType.OPEN_ENDED && (
                  <textarea
                    className="w-full h-40 p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700 dark:text-white bg-white dark:bg-slate-700 placeholder-slate-400"
                    placeholder={t('ph_q_text')}
                    value={(answers[currentQuestion.id] as string) || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                  />
                )}
              </div>
            </>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <button 
              onClick={handlePrev}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1"
            >
              <ChevronLeft className="w-5 h-5" /> {t('taker_back')}
            </button>
            
            <Button 
              onClick={handleNext} 
              disabled={!isCurrentAnswered()}
              className="rounded-full px-8 shadow-md shadow-blue-500/10"
            >
              {currentStep === survey.questions.length - 1 ? t('taker_submit') : t('taker_next')}
              {currentStep !== survey.questions.length - 1 && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};