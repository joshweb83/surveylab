import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { Question, QuestionType, AIAnalysisResult, SurveyResponse, Survey, AnalysisMethod, University } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper for exponential backoff retry logic
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for 429 (Too Many Requests/Quota Exceeded) or 503 (Service Unavailable)
    const errorCode = error?.status || error?.error?.code || error?.code;
    const errorMessage = error?.message || "";
    
    const isRateLimit = errorCode === 429 || errorMessage.includes('429') || errorMessage.includes('quota');
    const isServerOverload = errorCode === 503;

    if (retries > 0 && (isRateLimit || isServerOverload)) {
      console.warn(`API quota/rate limit hit (${errorCode}). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const generateIntroMessage = async (topic: string, description: string, language: 'ko' | 'en' = 'ko'): Promise<string> => {
  try {
    const langPrompt = language === 'ko' 
      ? 'Write the message in polite and encouraging Korean (honorifics).' 
      : 'Write the message in professional and welcoming English.';
    
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a warm, professional, and encouraging welcome message for the start page of a university survey.
      
      Survey Title: "${topic}"
      Context/Goal: "${description}"
      
      Requirements:
      1. Keep it under 100 words.
      2. Explain why their opinion matters.
      3. Mention it will take only a few minutes.
      4. Assure anonymity if relevant.
      5. ${langPrompt}`,
    }));

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating intro message:", error);
    return "";
  }
};

