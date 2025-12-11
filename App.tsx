import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CreateSurvey } from './components/CreateSurvey';
import { SurveyTaker } from './components/SurveyTaker';
import { SurveyAnalytics } from './components/SurveyAnalytics';
import { SurveyList } from './components/SurveyList';
import { SurveySheet } from './components/SurveySheet';
import { SurveyQuestionsView } from './components/SurveyQuestionsView';
import { PrizeManagement } from './components/PrizeManagement';
import { AnalyticsManagement } from './components/AnalyticsManagement';
import { UniversityManagement } from './components/UniversityManagement';
import { Survey, SurveyResponse, QuestionType, PrizeDrawRecord, University } from './types';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

// ---------------------------------------------------------------------------
// CONFIGURATION: GOOGLE SHEETS "DATABASE" URL
// ---------------------------------------------------------------------------
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwXFwIa0g9x31PWY2nS0-JGjHEcrrtH-2PU0DSA2Q2tvXf7G3S6Oo38d8HWGdPIykdBrw/exec";

// Initial Mock Data (Fallback if DB is empty or offline)
const INITIAL_UNIVERSITIES: University[] = [
  { id: 'u1', name: '한국대학교', region: '서울', studentCount: 15000, logoColor: 'bg-blue-100' },
  { id: 'u2', name: '서울과학기술대', region: '서울', studentCount: 12000, logoColor: 'bg-orange-100' },
  { id: 'u3', name: '부산대학교', region: '부산', studentCount: 20000, logoColor: 'bg-green-100' },
];

const INITIAL_SURVEYS: Survey[] = [
  {
    id: 'demo-1',
    universityId: 'u1',
    title: '2024 재학생 종합 만족도 조사',
    description: '본 조사는 대학의 교육 과정, 교육 여건, 학생 지원 등 학교 생활 전반에 대한 재학생 여러분의 의견을 수렴하여 대학 행정 개선 및 서비스 질 향상을 위한 기초 자료로 활용하고자 합니다.',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    analysisHistory: [],
    questions: [
      { id: 'sec1', text: 'Ⅰ. 교육 과정 및 교수진', type: QuestionType.SECTION },
      { id: 'q1', text: '전공 교육과정의 구성과 내용이 체계적이라고 생각하십니까?', type: QuestionType.LIKERT },
      { id: 'q2', text: '교수진의 강의 준비와 수업 진행 방식에 만족하십니까?', type: QuestionType.LIKERT },
      { id: 'q3', text: '교수님들은 학생들의 질문이나 상담 요청에 적극적으로 응대합니까?', type: QuestionType.LIKERT },
      { id: 'sec2', text: 'Ⅱ. 교육 환경 및 시설', type: QuestionType.SECTION },
      { id: 'q4', text: '강의실, 실험실습실 등 수업 환경(냉난방, 기자재 등)이 쾌적합니까?', type: QuestionType.LIKERT },
      { id: 'q5', text: '도서관의 학습 공간과 장서 보유량에 만족하십니까?', type: QuestionType.LIKERT },
      { id: 'q6', text: '교내 와이파이(Wi-Fi) 속도 및 전산 실습 장비 등 IT 환경에 만족하십니까?', type: QuestionType.LIKERT },
      { id: 'sec3', text: 'Ⅲ. 학생 복지 및 행정 지원', type: QuestionType.SECTION },
      { id: 'q7', text: '학생 식당의 메뉴 다양성과 맛, 가격에 만족하십니까?', type: QuestionType.LIKERT },
      { id: 'q8', text: '장학금 제도가 다양하고 공정하게 운영된다고 생각하십니까?', type: QuestionType.LIKERT },
      { id: 'q9', text: '진로 및 취업 지원 프로그램(상담, 취업 박람회 등)이 실질적인 도움이 됩니까?', type: QuestionType.LIKERT },
      { id: 'q10', text: '행정 부서(학과 사무실, 본부 등)의 민원 처리 속도와 친절도에 만족하십니까?', type: QuestionType.LIKERT },
      { id: 'sec4', text: 'Ⅳ. 종합 의견', type: QuestionType.SECTION },
      { id: 'q11', text: '나는 우리 대학에 다니는 것에 대해 자부심을 느낀다.', type: QuestionType.LIKERT },
      { id: 'q12', text: '학교 발전을 위해 가장 시급하게 개선해야 할 분야는 무엇입니까?', type: QuestionType.MULTIPLE_CHOICE, options: ['교육과정/강의질', '교육시설/환경', '식당/편의시설', '장학/복지제도', '취업/진로지원', '소통/행정서비스'] },
      { id: 'q13', text: '기타 학교에 바라는 점이나 건의사항을 자유롭게 작성해 주세요.', type: QuestionType.OPEN_ENDED }
    ]
  }
];

