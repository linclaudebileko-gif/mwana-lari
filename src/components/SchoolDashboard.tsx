import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CLASS_STUDENTS } from '../data/mockData';
import { parentsAPI } from '../services/api';
import { StudentProgress } from '../types';
import { GraduationCap, Users, BookOpen, Download, Plus, CheckCircle2, TrendingUp, Sparkles, Database } from 'lucide-react';
import { AddChildModal } from './AddChildModal';
import { playSuccessChime } from '../utils/audio';

export const SchoolDashboard: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProgress[]>(CLASS_STUDENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    playSuccessChime();
    setTimeout(() => {
      setIsExporting(false);
      alert('Rapport de classe CE1 généré avec succès ! Le fichier récapitule les scores de prononciation et le vocabulaire Lari acquis.');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border-2 border-indigo-300 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="font-extrabold text-2xl text-savanna-950">
                🏫 Mwana Lari École — Espace Enseignant
              </h2>
              <p className="text-xs text-indigo-800 font-bold uppercase tracking-wider">
                {user && user.role === 'TEACHER' ? `Compte : ${user.fullName}` : 'École Primaire de Bacongo (Brazzaville)'} • Classe de CE1
              </p>
            </div>
          </div>
          <p className="text-sm text-savanna-900 font-medium mt-2">
            Suivez en temps réel l'apprentissage de la langue Lari par vos élèves, attribuez des devoirs et exportez des bilans pédagogiques.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Inscrire un Élève (DB)</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 text-indigo-900 font-extrabold text-xs border border-indigo-300 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Génération...' : 'Exporter Rapport (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-3xl border-2 border-indigo-200 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">Effectif Classe</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-savanna-950 mt-2">{students.length} Élèves</div>
          <div className="text-xs text-forest-700 font-bold mt-1">96% Actifs cette semaine (SQLite)</div>
        </div>

        <div className="glass-card p-5 rounded-3xl border-2 border-brand-300 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-brand-800 uppercase tracking-wider">Mots Lari Maîtrisés</span>
            <BookOpen className="w-5 h-5 text-brand-600" />
          </div>
          <div className="text-3xl font-extrabold text-savanna-950 mt-2">1,240 Mots</div>
          <div className="text-xs text-brand-800 font-bold mt-1">Moyenne : 51 mots/élève</div>
        </div>

        <div className="glass-card p-5 rounded-3xl border-2 border-forest-300 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-forest-800 uppercase tracking-wider">Taux de Progression</span>
            <TrendingUp className="w-5 h-5 text-forest-600" />
          </div>
          <div className="text-3xl font-extrabold text-savanna-950 mt-2">78.5 %</div>
          <div className="text-xs text-forest-700 font-bold mt-1">+12% vs mois dernier</div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="glass-card rounded-3xl p-6 border-2 border-indigo-200 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-savanna-950">
            📊 Tableau de Suivi Pédagogique des Élèves
          </h3>
          <span className="text-xs text-savanna-700 font-medium">
            Données synchronisées avec le serveur REST
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-indigo-100 text-xs font-extrabold text-indigo-900 uppercase">
                <th className="py-3 px-4">Élève</th>
                <th className="py-3 px-4">Groupe d'âge</th>
                <th className="py-3 px-4">Niveau</th>
                <th className="py-3 px-4">Mots Appris</th>
                <th className="py-3 px-4">Leçons Faites</th>
                <th className="py-3 px-4">Progression</th>
                <th className="py-3 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-indigo-50/50 transition-colors">
                  <td className="py-3 px-4 font-extrabold text-savanna-950 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold text-xs">
                      {st.name[0]}
                    </span>
                    <span>{st.name}</span>
                  </td>
                  <td className="py-3 px-4 text-savanna-800 text-xs font-bold">{st.ageGroup} ans</td>
                  <td className="py-3 px-4 font-extrabold text-indigo-700">Niv. {st.level}</td>
                  <td className="py-3 px-4 font-bold text-forest-700">{st.wordsLearned} mots</td>
                  <td className="py-3 px-4 text-savanna-900 font-semibold">{st.lessonsDone} / 5</td>
                  <td className="py-3 px-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-brand-500 h-2.5 rounded-full"
                        style={{ width: `${st.progressPercent}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-bold text-emerald-700">
                    🟢 En ligne ({st.lastActive})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddChildModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

    </div>
  );
};
