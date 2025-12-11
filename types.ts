
export enum QuestionType {
  LIKERT = 'LIKERT', // 1-5 Scale
  OPEN_ENDED = 'OPEN_ENDED',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // Single Select (Radio)
  MULTIPLE_SELECT = 'MULTIPLE_SELECT',   // Multiple Select (Checkbox)
  SECTION = 'SECTION', // Section Header / Divider
  INFO_MESSAGE = 'INFO_MESSAGE' // Intro, Outro, or Image Block
}

export enum AnalysisMethod {
  BASIC = 'BASIC',
  IPA = 'IPA',         // Importance-Performance Analysis
  BOXPLOT = 'BOXPLOT', // Box Plot Statistics
  MCA = 'MCA',         // Multiple Correspondence Analysis
  DEMOGRAPHIC = 'DEMOGRAPHIC', // Respondent Characteristics
  VISION = 'VISION',   // Vision Alignment Analysis
}

export interface University {
  id: string;
  name: string;
  region: string;
  studentCount: number;
  logoColor?: string; // For UI decoration
  vision?: string; // University Vision / Mission Statement
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For Multiple Choice/Select
  imageUrl?: string; // For adding images to questions or info blocks
}

export interface Survey {
  id: string;
  universityId?: string; // Linked University
  title: string;
  description: string; // Used as prompt for AI
  introMessage?: string; // Custom welcome message for the start screen
  introImageUrl?: string; // Image for the start screen
  closingMessage?: string; // Custom message for the completion screen
  closingImageUrl?: string; // Image for the completion screen
  redirectUrl?: string; // URL to redirect after completion
  questions: Question[];
  createdAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  analysisHistory?: AIAnalysisResult[]; // Store past analyses
  source?: 'INTERNAL' | 'EXTERNAL'; // Origin of the data
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Record<string, string | number | string[]>; // questionId -> answer (string, number, or array of strings)
  submittedAt: string;
}

export interface PrizeDrawRecord {
  id: string;
  surveyId: string;
  surveyTitle: string;
  prizeName?: string; // Name of the prize (optional)
  drawnAt: string;
  winnerCount: number;
  winners: SurveyResponse[];
}

export interface IPADataPoint {
  label: string;
  importance: number; // 0-100 or 1-5
  performance: number; // 0-100 or 1-5
}

export interface BoxPlotStats {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export interface MCACoordinate {
  label: string;
  x: number;
  y: number;
  category: string;
}

export interface AIAnalysisResult {
  id: string;        // Unique ID for the report
  createdAt: string; // Timestamp
  method: AnalysisMethod;
  summary: string; // Executive Summary
  status?: 'PENDING' | 'COMPLETED' | 'FAILED'; 
  
  // Professional Report Fields (Basic Analysis)
  comprehensiveDiagnosis?: string; // Detailed textual analysis
  strengths?: string[]; // Top strengths identified
  weaknesses?: string[]; // Top weaknesses/pain points
  improvementStrategies?: string[]; // Strategic Action Plan (renamed from recommendations to be more specific, but keeping backward compat via mapping if needed)
  
  // Legacy / Basic
  keyThemes?: string[];
  sentimentScore?: number;
  recommendations?: string[]; // Kept for backward compatibility

  // IPA
  ipaData?: IPADataPoint[];
  // Box Plot
  boxPlotData?: BoxPlotStats[];
  // MCA
  mcaData?: MCACoordinate[];
  // Demographic
  demographicInsights?: string[];
  // Vision Analysis
  visionAnalysis?: {
    alignmentScore: number; // 0-100
    alignmentSummary: string;
    alignedAreas: string[];
    gapAreas: string[];
  };
}