const INITIAL_RESPONSES: SurveyResponse[] = [
  { 
    id: 'r1', 
    surveyId: 'demo-1', 
    answers: { 
      'q1': 4, 'q2': 5, 'q3': 4, 'q4': 3, 'q5': 5, 'q6': 2, 'q7': 2, 'q8': 4, 'q9': 3, 'q10': 4, 'q11': 4, 'q12': '식당/편의시설', 'q13': '학식 메뉴가 너무 적어요. 편의점이 더 생겼으면 좋겠습니다.' 
    }, 
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString() 
  },
  { 
    id: 'r2', 
    surveyId: 'demo-1', 
    answers: { 
      'q1': 5, 'q2': 5, 'q3': 5, 'q4': 4, 'q5': 5, 'q6': 3, 'q7': 3, 'q8': 5, 'q9': 4, 'q10': 5, 'q11': 5, 'q12': '취업/진로지원', 'q13': '취업 멘토링 프로그램이 더 자주 열렸으면 합니다.' 
    }, 
    submittedAt: new Date(Date.now() - 86400000).toISOString() 
  },
  { 
    id: 'r3', 
    surveyId: 'demo-1', 
    answers: { 
      'q1': 3, 'q2': 3, 'q3': 3, 'q4': 2, 'q5': 4, 'q6': 1, 'q7': 1, 'q8': 3, 'q9': 2, 'q10': 2, 'q11': 3, 'q12': '교육시설/환경', 'q13': '와이파이가 너무 자주 끊겨요. 강의실 의자도 교체해주세요.' 
    }, 
    submittedAt: new Date().toISOString() 
  }
];

