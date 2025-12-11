import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ko: {
    app_name: "SurveyLab",
    app_subtitle: "기관 만족도 조사 및 분석 시스템",
    nav_dashboard: "대시보드",
    nav_university: "기관 관리",
    nav_create: "설문 생성",
    nav_management: "설문 관리",
    nav_analytics: "분석 관리",
    nav_prize: "추첨 관리",
    nav_settings: "데이터 관리",
    user_role: "관리자 (교직원)",
    
    // Dashboard
    dash_title: "관리자 대시보드",
    dash_welcome: "환영합니다. 오늘의 현황입니다.",
    btn_create: "새 설문 만들기",
    stat_active: "진행 중인 설문",
    stat_responses: "총 응답 수",
    stat_satisfaction: "평균 만족도",
    stat_attention: "조치 필요",
    trend_title: "응답 추세 (이번 주)",
    recent_surveys: "최근 설문",
    no_surveys: "생성된 설문이 없습니다.",
    btn_analytics: "분석 보기",
    btn_preview: "미리보기",
    btn_share: "공유",
    btn_edit: "수정",
    btn_manage: "설문 관리",
    link_univ_manage: "관리",
    status_active: "진행중",
    status_draft: "초안",
    status_completed: "완료",

    // University Management
    univ_title: "참여기관",
    univ_desc: "시스템에 등록된 기관 목록을 관리하고 기본 정보를 설정합니다.",
    univ_name: "기관명",
    univ_region: "지역",
    univ_students: "구성원 수",
    univ_vision: "기관 비전/목표",
    btn_add_univ: "기관 등록",
    ph_univ_name: "예: 한국대학교",
    ph_univ_region: "예: 서울",
    ph_univ_students: "예: 15000",
    ph_univ_vision: "예: 창의적 인재 양성과 글로벌 리더십 함양",
    univ_empty: "등록된 기관이 없습니다.",

    // Create / Edit
    create_title: "새 설문 만들기",
    edit_title: "설문 수정",
    create_desc: "기관 내 만족도 조사를 AI와 함께 체계적으로 설계해보세요.",
    edit_desc: "기존 설문의 내용을 수정합니다.",
    label_univ: "대상 기관", 
    ph_select_univ: "기관을 선택하세요", 
    label_topic: "설문 주제 / 제목",
    ph_topic: "예: 1학기 학생 식당 만족도 조사",
    label_desc: "설명 (AI 프롬프트/메모)", 
    ph_desc: "AI가 참고할 상세 내용이나 질문 방향을 입력하세요...", 
    label_intro_msg: "시작 페이지 메시지 (안내문)",
    ph_intro_msg: "학생들에게 보여질 환영 메시지를 입력하세요. (AI 자동 생성 가능)",
    label_closing_msg: "종료 페이지 메시지 (감사인사)",
    ph_closing_msg: "설문에 참여해주셔서 감사합니다.",
    btn_ai_msg: "AI 메시지 생성",
    label_redirect_url: "종료 후 이동할 링크 (선택)",
    ph_redirect_url: "예: https://www.school.ac.kr (입력하지 않으면 종료 페이지 유지)",
    section_questions: "질문 목록",
    btn_ai_gen: "AI 생성",
    btn_upload_file: "파일 업로드",
    btn_manual: "질문 추가", 
    btn_add_section: "구분 추가", 
    btn_add_content: "내용 추가",
    btn_add_image: "이미지 추가",
    btn_remove_image: "이미지 삭제",
    label_q_count: "문항 수",
    label_q_text: "질문 내용",
    label_content_text: "메시지 내용",
    label_q_type: "유형",
    ph_q_text: "질문을 입력하세요...",
    type_likert: "5점 척도",
    type_open: "주관식",
    type_multi: "객관식 (단일 선택)",
    type_multiselect: "다중 선택 (체크박스)",
    type_section: "구분 (섹션 헤더)",
    type_info: "안내 메시지 (이미지/텍스트)",
    label_options: "옵션 (쉼표로 구분)",
    ph_options: "옵션 1, 옵션 2, 옵션 3",
    empty_questions: "아직 질문이 없습니다.",
    empty_hint: "'AI 생성'을 누르거나 파일을 업로드해보세요.",
    btn_publish: "설문 게시",
    btn_update: "수정 완료",
    alert_topic: "설문 주제를 먼저 입력해주세요.",
    alert_min_q: "최소 하나의 질문을 추가해주세요.",
    upload_success: "파일에서 질문을 성공적으로 추출했습니다.",
    upload_fail: "파일 분석에 실패했습니다.",

    // Share Dialog
    share_title: "설문 공유하기",
    share_desc: "아래 링크나 QR코드를 통해 설문을 배포하세요.",
    label_link: "설문 링크",
    btn_copy: "복사",
    copied: "복사됨!",
    btn_close: "닫기",

    // Taker Intro
    taker_intro_questions: "총 문항 수",
    taker_intro_time: "소요 시간",
    taker_intro_min: "분",
    taker_intro_start: "설문 시작하기",
    taker_intro_anonymous: "이 설문은 익명으로 진행됩니다.",

    // Taker
    taker_q_of: "문항",
    taker_completed: "완료",
    taker_submit: "제출",
    taker_next: "다음",
    taker_back: "이전",
    taker_thank_you: "감사합니다!",
    taker_thank_msg: "여러분의 소중한 의견은 기관 발전에 큰 도움이 됩니다.",
    taker_return: "대시보드로 돌아가기",
    taker_redirecting: "잠시 후 설정된 페이지로 이동합니다...",
    btn_go_now: "지금 이동",
    likert_1: "매우 그렇지 않다",
    likert_2: "그렇지 않다",
    likert_3: "보통이다",
    likert_4: "그렇다",
    likert_5: "매우 그렇다",
    
    // Analytics
    anal_title: "분석 및 인사이트",
    btn_analyzing: "생성 중...", 
    btn_run_analysis: "AI 분석 추가", 
    btn_view_sheet: "설문시트 보기",
    btn_view_questions: "질문내용 보기",
    ai_summary_title: "AI 분석 리포트",
    label_overview: "개요 (Executive Summary)",
    label_themes: "핵심 키워드",
    label_sentiment: "종합 감성 지수 (Satisfaction Index)",
    label_recommendations: "실행 권고안",
    label_recent_responses: "최근 주관식 응답",
    alert_no_res: "아직 분석할 응답이 없습니다.",
    survey_list_title: "설문 관리",
    survey_list_desc: "등록된 설문의 상태를 관리하고 분석 리포트를 확인합니다.",
    create_first: "첫 번째 설문을 만들어보세요.",
    preview_link: "링크 미리보기",
    status_pending: "분석 생성 중...",
    status_failed: "분석 실패",
    
    // Professional Report
    report_strengths: "주요 강점 (Key Strengths)",
    report_weaknesses: "개선 필요 영역 (Weaknesses)",
    report_diagnosis: "상세 진단 (Diagnosis)",
    report_strategy: "전략적 제언 (Strategic Action Plan)",

    // Analytics Management
    analytics_mgmt_title: "분석 통합 관리",
    analytics_mgmt_desc: "모든 설문의 데이터 분석 현황과 만족도 지표를 통합적으로 관리합니다.",
    lbl_overall_trend: "설문별 종합 점수 비교",
    btn_go_analyze: "상세 분석 이동",
    score_label: "종합 점수",
    btn_import_external: "외부자료 가져오기",
    tag_external: "외부자료",
    import_success: "성공적으로 데이터를 가져왔습니다.",
    import_error: "파일을 읽는 중 오류가 발생했습니다.",
    
    // Analysis Methods & History
    method_select: "분석 기법 선택",
    method_basic: "종합분석",
    method_ipa: "중요도 분석(IPA)",
    method_boxplot: "통계분석(Boxplot)",
    method_mca: "다중대응분석(MCA)",
    method_demographic: "응답자 분석",
    method_vision: "비전 분석",

    // Analysis Method Descriptions
    desc_method_basic: "전체 응답에 대한 전문적인 종합 진단, 강점/약점 분석, 및 전략적 실행 계획을 제공합니다.",
    desc_method_ipa: "각 항목의 중요도와 만족도를 4분면 매트릭스로 시각화하여 우선적으로 개선해야 할 영역을 도출합니다.",
    desc_method_boxplot: "응답 데이터의 최소값, 최대값, 중앙값 등 통계적 분포를 박스플롯 형태로 시각화하여 편차를 분석합니다.",
    desc_method_mca: "문항 간의 연관성과 응답 패턴을 기하학적으로 맵핑하여 숨겨진 상관관계를 파악합니다.",
    desc_method_demographic: "응답자의 특성 및 유형을 분류하여 사용자 세그먼트별 인사이트를 제공합니다.",
    desc_method_vision: "기관의 비전/목표와 실제 설문 결과 간의 일치도를 분석하여 정렬(Alignment) 수준을 평가합니다.",
    
    history_title: "분석 히스토리",
    history_empty: "저장된 분석 내역이 없습니다.",
    btn_delete_report: "삭제",
    btn_regenerate: "다시 분석",
    btn_download_pdf: "PDF 다운로드",
    btn_download_word: "Word 다운로드",
    report_date: "생성일",
    
    // Survey Control
    btn_start_survey: "설문 시작",
    btn_end_survey: "설문중", 
    btn_restart_survey: "설문시작",

    // Data Table
    table_summary_title: "데이터 요약표",
    col_question: "문항",
    col_mean: "평균 (Mean)",
    col_std_dev: "표준편차 (SD)",
    col_count: "응답수 (N)",

    // Charts
    chart_importance: "중요도 (Importance) [1-5]",
    chart_performance: "만족도 (Performance) [1-5]",
    chart_boxplot_y: "문항 (Question Items)",
    chart_boxplot_x: "Score [1-5]",
    chart_mca_x: "Dimension 1",
    chart_mca_y: "Dimension 2",
    chart_quadrant_1: "유지 강화 (Keep Up)",
    chart_quadrant_2: "중점 개선 (Concentrate)",
    chart_quadrant_3: "저순위 (Low Priority)",
    chart_quadrant_4: "과잉 노력 (Possible Overkill)",
    chart_min: "최소",
    chart_max: "최대",
    chart_median: "중앙값",
    
    // Sheet View
    sheet_title: "응답 데이터 시트",
    sheet_desc: "모든 응답 데이터를 테이블 형식으로 확인하고 관리합니다.",
    questions_sheet_title: "설문 질문 목록",
    questions_sheet_desc: "View survey structure and options.",
    col_type: "Question Type",
    col_options: "Options",
    btn_export_csv: "Export CSV",
    col_time: "Submitted At",
    no_responses_yet: "No responses found.",
    back_to_analytics: "Back to Analytics",

    // Management
    lbl_participation: "Participation",
    count_responses: "responses",

    // Prize Draw
    btn_prize_draw: "Prize Draw",
    draw_title: "Prize Management",
    draw_desc: "Select a survey and randomly pick winners from the respondents.",
    label_select_survey: "Select Survey",
    ph_select_survey: "Choose a survey...",
    label_prize_name: "Prize Item (Optional)",
    ph_prize_name: "e.g., Starbucks Gift Card",
    label_winner_count: "Number of Winners",
    btn_draw_start: "Draw Winners",
    draw_winners_title: "🎉 Winners List 🎉",
    draw_winner_id: "Response ID",
    draw_winner_time: "Submitted Time",
    draw_no_survey: "No survey selected.",
    draw_no_responses: "No responses to draw from.",

    // Filters
    filter_univ: "Filter by Institution",
    filter_all: "All Institutions",

    // Data Management (Settings)
    settings_title: "데이터 관리 및 백업",
    settings_desc: "시스템의 모든 데이터를 파일/클라우드로 백업하거나 복구합니다. 배포 후 데이터 유실을 방지하기 위해 사용하세요.",
    
    // File Backup
    subtitle_file_backup: "파일 백업 (로컬)",
    desc_file_backup: "기관 정보, 설문 내용, 응답 데이터(분석 결과 포함), 추첨 내역 등 모든 데이터를 JSON 파일로 다운로드합니다.",
    btn_backup: "전체 데이터 파일 다운로드",
    btn_restore: "전체 데이터 파일 업로드",
    backup_warning: "주의: 개인 정보가 포함된 파일은 안전한 곳에 보관하세요.",
    restore_warning: "주의: 복구 시 현재 저장된 모든 데이터가 덮어씌워집니다.",
    restore_success: "데이터가 성공적으로 복구되었습니다.",
    restore_fail: "복구 파일 형식이 올바르지 않습니다.",

    // Cloud Sync
    subtitle_cloud_sync: "구글 시트 연동 (클라우드 저장소)",
    desc_cloud_sync: "구글 스프레드시트를 데이터베이스로 활용하여 데이터를 동기화합니다. 배포가 바뀌어도 데이터를 유지할 수 있습니다.",
    label_script_url: "Google Apps Script 웹 앱 URL",
    ph_script_url: "https://script.google.com/macros/s/.../exec",
    btn_upload_cloud: "구글 시트에 저장 (업로드)",
    btn_download_cloud: "구글 시트에서 불러오기",
    btn_how_to: "설정 방법 보기",
    cloud_upload_success: "구글 시트에 데이터를 성공적으로 저장했습니다.",
    cloud_download_success: "구글 시트에서 데이터를 성공적으로 불러왔습니다.",
    cloud_error: "연동 오류: URL을 확인하거나 스크립트 배포 상태를 확인하세요.",
    cloud_guide_title: "구글 시트 연동 스크립트 설정 방법",
    cloud_guide_step1: "1. 구글 스프레드시트를 새로 만듭니다.",
    cloud_guide_step2: "2. 확장 프로그램 > Apps Script로 이동합니다.",
    cloud_guide_step3: "3. 아래 코드를 붙여넣고 저장합니다.",
    cloud_guide_step4: "4. '배포' > '새 배포' > 유형: '웹 앱' 선택",
    cloud_guide_step5: "5. 액세스 권한: '모든 사용자(Anyone)'로 설정 후 배포.",
    cloud_guide_step6: "6. 생성된 '웹 앱 URL'을 복사하여 위 입력창에 넣으세요.",

    // Vision Analysis
    vision_not_found: "기관 비전/목표 정보 미등록",
    vision_not_found_desc: "기관 관리 메뉴에서 비전/목표 내용을 먼저 등록해주세요. 해당 정보가 있어야 분석이 가능합니다.",
    lbl_vision_text: "Target Vision",
    lbl_alignment_score: "Alignment Score",
    lbl_gap_analysis: "Gap Analysis",
    
    // Common
    loading: "Loading...",
  },
  en: {
    app_name: "SurveyLab",
    app_subtitle: "Institutional Satisfaction Survey & Analysis System",
    nav_dashboard: "Dashboard",
    nav_university: "Institutions",
    nav_create: "Create Survey",
    nav_management: "Manage Surveys",
    nav_analytics: "Analytics",
    nav_prize: "Prize Draw",
    nav_settings: "Data Management",
    user_role: "Admin (Staff)",
    
    // Dashboard
    dash_title: "Admin Dashboard",
    dash_welcome: "Welcome back. Here is today's overview.",
    btn_create: "New Survey",
    stat_active: "Active Surveys",
    stat_responses: "Total Responses",
    stat_satisfaction: "Avg Satisfaction",
    stat_attention: "Needs Attention",
    trend_title: "Response Trend (Weekly)",
    recent_surveys: "Recent Surveys",
    no_surveys: "No surveys created yet.",
    btn_analytics: "View Analysis",
    btn_preview: "Preview",
    btn_share: "Share",
    btn_edit: "Edit",
    btn_manage: "Manage",
    link_univ_manage: "Manage",
    status_active: "Active",
    status_draft: "Draft",
    status_completed: "Completed",

    // University Management
    univ_title: "Institutions",
    univ_desc: "Manage registered institutions and their basic information.",
    univ_name: "Institution Name",
    univ_region: "Region",
    univ_students: "Member Count",
    univ_vision: "Vision/Mission",
    btn_add_univ: "Add Institution",
    ph_univ_name: "e.g., Korea University",
    ph_univ_region: "e.g., Seoul",
    ph_univ_students: "e.g., 15000",
    ph_univ_vision: "e.g., Fostering creative talents and global leadership",
    univ_empty: "No institutions registered.",

    // Create / Edit
    create_title: "Create New Survey",
    edit_title: "Edit Survey",
    create_desc: "Design a systematic satisfaction survey with AI assistance.",
    edit_desc: "Modify the content of an existing survey.",
    label_univ: "Target Institution", 
    ph_select_univ: "Select an institution", 
    label_topic: "Survey Topic / Title",
    ph_topic: "e.g., 1st Semester Cafeteria Satisfaction Survey",
    label_desc: "Description (AI Prompt/Memo)", 
    ph_desc: "Enter details or direction for AI generation...", 
    label_intro_msg: "Intro Message (Welcome)",
    ph_intro_msg: "Enter a welcome message for students. (AI generation available)",
    label_closing_msg: "Closing Message (Thank You)",
    ph_closing_msg: "Thank you for participating in the survey.",
    btn_ai_msg: "Generate AI Message",
    label_redirect_url: "Redirect URL (Optional)",
    ph_redirect_url: "e.g., https://www.school.ac.kr (Stays on closing page if empty)",
    section_questions: "Questions",
    btn_ai_gen: "AI Generate",
    btn_upload_file: "Upload File",
    btn_manual: "Add Question", 
    btn_add_section: "Add Section", 
    btn_add_content: "Add Content",
    btn_add_image: "Add Image",
    btn_remove_image: "Remove Image",
    label_q_count: "Count",
    label_q_text: "Question Text",
    label_content_text: "Message Content",
    label_q_type: "Type",
    ph_q_text: "Enter your question...",
    type_likert: "Likert Scale (1-5)",
    type_open: "Open Ended",
    type_multi: "Multiple Choice",
    type_multiselect: "Multiple Select (Checkbox)",
    type_section: "Section Header",
    type_info: "Info Message (Image/Text)",
    label_options: "Options (comma separated)",
    ph_options: "Option 1, Option 2, Option 3",
    empty_questions: "No questions yet.",
    empty_hint: "Click 'AI Generate' or upload a file.",
    btn_publish: "Publish Survey",
    btn_update: "Update Survey",
    alert_topic: "Please enter a survey topic first.",
    alert_min_q: "Please add at least one question.",
    upload_success: "Successfully extracted questions from file.",
    upload_fail: "Failed to analyze file.",

    // Share Dialog
    share_title: "Share Survey",
    share_desc: "Distribute the survey via link or QR code.",
    label_link: "Survey Link",
    btn_copy: "Copy",
    copied: "Copied!",
    btn_close: "Close",

    // Taker Intro
    taker_intro_questions: "Questions",
    taker_intro_time: "Est. Time",
    taker_intro_min: "min",
    taker_intro_start: "Start Survey",
    taker_intro_anonymous: "This survey is anonymous.",

    // Taker
    taker_q_of: "Question",
    taker_completed: "Completed",
    taker_submit: "Submit",
    taker_next: "Next",
    taker_back: "Back",
    taker_thank_you: "Thank You!",
    taker_thank_msg: "Your feedback is valuable for our institution's improvement.",
    taker_return: "Return to Dashboard",
    taker_redirecting: "Redirecting to configured page...",
    btn_go_now: "Go Now",
    likert_1: "Strongly Disagree",
    likert_2: "Disagree",
    likert_3: "Neutral",
    likert_4: "Agree",
    likert_5: "Strongly Agree",
    
    // Analytics
    anal_title: "Analysis & Insights",
    btn_analyzing: "Analyzing...", 
    btn_run_analysis: "Run AI Analysis", 
    btn_view_sheet: "View Data Sheet",
    btn_view_questions: "View Questions",
    ai_summary_title: "AI Analysis Report",
    label_overview: "Executive Summary",
    label_themes: "Key Themes",
    label_sentiment: "Satisfaction Index",
    label_recommendations: "Recommendations",
    label_recent_responses: "Recent Responses",
    alert_no_res: "No responses to analyze yet.",
    survey_list_title: "Survey Management",
    survey_list_desc: "Manage survey status and view analysis reports.",
    create_first: "Create your first survey.",
    preview_link: "Preview Link",
    status_pending: "Generating...",
    status_failed: "Analysis Failed",
    
    // Professional Report
    report_strengths: "Key Strengths",
    report_weaknesses: "Weaknesses",
    report_diagnosis: "Detailed Diagnosis",
    report_strategy: "Strategic Action Plan",

    // Analytics Management
    analytics_mgmt_title: "Integrated Analytics",
    analytics_mgmt_desc: "Manage data analysis status and satisfaction metrics for all surveys.",
    lbl_overall_trend: "Overall Score Comparison",
    btn_go_analyze: "Go to Analysis",
    score_label: "Overall Score",
    btn_import_external: "Import External Data",
    tag_external: "External",
    import_success: "Data imported successfully.",
    import_error: "Error reading file.",
    
    // Analysis Methods & History
    method_select: "Select Analysis Method",
    method_basic: "Comprehensive",
    method_ipa: "IPA Analysis",
    method_boxplot: "Statistical (Boxplot)",
    method_mca: "MCA Analysis",
    method_demographic: "Demographics",
    method_vision: "Vision Alignment",

    // Analysis Method Descriptions
    desc_method_basic: "Provides a professional comprehensive diagnosis, SWOT analysis, and strategic action plan based on all responses.",
    desc_method_ipa: "Visualizes importance and satisfaction in a 4-quadrant matrix to identify priority improvement areas.",
    desc_method_boxplot: "Visualizes statistical distribution (min, max, median) of responses to analyze deviation.",
    desc_method_mca: "Geometrically maps relationships and response patterns between questions to find hidden correlations.",
    desc_method_demographic: "Classifies respondent characteristics and types to provide insights by user segment.",
    desc_method_vision: "Analyzes the alignment between the institution's vision/goals and actual survey results.",
    
    history_title: "Analysis History",
    history_empty: "No analysis history saved.",
    btn_delete_report: "Delete",
    btn_regenerate: "Re-analyze",
    btn_download_pdf: "Download PDF",
    btn_download_word: "Download Word",
    report_date: "Date",
    
    // Survey Control
    btn_start_survey: "Start Survey",
    btn_end_survey: "End Survey", 
    btn_restart_survey: "Restart Survey",

    // Data Table
    table_summary_title: "Data Summary Table",
    col_question: "Question",
    col_mean: "Mean",
    col_std_dev: "Std Dev (SD)",
    col_count: "Count (N)",

    // Charts
    chart_importance: "Importance [1-5]",
    chart_performance: "Performance [1-5]",
    chart_boxplot_y: "Question Items",
    chart_boxplot_x: "Score [1-5]",
    chart_mca_x: "Dimension 1",
    chart_mca_y: "Dimension 2",
    chart_quadrant_1: "Keep Up",
    chart_quadrant_2: "Concentrate Here",
    chart_quadrant_3: "Low Priority",
    chart_quadrant_4: "Possible Overkill",
    chart_min: "Min",
    chart_max: "Max",
    chart_median: "Median",
    
    // Sheet View
    sheet_title: "Response Data Sheet",
    sheet_desc: "View and manage all response data in table format.",
    questions_sheet_title: "Survey Question List",
    questions_sheet_desc: "View survey structure and options.",
    col_type: "Question Type",
    col_options: "Options",
    btn_export_csv: "Export CSV",
    col_time: "Submitted At",
    no_responses_yet: "No responses found.",
    back_to_analytics: "Back to Analytics",

    // Management
    lbl_participation: "Participation",
    count_responses: "responses",

    // Prize Draw
    btn_prize_draw: "Prize Draw",
    draw_title: "Prize Management",
    draw_desc: "Select a survey and randomly pick winners from the respondents.",
    label_select_survey: "Select Survey",
    ph_select_survey: "Choose a survey...",
    label_prize_name: "Prize Item (Optional)",
    ph_prize_name: "e.g., Starbucks Gift Card",
    label_winner_count: "Number of Winners",
    btn_draw_start: "Draw Winners",
    draw_winners_title: "🎉 Winners List 🎉",
    draw_winner_id: "Response ID",
    draw_winner_time: "Submitted Time",
    draw_no_survey: "No survey selected.",
    draw_no_responses: "No responses to draw from.",

    // Filters
    filter_univ: "Filter by Institution",
    filter_all: "All Institutions",

    // Data Management (Settings)
    settings_title: "Data Management & Backup",
    settings_desc: "Backup or restore all system data via file or cloud. Use this to prevent data loss across deployments.",
    
    // File Backup
    subtitle_file_backup: "File Backup (Local)",
    desc_file_backup: "Download all data including institution info, surveys, responses (including analysis), and draw history as a JSON file.",
    btn_backup: "Download All Data",
    btn_restore: "Upload Data File",
    backup_warning: "Warning: Keep files containing personal information secure.",
    restore_warning: "Warning: Restoring will overwrite all current data.",
    restore_success: "Data restored successfully.",
    restore_fail: "Invalid backup file format.",

    // Cloud Sync
    subtitle_cloud_sync: "Google Sheets Sync (Cloud Storage)",
    desc_cloud_sync: "Sync data using Google Sheets as a database. Maintains data even if deployment changes.",
    label_script_url: "Google Apps Script Web App URL",
    ph_script_url: "https://script.google.com/macros/s/.../exec",
    btn_upload_cloud: "Save to Sheets (Upload)",
    btn_download_cloud: "Load from Sheets",
    btn_how_to: "Setup Instructions",
    cloud_upload_success: "Successfully saved data to Google Sheets.",
    cloud_download_success: "Successfully loaded data from Google Sheets.",
    cloud_error: "Sync Error: Check URL or script deployment status.",
    cloud_guide_title: "How to setup Google Sheets Sync Script",
    cloud_guide_step1: "1. Create a new Google Spreadsheet.",
    cloud_guide_step2: "2. Go to Extensions > Apps Script.",
    cloud_guide_step3: "3. Paste the code below and save.",
    cloud_guide_step4: "4. 'Deploy' > 'New deployment' > Type: 'Web app'",
    cloud_guide_step5: "5. Access: Set to 'Anyone' and deploy.",
    cloud_guide_step6: "6. Copy the generated 'Web App URL' into the field above.",

    // Vision Analysis
    vision_not_found: "Institution Vision is missing.",
    vision_not_found_desc: "Please update the institution details with a vision statement to use this feature.",
    lbl_vision_text: "Target Vision",
    lbl_alignment_score: "Alignment Score",
    lbl_gap_analysis: "Gap Analysis",
    
    // Common
    loading: "Loading...",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};