import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Survey, Question, QuestionType, University } from '../types';
import { generateSurveyQuestions, extractQuestionsFromData, generateIntroMessage } from '../services/geminiService';
import { Button } from './Button';
import { Sparkles, Trash2, Plus, GripVertical, Upload, LayoutTemplate, Layers, ChevronDown, ChevronRight, FileText as FileTextIcon, Image as ImageIcon, Link as LinkIcon, MessageSquare, CheckSquare, StopCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CreateSurveyProps {
  onSave: (survey: Survey) => void;
  onUpdate?: (survey: Survey) => void;
  surveys?: Survey[]; // Needed to find survey for editing
  universities?: University[]; // Pass universities list
}

export const CreateSurvey: React.FC<CreateSurveyProps> = ({ onSave, onUpdate, surveys, universities = [] }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Check if editing
  const { t, language } = useLanguage();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [introMessage, setIntroMessage] = useState('');
  const [introImageUrl, setIntroImageUrl] = useState('');
  const [closingMessage, setClosingMessage] = useState('');
  const [closingImageUrl, setClosingImageUrl] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [selectedUnivId, setSelectedUnivId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(7);
  
  // Separate loading states
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isIntroGenerating, setIsIntroGenerating] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [originalSurvey, setOriginalSurvey] = useState<Survey | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const introImageInputRef = useRef<HTMLInputElement>(null);
  const closingImageInputRef = useRef<HTMLInputElement>(null);
  
  const [activeQuestionIdForImage, setActiveQuestionIdForImage] = useState<string | null>(null);

  // Drag and drop state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Initialize for edit mode if ID is present
  useEffect(() => {
    if (id && surveys) {
      const existingSurvey = surveys.find(s => s.id === id);
      if (existingSurvey) {
        setIsEditMode(true);
        setOriginalSurvey(existingSurvey);
        setTitle(existingSurvey.title);
        setDescription(existingSurvey.description);
        setIntroMessage(existingSurvey.introMessage || '');
        setIntroImageUrl(existingSurvey.introImageUrl || '');
        setClosingMessage(existingSurvey.closingMessage || '');
        setClosingImageUrl(existingSurvey.closingImageUrl || '');
        setRedirectUrl(existingSurvey.redirectUrl || '');
        setSelectedUnivId(existingSurvey.universityId || '');
        setQuestions(existingSurvey.questions);
      }
    }
  }, [id, surveys]);

  // Magic AI Generation from Text
  const handleGenerateQuestions = async () => {
    if (!title) {
      alert(t('alert_topic'));
      return;
    }
    setIsAiGenerating(true);
    // Use description as the prompt context and pass the selected count
    const generated = await generateSurveyQuestions(title, description, language, aiQuestionCount);
    setQuestions([...questions, ...generated]);
    setIsAiGenerating(false);
  };

  const handleGenerateIntroMessage = async () => {
    if (!title) {
        alert(t('alert_topic'));
        return;
    }
    setIsIntroGenerating(true);
    const generatedMsg = await generateIntroMessage(title, description, language);
    setIntroMessage(generatedMsg);
    setIsIntroGenerating(false);
  };

  // Magic AI Generation from File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const base64Data = (reader.result as string).split(',')[1];
            const mimeType = file.type;
            const extractedQuestions = await extractQuestionsFromData(base64Data, mimeType, language);
            if (extractedQuestions.length > 0) {
                setQuestions([...questions, ...extractedQuestions]);
                alert(t('upload_success'));
            } else {
                alert(t('upload_fail'));
            }
        } catch (err) {
            console.error(err);
            alert(t('upload_fail'));
        } finally {
            setIsFileUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsDataURL(file);
  };

  // Generic Image Reader
  const readImage = (e: React.ChangeEvent<HTMLInputElement>, callback: (result: string) => void) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
          callback(reader.result as string);
          e.target.value = ''; // Reset input
      };
      reader.readAsDataURL(file);
  };

  const handleIntroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      readImage(e, setIntroImageUrl);
  };

  const handleClosingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      readImage(e, setClosingImageUrl);
  };

  const handleQuestionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeQuestionIdForImage) return;
      readImage(e, (result) => {
          updateQuestion(activeQuestionIdForImage, 'imageUrl', result);
          setActiveQuestionIdForImage(null);
      });
  };

  // Trigger Question Image Upload
  const triggerImageUpload = (qId: string) => {
    setActiveQuestionIdForImage(qId);
    if (questionImageInputRef.current) {
        questionImageInputRef.current.click();
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(36).substr(2, 9),
        text: '',
        type: QuestionType.LIKERT,
        options: []
      }
    ]);
  };

  const addSection = () => {
    const newSectionId = Math.random().toString(36).substr(2, 9);
    setQuestions([
        ...questions,
        {
            id: newSectionId,
            text: 'New Section',
            type: QuestionType.SECTION,
            options: []
        }
    ]);
  };

  const addContent = () => {
      const newId = Math.random().toString(36).substr(2, 9);
      setQuestions([
          ...questions,
          {
              id: newId,
              text: '',
              type: QuestionType.INFO_MESSAGE,
              options: []
          }
      ]);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
        newCollapsed.delete(sectionId);
    } else {
        newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) {
      alert(t('alert_min_q'));
      return;
    }

    if (isEditMode && originalSurvey && onUpdate) {
      // Update logic
      const updatedSurvey: Survey = {
        ...originalSurvey,
        universityId: selectedUnivId,
        title,
        description,
        introMessage: introMessage || undefined,
        introImageUrl: introImageUrl || undefined,
        closingMessage: closingMessage || undefined,
        closingImageUrl: closingImageUrl || undefined,
        redirectUrl: redirectUrl || undefined,
        questions,
        // Keep original createdAt and ID
      };
      onUpdate(updatedSurvey);
      navigate('/'); // Go back to dashboard or list
    } else {
      // Create logic
      const newSurvey: Survey = {
        id: Math.random().toString(36).substr(2, 9),
        universityId: selectedUnivId,
        title,
        description,
        introMessage: introMessage || undefined,
        introImageUrl: introImageUrl || undefined,
        closingMessage: closingMessage || undefined,
        closingImageUrl: closingImageUrl || undefined,
        redirectUrl: redirectUrl || undefined,
        questions,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE'
      };
      onSave(newSurvey);
      navigate('/');
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

    const newQuestions = [...questions];
    const [draggedItem] = newQuestions.splice(draggedItemIndex, 1);
    newQuestions.splice(dropIndex, 0, draggedItem);
    
    setQuestions(newQuestions);
    setDraggedItemIndex(null);
  };

  // Helper to determine if a question should be shown based on previous sections
  let currentSectionId: string | null = null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf,.csv,.txt,.json,application/pdf,text/plain,text/csv,application/json"
        onChange={handleFileUpload}
      />
      <input 
        type="file" 
        ref={questionImageInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleQuestionImageChange}
      />
      <input 
        type="file" 
        ref={introImageInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleIntroImageChange}
      />
      <input 
        type="file" 
        ref={closingImageInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleClosingImageChange}
      />

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isEditMode ? t('edit_title') : t('create_title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{isEditMode ? t('edit_desc') : t('create_desc')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          {/* University Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('label_univ')}</label>
            <select
              value={selectedUnivId}
              onChange={(e) => setSelectedUnivId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">{t('ph_select_univ')}</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('label_topic')}</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('ph_topic')}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:placeholder-slate-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('label_desc')}</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('ph_desc')}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:placeholder-slate-400"
            />
          </div>

          {/* Intro Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold"><MessageSquare className="w-4 h-4" /> {t('label_intro_msg')}</span>
                <Button type="button" variant="secondary" onClick={handleGenerateIntroMessage} isLoading={isIntroGenerating} className="px-2 py-0.5 text-xs h-6">
                    <Sparkles className="w-3 h-3" /> {t('btn_ai_msg')}
                </Button>
            </label>
            <textarea 
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              placeholder={t('ph_intro_msg')}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:placeholder-slate-400 mb-2"
            />
            {/* Intro Image Upload */}
            <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={() => introImageInputRef.current?.click()} className="text-xs h-8 w-fit">
                    <ImageIcon className="w-3.5 h-3.5" /> {introImageUrl ? t('btn_remove_image') : t('btn_add_image')}
                </Button>
                {introImageUrl && (
                    <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={introImageUrl} alt="Intro" className="w-full h-auto max-h-40 object-cover" />
                        <button onClick={() => setIntroImageUrl('')} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><Trash2 className="w-3 h-3"/></button>
                    </div>
                )}
            </div>
          </div>

          {/* Closing Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                <StopCircle className="w-4 h-4" /> {t('label_closing_msg')}
            </label>
            <textarea 
              value={closingMessage}
              onChange={(e) => setClosingMessage(e.target.value)}
              placeholder={t('ph_closing_msg')}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:placeholder-slate-400 mb-2"
            />
            
            {/* Closing Image Upload */}
            <div className="flex flex-col gap-2 mb-4">
                <Button type="button" variant="outline" onClick={() => closingImageInputRef.current?.click()} className="text-xs h-8 w-fit">
                    <ImageIcon className="w-3.5 h-3.5" /> {closingImageUrl ? t('btn_remove_image') : t('btn_add_image')}
                </Button>
                {closingImageUrl && (
                    <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={closingImageUrl} alt="Closing" className="w-full h-auto max-h-40 object-cover" />
                        <button onClick={() => setClosingImageUrl('')} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><Trash2 className="w-3 h-3"/></button>
                    </div>
                )}
            </div>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> {t('label_redirect_url')}
            </label>
            <input 
              type="url" 
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder={t('ph_redirect_url')}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:placeholder-slate-400"
            />
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{t('section_questions')} ({questions.length})</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} isLoading={isFileUploading} className="px-3 py-1.5 text-xs h-8">
                <Upload className="w-3.5 h-3.5" />
                {t('btn_upload_file')}
              </Button>
              
              <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800 p-0.5">
                  <select 
                    value={aiQuestionCount} 
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-indigo-700 dark:text-indigo-300 outline-none px-2 py-1 cursor-pointer border-r border-indigo-200 dark:border-indigo-700 h-7"
                    title={t('label_q_count')}
                  >
                      <option value={5}>5</option>
                      <option value={7}>7</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={40}>40</option>
                      <option value={50}>50</option>
                  </select>
                  <Button type="button" variant="secondary" onClick={handleGenerateQuestions} isLoading={isAiGenerating} className="px-3 py-1 text-xs h-7 border-none rounded-none rounded-r-md !bg-transparent !text-indigo-700 dark:!text-indigo-300 hover:!bg-indigo-100 dark:hover:!bg-indigo-800 shadow-none">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('btn_ai_gen')}
                  </Button>
              </div>

              <Button type="button" variant="outline" onClick={addContent} className="px-3 py-1.5 text-xs h-8">
                 <FileTextIcon className="w-3.5 h-3.5" />
                 {t('btn_add_content')}
              </Button>
              <Button type="button" variant="outline" onClick={addSection} className="px-3 py-1.5 text-xs h-8">
                <Layers className="w-3.5 h-3.5" />
                {t('btn_add_section')}
              </Button>
              <Button type="button" variant="primary" onClick={addQuestion} className="px-3 py-1.5 text-xs h-8">
                <Plus className="w-3.5 h-3.5" />
                {t('btn_manual')}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => {
              const isSection = q.type === QuestionType.SECTION;
              const isInfo = q.type === QuestionType.INFO_MESSAGE;
              const isDragging = draggedItemIndex === index;
              
              if (isSection) {
                  currentSectionId = q.id;
              }

              // Check if current item should be hidden (if it's not a section, and the current section is collapsed)
              const isHidden = !isSection && currentSectionId && collapsedSections.has(currentSectionId);

              if (isHidden) return null;

              return (
                <div 
                    key={q.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`p-5 rounded-xl border shadow-sm group transition-all 
                        ${isDragging ? 'opacity-50 ring-2 ring-blue-400' : 'hover:border-blue-300 dark:hover:border-blue-500'}
                        ${isSection ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}
                    `}
                >
                    <div className="flex items-start gap-4">
                    <div className="mt-3 text-slate-300 dark:text-slate-600 cursor-move" title="Drag to reorder">
                        <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                        {isSection ? (
                            // Section Header Render
                            <div className="flex gap-4 items-center">
                                <button 
                                    type="button"
                                    onClick={() => toggleSection(q.id)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                                >
                                    {collapsedSections.has(q.id) ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <LayoutTemplate className="w-3 h-3" />
                                        {t('type_section')}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={q.text}
                                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border-b-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 outline-none bg-transparent text-lg font-bold text-slate-800 dark:text-white placeholder-slate-400"
                                        placeholder="Enter section title..."
                                    />
                                </div>
                            </div>
                        ) : isInfo ? (
                             // Info Message Render
                             <>
                             <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                                        <FileTextIcon className="w-3 h-3" />
                                        {t('label_content_text')}
                                    </label>
                                    <textarea 
                                        value={q.text}
                                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:placeholder-slate-400 min-h-[80px]"
                                        placeholder="Enter Info message..."
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{t('label_q_type')}</label>
                                    <div className="mt-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-sm">
                                        {t('type_info')}
                                    </div>
                                </div>
                             </div>
                             
                             {/* Image Preview for Info */}
                             {q.imageUrl && (
                                <div className="relative mt-2 w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                    <img src={q.imageUrl} alt="Content" className="w-full h-auto object-cover" />
                                    <button 
                                        onClick={() => updateQuestion(q.id, 'imageUrl', undefined)}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                             </>
                        ) : (
                            // Normal Question Render
                            <>
                            <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{t('label_q_text')}</label>
                                <input 
                                type="text" 
                                value={q.text}
                                onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:placeholder-slate-400"
                                placeholder={t('ph_q_text')}
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{t('label_q_type')}</label>
                                <select 
                                value={q.type}
                                onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                                >
                                <option value={QuestionType.LIKERT}>{t('type_likert')}</option>
                                <option value={QuestionType.OPEN_ENDED}>{t('type_open')}</option>
                                <option value={QuestionType.MULTIPLE_CHOICE}>{t('type_multi')}</option>
                                <option value={QuestionType.MULTIPLE_SELECT}>{t('type_multiselect')}</option>
                                </select>
                            </div>
                            </div>
                            
                            {/* Image Preview for Question */}
                            {q.imageUrl && (
                                <div className="relative mt-2 w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                                    <img src={q.imageUrl} alt="Question" className="w-full h-auto object-cover" />
                                    <button 
                                        onClick={() => updateQuestion(q.id, 'imageUrl', undefined)}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {(q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.MULTIPLE_SELECT) && (
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('label_options')}</label>
                                <input 
                                type="text"
                                value={q.options?.join(', ')}
                                onChange={(e) => updateQuestion(q.id, 'options', e.target.value.split(',').map(s => s.trim()))}
                                className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                placeholder={t('ph_options')}
                                />
                            </div>
                            )}
                            </>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-3">
                        <button 
                            type="button"
                            onClick={() => removeQuestion(q.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        {!isSection && (
                            <button 
                                type="button"
                                onClick={() => triggerImageUpload(q.id)}
                                className={`transition-colors ${q.imageUrl ? 'text-blue-500' : 'text-slate-300 hover:text-blue-500'}`}
                                title="Add/Edit Image"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    </div>
                </div>
              );
            })}
            
            {questions.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-slate-500 dark:text-slate-400 mb-2">{t('empty_questions')}</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">{t('empty_hint')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/')} className="flex-1">
             Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {isEditMode ? t('btn_update') : t('btn_publish')}
          </Button>
        </div>
      </form>
    </div>
  );
};