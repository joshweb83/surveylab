import React, { useState } from 'react';
import { University } from '../types';
import { Button } from './Button';
import { School, MapPin, Users, Plus, Trash2, Edit2, Target } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface UniversityManagementProps {
  universities: University[];
  onAddUniversity: (u: University) => void;
  onUpdateUniversity: (u: University) => void;
  onDeleteUniversity: (id: string) => void;
}

export const UniversityManagement: React.FC<UniversityManagementProps> = ({ 
  universities, 
  onAddUniversity, 
  onUpdateUniversity, 
  onDeleteUniversity 
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [vision, setVision] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentId) {
      // Update
      const updated: University = {
        id: currentId,
        name,
        region,
        studentCount: parseInt(studentCount) || 0,
        logoColor: universities.find(u => u.id === currentId)?.logoColor || 'bg-blue-100',
        vision
      };
      onUpdateUniversity(updated);
    } else {
      // Create
      const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-red-100'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newUniv: University = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        region,
        studentCount: parseInt(studentCount) || 0,
        logoColor: randomColor,
        vision
      };
      onAddUniversity(newUniv);
    }
    
    resetForm();
  };

  const handleEdit = (u: University) => {
    setIsEditing(true);
    setCurrentId(u.id);
    setName(u.name);
    setRegion(u.region);
    setStudentCount(u.studentCount.toString());
    setVision(u.vision || '');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this university?')) {
      onDeleteUniversity(id);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setRegion('');
    setStudentCount('');
    setVision('');
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <School className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          {t('univ_title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('univ_desc')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Section */}
        <div className="lg:w-1/3">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              {isEditing ? 'Edit University' : t('btn_add_univ')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('univ_name')}</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('ph_univ_name')}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('univ_region')}</label>
                <input 
                  type="text" 
                  required
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder={t('ph_univ_region')}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('univ_students')}</label>
                <input 
                  type="number" 
                  required
                  value={studentCount}
                  onChange={(e) => setStudentCount(e.target.value)}
                  placeholder={t('ph_univ_students')}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('univ_vision')}</label>
                <textarea 
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder={t('ph_univ_vision')}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                )}
                <Button type="submit" variant="primary" className="flex-1">
                   {isEditing ? 'Update' : t('btn_add_univ')}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:w-2/3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {universities.map(u => (
              <div key={u.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${u.logoColor || 'bg-blue-100'} text-slate-700 dark:text-slate-800`}>
                        <School className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{u.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          ID: {u.id.substring(0,6)}...
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      {u.region}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      {u.studentCount.toLocaleString()} Students
                    </div>
                  </div>

                  {u.vision && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1">
                              <Target className="w-3 h-3" /> Vision
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 italic line-clamp-2">
                              "{u.vision}"
                          </p>
                      </div>
                  )}
                </div>
              </div>
            ))}

            {universities.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                 <School className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                 <p className="text-slate-500 dark:text-slate-400">{t('univ_empty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};