export const generateSurveyQuestions = async (topic: string, description: string, language: 'ko' | 'en' = 'ko', count: number = 7): Promise<Question[]> => {
  try {
    const langPrompt = language === 'ko' ? 'Write the questions in Korean.' : 'Write the questions in English.';
    
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of exactly ${count} high-quality university survey questions for the topic: "${topic}".
      Use the following context/description to tailor the questions: "${description}".
      
      Include a mix of:
      1. Likert scale (1-5) questions (majority)
      2. Open Ended questions (1 or 2 at the end)
      3. Multiple Choice or Multiple Select questions if relevant.
      4. Suggest a 'SECTION' type if a logical grouping makes sense (e.g. 'Demographics' or 'Satisfaction').
      
      ${langPrompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The text of the question or section header" },
              type: { type: Type.STRING, enum: [QuestionType.LIKERT, QuestionType.OPEN_ENDED, QuestionType.MULTIPLE_CHOICE, QuestionType.MULTIPLE_SELECT, QuestionType.SECTION] },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options for multiple choice/select questions, empty if not applicable" }
            },
            required: ["text", "type"]
          }
        }
      }
    }));

    let jsonString = response.text || "[]";
    
    // Clean up potential markdown code blocks
    if (jsonString.includes("```json")) {
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "");
    } else if (jsonString.includes("```")) {
        jsonString = jsonString.replace(/```/g, "");
    }
    
    const rawQuestions = JSON.parse(jsonString.trim());
    
    return rawQuestions.map((q: any) => ({
      id: generateId(),
      text: q.text,
      type: q.type as QuestionType,
      options: q.options || []
    }));

  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
};

export const extractQuestionsFromData = async (base64Data: string, mimeType: string, language: 'ko' | 'en' = 'ko'): Promise<Question[]> => {
  try {
    const langPrompt = language === 'ko' ? 'Extract/Generate the questions in Korean.' : 'Extract/Generate the questions in English.';
    
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze the attached document/file. Extract survey questions from it or generate relevant survey questions based on its content.
            
            Format the output as a list of survey questions.
            Include a mix of Likert, Open-Ended, Multiple Choice/Select, and Section headers where appropriate based on the file content.
            
            ${langPrompt}`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The text of the question or section header" },
              type: { type: Type.STRING, enum: [QuestionType.LIKERT, QuestionType.OPEN_ENDED, QuestionType.MULTIPLE_CHOICE, QuestionType.MULTIPLE_SELECT, QuestionType.SECTION] },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options for multiple choice/select questions, empty if not applicable" }
            },
            required: ["text", "type"]
          }
        }
      }
    }));

    let jsonString = response.text || "[]";
    
    if (jsonString.includes("```json")) {
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "");
    } else if (jsonString.includes("```")) {
        jsonString = jsonString.replace(/```/g, "");
    }
    
    const rawQuestions = JSON.parse(jsonString.trim());
    
    return rawQuestions.map((q: any) => ({
      id: generateId(),
      text: q.text,
      type: q.type as QuestionType,
      options: q.options || []
    }));

  } catch (error) {
    console.error("Error extracting questions from file:", error);
    return [];
  }
};

export const analyzeSurveyResponses = async (
  survey: Survey, 
  responses: SurveyResponse[], 
  language: 'ko' | 'en' = 'ko',
  method: AnalysisMethod = AnalysisMethod.BASIC,
  university?: University
): Promise<AIAnalysisResult> => {
  try {
    // Professional Style Guide
    let styleGuide = "";
    if (language === 'ko') {
      styleGuide = `
      [Writing Persona & Style Guide]
      You are a Senior Data Analyst at a top-tier satisfaction research agency with 10+ years of experience.
      Your report must be:
      1. **Highly Professional:** Use formal administrative/business Korean (e.g., '확인됨', '분석됨', '판단됨', '시급함'). Avoid conversational endings like '해요' or '입니다'.
      2. **Data-Driven:** Every claim must be backed by the data (percentages, scores). Don't just say "many students", say "65% of students".
      3. **Strategic:** Focus on the 'Why' and 'So What'. Connect findings to institutional goals.
      4. **Structural:** Use bullet points and distinct sections for readability.
      `;
    } else {
      styleGuide = `
      [Writing Persona & Style Guide]
      You are a Senior Data Analyst at a top-tier satisfaction research agency with 10+ years of experience.
      Your report must be:
      1. **Highly Professional:** Use formal business English.
      2. **Data-Driven:** Every claim must be backed by the data.
      3. **Strategic:** Focus on actionable insights and institutional alignment.
      `;
    }

    // Flatten data for context
    const textData = responses.map(r => {
      return survey.questions.map(q => {
        if (q.type === QuestionType.SECTION) return null;
        const answer = r.answers[q.id];
        const answerStr = Array.isArray(answer) ? answer.join(', ') : answer;
        return `Q: ${q.text} | A: ${answerStr}`;
      }).filter(Boolean).join('\n');
    }).join('\n---\n');

    let prompt = "";
    let schema: Schema = { type: Type.OBJECT, properties: {}, required: [] };

    const commonSchemaProps = {
        summary: { type: Type.STRING, description: "Executive Summary. High-level overview of the most critical findings. Keep it under 200 words." },
        method: { type: Type.STRING, enum: [method] }
    };

    switch (method) {
      case AnalysisMethod.VISION:
        if (!university || !university.vision) {
            throw new Error("University Vision is missing");
        }
        prompt = `Perform a Deep Strategic Vision Alignment Analysis.
        
        **Context:** The Institution has defined a specific Vision/Mission Statement. We need to measure how well the current survey results reflect this vision.
        
        **Target Vision/Mission:** 
        "${university.vision}"
        
        **Analysis Steps:**
        1. **Deconstruct Vision:** Break down the vision statement into core values or goals (e.g., "Global Leader", "Creative Talent", "Student Welfare").
        2. **Map Evidence:** For each core value, scan the survey data (scores and comments) for evidence of alignment or misalignment.
        3. **Gap Analysis:** Identify specific discrepancies. E.g., if Vision says "Global Innovation" but students complain about "outdated facilities", that is a critical gap.
        4. **Scoring:** Calculate an 'Alignment Score' (0-100) based on the evidence.
        
        **Output Requirements:**
        - **Alignment Summary:** A detailed, professional narrative. Explicitly reference specific keywords from the Vision and connect them to specific survey findings. Conclude on whether the institution is "on track".
        - **Aligned Areas:** List specific survey topics where the results *validate* the vision.
        - **Gap Areas:** List specific survey topics where the results *contradict* the vision (Areas for Improvement).
        
        ${styleGuide}`;

        schema = {
            type: Type.OBJECT,
            properties: {
                ...commonSchemaProps,
                visionAnalysis: {
                    type: Type.OBJECT,
                    properties: {
                        alignmentScore: { type: Type.NUMBER, description: "0 to 100" },
                        alignmentSummary: { type: Type.STRING, description: "Detailed paragraph analyzing the connection between vision text and survey data." },
                        alignedAreas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of areas where the vision is successfully met." },
                        gapAreas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of areas where there is a gap between vision and reality." }
                    },
                    required: ["alignmentScore", "alignmentSummary", "alignedAreas", "gapAreas"]
                }
            },
            required: ["summary", "visionAnalysis", "method"]
        };
        break;

      case AnalysisMethod.IPA:
        prompt = `Perform a rigorous Importance-Performance Analysis (IPA).
        1. Calculate the Performance (Satisfaction) average (1-5) for each Likert item.
        2. Infer the Importance (1-5) based on the item's correlation with the overall positive sentiment found in open-ended answers, or explicit importance if available.
        3. Classify each item into the 4 Quadrants: 
           - Q1: Keep Up (High Imp, High Perf)
           - Q2: Concentrate Here (High Imp, Low Perf) - These are priority fixes.
           - Q3: Low Priority (Low Imp, Low Perf)
           - Q4: Possible Overkill (Low Imp, High Perf)
        ${styleGuide}`;
        
        schema = {
          type: Type.OBJECT,
          properties: {
            ...commonSchemaProps,
            ipaData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  importance: { type: Type.NUMBER, description: "Value 1-5" },
                  performance: { type: Type.NUMBER, description: "Value 1-5" }
                },
                required: ["label", "importance", "performance"]
              }
            }
          },
          required: ["summary", "ipaData", "method"]
        };
        break;

      case AnalysisMethod.BOXPLOT:
        prompt = `Perform a Statistical Variation Analysis (Box Plot Logic).
        Identify the spread of responses to understand consensus vs. polarization.
        - High variation means the issue is polarizing.
        - Low variation with low score means universal dissatisfaction.
        ${styleGuide}`;

        schema = {
          type: Type.OBJECT,
          properties: {
            ...commonSchemaProps,
            boxPlotData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  min: { type: Type.NUMBER },
                  q1: { type: Type.NUMBER },
                  median: { type: Type.NUMBER },
                  q3: { type: Type.NUMBER },
                  max: { type: Type.NUMBER }
                },
                required: ["label", "min", "q1", "median", "q3", "max"]
              }
            }
          },
          required: ["summary", "boxPlotData", "method"]
        };
        break;

      case AnalysisMethod.MCA:
        prompt = `Perform a Multiple Correspondence Analysis (MCA) simulation.
        Map relationships between different categorical answers (e.g., choice of 'Cafeteria' as priority linked with 'Dissatisfied' rating).
        Identify 2D coordinates to visualize these clusters.
        ${styleGuide}`;

        schema = {
          type: Type.OBJECT,
          properties: {
            ...commonSchemaProps,
            mcaData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  category: { type: Type.STRING }
                },
                required: ["label", "x", "y", "category"]
              }
            }
          },
          required: ["summary", "mcaData", "method"]
        };
        break;

      case AnalysisMethod.DEMOGRAPHIC:
        prompt = `Analyze Respondent Characteristics and Segmentation.
        Based on the data, identify key user personas or segments.
        Describe their distinct behaviors or satisfaction levels.
        ${styleGuide}`;

        schema = {
          type: Type.OBJECT,
          properties: {
            ...commonSchemaProps,
            demographicInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "demographicInsights", "method"]
        };
        break;

      case AnalysisMethod.BASIC:
      default:
        // Expanded Schema for Professional Report
        prompt = `Perform a Comprehensive Satisfaction Diagnosis.
        1. **Executive Summary:** A briefing for the University President.
        2. **Strengths:** Top 3 areas where the institution is excelling, backed by data.
        3. **Weaknesses/Pain Points:** Top 3 critical issues requiring immediate attention.
        4. **Detailed Diagnosis:** A deeper dive into *why* the scores are the way they are, using open-ended feedback as evidence.
        5. **Strategic Action Plan:** Concrete, actionable steps to improve satisfaction scores in the next semester.
        6. **Sentiment Score:** Overall index (0-100).
        7. **Key Themes:** 5 major topics mentioned.
        ${styleGuide}`;
        
        schema = {
          type: Type.OBJECT,
          properties: {
            ...commonSchemaProps,
            comprehensiveDiagnosis: { type: Type.STRING, description: "In-depth analysis paragraph explaining the root causes of the results." },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key strengths identified." },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key weaknesses/issues identified." },
            improvementStrategies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Concrete strategic recommendations." },
            keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            sentimentScore: { type: Type.INTEGER },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Short bullet points (Legacy support)." }
          },
          required: ["summary", "comprehensiveDiagnosis", "strengths", "weaknesses", "improvementStrategies", "keyThemes", "sentimentScore", "method"]
        };
        break;
    }

    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
      Task: ${prompt}
      
      Context:
      Survey Title: ${survey.title}
      Description: ${survey.description}
      
      Responses Data:
      ${textData}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    }));

    let jsonString = response.text || "{}";
    if (jsonString.includes("```json")) {
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "");
    } else if (jsonString.includes("```")) {
        jsonString = jsonString.replace(/```/g, "");
    }

    const result = JSON.parse(jsonString.trim());
    
    // Add metadata
    result.method = method; 
    result.id = generateId();
    result.createdAt = new Date().toISOString();

    return result as AIAnalysisResult;

  } catch (error: any) {
    console.error("Error analyzing responses:", error);
    
    const errorCode = error?.status || error?.error?.code || error?.code;
    const errorMessage = error?.message || "";
    const isRateLimit = errorCode === 429 || errorMessage.includes('429');

    return {
      id: generateId(),
      createdAt: new Date().toISOString(),
      method: method,
      summary: isRateLimit 
        ? "Analysis failed due to API quota limits (429). Please try again later or check your billing plan." 
        : `Could not generate analysis. ${error.message}`,
      status: 'FAILED',
      keyThemes: [],
      sentimentScore: 50,
      recommendations: []
    };
  }
};