const App: React.FC = () => {
  // --- 1. State Initialization (Try LocalStorage first for speed, then Cloud will override) ---
  const [surveys, setSurveys] = useState<Survey[]>(() => {
    const saved = localStorage.getItem('surveys');
    return saved ? JSON.parse(saved) : INITIAL_SURVEYS;
  });

  const [responses, setResponses] = useState<SurveyResponse[]>(() => {
    const saved = localStorage.getItem('responses');
    return saved ? JSON.parse(saved) : INITIAL_RESPONSES;
  });

  const [universities, setUniversities] = useState<University[]>(() => {
    const saved = localStorage.getItem('universities');
    return saved ? JSON.parse(saved) : INITIAL_UNIVERSITIES;
  });

  const [prizeHistory, setPrizeHistory] = useState<PrizeDrawRecord[]>(() => {
    const saved = localStorage.getItem('prizeHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Start loading as true if we have a URL to prevent overwriting cloud data with initial local data
  const [isLoadingCloud, setIsLoadingCloud] = useState(!!GOOGLE_SHEET_URL);

  // --- 2. Local Persistence (Always keep local in sync for redundancy) ---
  useEffect(() => { localStorage.setItem('surveys', JSON.stringify(surveys)); }, [surveys]);
  useEffect(() => { localStorage.setItem('responses', JSON.stringify(responses)); }, [responses]);
  useEffect(() => { localStorage.setItem('universities', JSON.stringify(universities)); }, [universities]);
  useEffect(() => { localStorage.setItem('prizeHistory', JSON.stringify(prizeHistory)); }, [prizeHistory]);

  // --- 3. Cloud Sync Logic ---
  
  // A. Load from Cloud on Mount (Database Behavior)
  useEffect(() => {
    if (!GOOGLE_SHEET_URL) return;

    const fetchData = async () => {
      setIsLoadingCloud(true);
      try {
        console.log("Fetching data from Google Sheets...");
        const response = await fetch(GOOGLE_SHEET_URL);
        if (!response.ok) throw new Error("Failed to fetch from Google Sheets");
        
        const data = await response.json();
        
        // If the sheet has data, update the app state (Single Source of Truth)
        if (data.surveys && data.surveys.length > 0) setSurveys(data.surveys);
        if (data.responses) setResponses(data.responses); // Allow empty array
        if (data.universities && data.universities.length > 0) setUniversities(data.universities);
        if (data.prizeHistory) setPrizeHistory(data.prizeHistory);
        
        console.log("App state synchronized with Google Sheets.");
      } catch (e) {
        console.error("Cloud Fetch Error:", e);
        // Fallback to local storage (already loaded)
      } finally {
        setIsLoadingCloud(false);
      }
    };

    fetchData();
  }, []);

  // B. Save to Cloud on Change (Debounced)
  useEffect(() => {
    if (!GOOGLE_SHEET_URL) return;

    // Skip saving if we are currently loading initial data to prevent overwriting cloud with stale local state
    if (isLoadingCloud) return;

    const syncToCloud = async () => {
      try {
        const payload = {
          surveys,
          responses,
          universities,
          prizeHistory,
          backupDate: new Date().toISOString(),
          version: '1.0'
        };
        
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors', // Essential for Google Apps Script Web App calls
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        
        console.log("Changes pushed to Google Sheets.");
      } catch (err) {
        console.error("Auto-sync error:", err);
      }
    };

    const timeoutId = setTimeout(syncToCloud, 2000); // 2s debounce
    return () => clearTimeout(timeoutId);
  }, [surveys, responses, universities, prizeHistory, isLoadingCloud]);


  // --- 4. Handlers ---
  const handleCreateSurvey = (newSurvey: Survey) => {
    setSurveys([newSurvey, ...surveys]);
  };

  const handleUpdateSurvey = (updatedSurvey: Survey) => {
    setSurveys(surveys.map(s => s.id === updatedSurvey.id ? updatedSurvey : s));
  };

  const handleSurveySubmit = (response: SurveyResponse) => {
    setResponses([...responses, response]);
  };

  const handleSavePrizeDraw = (record: PrizeDrawRecord) => {
    setPrizeHistory([record, ...prizeHistory]);
  };

  const handleDeletePrizeRecord = (id: string) => {
    setPrizeHistory(prizeHistory.filter(h => h.id !== id));
  };

  const handleImportData = (newSurvey: Survey, newResponses: SurveyResponse[]) => {
    setSurveys([newSurvey, ...surveys]);
    setResponses([...responses, ...newResponses]);
  };

  // University Handlers
  const handleAddUniversity = (u: University) => {
    setUniversities([...universities, u]);
  };

  const handleUpdateUniversity = (u: University) => {
    setUniversities(universities.map(univ => univ.id === u.id ? u : univ));
  };

  const handleDeleteUniversity = (id: string) => {
    setUniversities(universities.filter(u => u.id !== id));
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard surveys={surveys} universities={universities} />} />
              <Route path="universities" element={
                <UniversityManagement 
                  universities={universities}
                  onAddUniversity={handleAddUniversity}
                  onUpdateUniversity={handleUpdateUniversity}
                  onDeleteUniversity={handleDeleteUniversity}
                />
              } />
              <Route path="create" element={<CreateSurvey surveys={surveys} universities={universities} onSave={handleCreateSurvey} onUpdate={handleUpdateSurvey} />} />
              <Route path="edit/:id" element={<CreateSurvey surveys={surveys} universities={universities} onSave={handleCreateSurvey} onUpdate={handleUpdateSurvey} />} />
              <Route path="list" element={<SurveyList surveys={surveys} responses={responses} universities={universities} onUpdateSurvey={handleUpdateSurvey} />} />
              <Route path="analytics" element={<AnalyticsManagement surveys={surveys} responses={responses} universities={universities} onImportData={handleImportData} />} />
              <Route path="analyze/:id" element={<SurveyAnalytics surveys={surveys} responses={responses} universities={universities} onUpdateSurvey={handleUpdateSurvey} />} />
              <Route path="sheet/:id" element={<SurveySheet surveys={surveys} responses={responses} />} />
              <Route path="questions/:id" element={<SurveyQuestionsView surveys={surveys} />} />
              <Route path="prize" element={
                <PrizeManagement 
                  surveys={surveys} 
                  responses={responses} 
                  history={prizeHistory}
                  universities={universities}
                  onSaveRecord={handleSavePrizeDraw}
                  onDeleteRecord={handleDeletePrizeRecord}
                />
              } />
              
              {/* Public/Student View */}
              <Route path="take/:id" element={<SurveyTaker surveys={surveys} universities={universities} onSubmit={handleSurveySubmit} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;