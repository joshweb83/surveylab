import React, { useRef, useState, useEffect } from 'react';
import { Survey, SurveyResponse, University, PrizeDrawRecord } from '../types';
import { Button } from './Button';
import { Database, Download, Upload, FileJson, ShieldCheck, Sheet, Cloud, CloudRain, HelpCircle, ChevronDown, ChevronUp, Copy, Check, Clock, RefreshCw, Zap, CheckCircle2, Link as LinkIcon, Unlink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DataManagementProps {
  surveys: Survey[];
  responses: SurveyResponse[];
  universities: University[];
  prizeHistory: PrizeDrawRecord[];
  onRestoreData: (data: any) => void;
  // Cloud Sync Props
  scriptUrl: string;
  onScriptUrlChange: (url: string) => void;
  lastSyncTime: string | null;
  isSyncing: boolean;
}

export const DataManagement: React.FC<DataManagementProps> = ({ 
  surveys, 
  responses, 
  universities, 
  prizeHistory, 
  onRestoreData,
  scriptUrl,
  onScriptUrlChange,
  lastSyncTime,
  isSyncing
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showGuide, setShowGuide] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Local state for URL input to prevent auto-syncing while typing
  const [localUrl, setLocalUrl] = useState(scriptUrl || '');
  const [isEditing, setIsEditing] = useState(!scriptUrl);

  // Sync local state with prop if prop changes externally (e.g. initial load)
  useEffect(() => {
    if (scriptUrl) {
        setLocalUrl(scriptUrl);
        setIsEditing(false);
    }
  }, [scriptUrl]);

  const handleConnect = () => {
      if (!localUrl.trim()) return;
      onScriptUrlChange(localUrl);
      setIsEditing(false);
      // Triggering the parent prop change will automatically start the sync effect in App.tsx
  };

  const handleDisconnect = () => {
      if (window.confirm("Disconnecting will stop automatic backups to Google Sheets. Continue?")) {
          onScriptUrlChange('');
          setIsEditing(true);
      }
  };

  const handleManualSync = async () => {
      // This button is just a manual trigger for reassurance; the App.tsx effect handles data changes.
      if (!scriptUrl) return;
      try {
          const data = {
            surveys,
            responses,
            universities,
            prizeHistory,
            backupDate: new Date().toISOString(),
            version: '1.0'
          };
          
          // Using no-cors to match App.tsx (safest for GAS Web Apps)
          await fetch(scriptUrl, {
              method: 'POST',
              mode: 'no-cors',
              body: JSON.stringify(data),
              headers: { 'Content-Type': 'text/plain;charset=utf-8' }
          });
          
          alert(t('cloud_upload_success'));
      } catch (e) {
          console.error(e);
          alert(t('cloud_error'));
      }
  };

  // File Backup Logic
  const handleBackup = () => {
    const data = {
      surveys,
      responses,
      universities,
      prizeHistory,
      backupDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `itsjlab_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (!data.surveys && !data.responses) throw new Error("Invalid format");

        if (window.confirm(t('restore_warning'))) {
          onRestoreData(data);
          alert(t('restore_success'));
        }
      } catch (err) {
        console.error(err);
        alert(t('restore_fail'));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCloudDownload = async () => {
      if (!scriptUrl) return;
      try {
          const response = await fetch(scriptUrl);
          if (!response.ok) throw new Error('Network response was not ok');
          
          const text = await response.text();
          const data = JSON.parse(text);
          
          if (window.confirm(t('restore_warning'))) {
            onRestoreData(data);
            alert(t('cloud_download_success'));
          }
      } catch (e) {
          console.error(e);
          alert(t('cloud_error'));
      }
  };

  const copyScriptCode = () => {
      const code = `
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Backup_Raw');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({surveys:[], responses:[], universities:[], prizeHistory:[]})).setMimeType(ContentService.MimeType.JSON);
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return ContentService.createTextOutput("{}").setMimeType(ContentService.MimeType.JSON);
  
  var range = sheet.getRange(1, 1, lastRow, 1);
  var values = range.getValues();
  var json = values.map(function(r) { return r[0]; }).join("");
  
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var json = e.postData.contents;
    var data = JSON.parse(json);

    // 1. Save Raw JSON for Restore
    var rawSheet = getOrCreateSheet('Backup_Raw');
    rawSheet.clear();
    var chunks = json.match(/.{1,50000}/g) || [];
    for (var i = 0; i < chunks.length; i++) {
      rawSheet.getRange(i + 1, 1).setValue(chunks[i]);
    }

    // 2. Save Universities
    if (data.universities) {
      var sheet = getOrCreateSheet('Universities');
      sheet.clear();
      sheet.appendRow(['ID', 'Name', 'Region', 'StudentCount', 'Vision']);
      data.universities.forEach(function(u) {
        sheet.appendRow([u.id, u.name, u.region, u.studentCount, u.vision || '']);
      });
    }

    // 3. Save Surveys
    if (data.surveys) {
      var sheet = getOrCreateSheet('Surveys');
      sheet.clear();
      sheet.appendRow(['ID', 'Title', 'Status', 'QuestionCount', 'HasAnalysis', 'Created']);
      data.surveys.forEach(function(s) {
        var hasAnalysis = (s.analysisHistory && s.analysisHistory.length > 0) ? 'Yes' : 'No';
        sheet.appendRow([s.id, s.title, s.status, s.questions.length, hasAnalysis, s.createdAt]);
      });
    }

    // 4. Save Responses
    if (data.responses) {
      var sheet = getOrCreateSheet('Responses');
      sheet.clear();
      sheet.appendRow(['ID', 'SurveyID', 'SubmittedAt', 'Answers_JSON']);
      data.responses.forEach(function(r) {
        sheet.appendRow([r.id, r.surveyId, r.submittedAt, JSON.stringify(r.answers)]);
      });
    }

    // 5. Save Prize History
    if (data.prizeHistory) {
      var sheet = getOrCreateSheet('PrizeHistory');
      sheet.clear();
      sheet.appendRow(['ID', 'SurveyTitle', 'Prize', 'WinnersCount', 'Date']);
      data.prizeHistory.forEach(function(p) {
        sheet.appendRow([p.id, p.surveyTitle, p.prizeName || '', p.winnerCount, p.drawnAt]);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: e.toString()})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(name);
  }
  return sheet;
}
      `.trim();
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
  };

  const isBackedUp = !!lastSyncTime;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          {t('settings_title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('settings_desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Google Sheets Cloud Sync Section */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-green-200 dark:border-green-900/50 shadow-sm flex flex-col relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Sheet className="w-32 h-32 text-green-500" />
            </div>
            
            <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                            <Cloud className="w-6 h-6" />
                        </div>
                        {scriptUrl && !isEditing ? (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-xs font-bold animate-pulse">
                                <Zap className="w-3 h-3 fill-current" /> Auto-Sync Active
                             </div>
                        ) : (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold">
                                Not Connected
                             </div>
                        )}
                    </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('subtitle_cloud_sync')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {t('desc_cloud_sync')}
                </p>

                {/* Connection UI */}
                <div className="space-y-3 pt-2">
                    {isEditing ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">{t('label_script_url')}</label>
                            <input 
                                type="url" 
                                value={localUrl} 
                                onChange={(e) => setLocalUrl(e.target.value)}
                                placeholder={t('ph_script_url')}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <Button 
                                onClick={handleConnect} 
                                disabled={!localUrl} 
                                className="w-full bg-green-600 hover:bg-green-700 text-white border-none py-2.5"
                            >
                                <LinkIcon className="w-4 h-4" /> Connect & Start Sync
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-100 dark:border-green-800 space-y-3 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Connected URL</span>
                                <button onClick={handleDisconnect} className="text-xs text-red-500 hover:text-red-600 hover:underline flex items-center gap-1">
                                    <Unlink className="w-3 h-3" /> Disconnect
                                </button>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 font-mono truncate bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                {scriptUrl}
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-green-100 dark:border-green-800">
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {isSyncing ? (
                                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing changes...
                                        </span>
                                    ) : lastSyncTime ? (
                                        <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                                            <Clock className="w-3 h-3" /> Last saved: {lastSyncTime}
                                        </span>
                                    ) : (
                                        <span>Waiting for changes...</span>
                                    )}
                                </div>
                                
                                <button 
                                    onClick={handleManualSync}
                                    disabled={isSyncing}
                                    className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
                                >
                                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Now
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                     {scriptUrl && !isEditing && (
                        <Button 
                            onClick={handleCloudDownload} 
                            disabled={!scriptUrl || isSyncing}
                            variant="outline"
                            className="w-full bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300"
                        >
                            <CloudRain className="w-4 h-4" /> {t('btn_download_cloud')}
                        </Button>
                     )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded border border-slate-100 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <strong>Note:</strong> When connected, all new surveys and responses will be automatically saved to your Google Sheet database.
                </div>

                <button 
                    onClick={() => setShowGuide(!showGuide)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-2 mx-auto transition-colors"
                >
                    <HelpCircle className="w-3 h-3" />
                    {t('btn_how_to')}
                    {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showGuide && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">{t('cloud_guide_title')}</h4>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-xs">
                            <li>{t('cloud_guide_step1')}</li>
                            <li>{t('cloud_guide_step2')}</li>
                            <li>{t('cloud_guide_step3')}</li>
                            <li className="flex items-center gap-2 mt-2">
                                <Button onClick={copyScriptCode} variant="outline" className="h-6 text-[10px] px-2">
                                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} 
                                    {copiedCode ? "Copied" : "Copy Code"}
                                </Button>
                            </li>
                            <li className="mt-2">{t('cloud_guide_step4')}</li>
                            <li>{t('cloud_guide_step5')} <strong className="text-red-500">Important!</strong></li>
                            <li>{t('cloud_guide_step6')}</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>

        {/* Local File Backup Section */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('subtitle_file_backup')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {t('desc_file_backup')}
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {t('backup_warning')}
            </div>
          </div>
          
          <div className="mt-8 space-y-3">
            <Button onClick={handleBackup} className="w-full py-3" variant="primary">
              <FileJson className="w-4 h-4" /> {t('btn_backup')}
            </Button>
            
            <div className="relative">
                <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/json" 
                onChange={handleRestore}
                />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full py-3" variant="outline">
                <Upload className="w-4 h-4" /> {t('btn_restore')}
                </Button>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <h4 className="font-bold text-slate-800 dark:text-white mb-4">Current Data Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
           <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
             <span className="block text-slate-400 mb-1">Surveys</span>
             <span className="text-xl font-bold text-slate-800 dark:text-white">{surveys.length}</span>
             {isBackedUp && (
                 <div className="absolute top-2 right-2 text-green-500" title={`Synced: ${lastSyncTime}`}>
                     <CheckCircle2 className="w-4 h-4" />
                 </div>
             )}
           </div>
           <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
             <span className="block text-slate-400 mb-1">Responses</span>
             <span className="text-xl font-bold text-slate-800 dark:text-white">{responses.length}</span>
             {isBackedUp && (
                 <div className="absolute top-2 right-2 text-green-500" title={`Synced: ${lastSyncTime}`}>
                     <CheckCircle2 className="w-4 h-4" />
                 </div>
             )}
           </div>
           <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
             <span className="block text-slate-400 mb-1">Universities</span>
             <span className="text-xl font-bold text-slate-800 dark:text-white">{universities.length}</span>
             {isBackedUp && (
                 <div className="absolute top-2 right-2 text-green-500" title={`Synced: ${lastSyncTime}`}>
                     <CheckCircle2 className="w-4 h-4" />
                 </div>
             )}
           </div>
           <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
             <span className="block text-slate-400 mb-1">Prize Draws</span>
             <span className="text-xl font-bold text-slate-800 dark:text-white">{prizeHistory.length}</span>
             {isBackedUp && (
                 <div className="absolute top-2 right-2 text-green-500" title={`Synced: ${lastSyncTime}`}>
                     <CheckCircle2 className="w-4 h-4" />
                 </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};