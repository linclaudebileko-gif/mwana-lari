import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Download,
  Flame,
  BookOpen,
  Crown,
  TreePine,
  ExternalLink
} from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

export type CertificateTheme = 'GOLD' | 'EMERALD' | 'TERRACOTTA';

export interface CertificateData {
  recipientName: string;
  level: number;
  levelTitle?: string;
  xpPoints: number;
  wordsLearned?: number;
  streakDays?: number;
  date?: string;
  certificateRef?: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateData;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [theme, setTheme] = useState<CertificateTheme>('GOLD');
  const [isCopied, setIsCopied] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const levelNames: Record<number, string> = {
    1: 'NIVEAU 1 — DÉCOUVERTE, SALUTATIONS & FAMILLE',
    2: 'NIVEAU 2 — INITIATION & COMMUNICATION QUOTIDIENNE',
    3: 'NIVEAU 3 — CONVERSATION & VIE PRATIQUE',
    4: 'NIVEAU 4 — EXPRESSION, GRAMMAIRE & LECTURE',
    5: 'NIVEAU 5 — PATRIMOINE, PROVERBES & CONTES DES AÎNÉS',
  };

  const levelDescriptions: Record<number, string> = {
    1: 'a maîtrisé les salutations fondamentales, les membres de la famille et les premiers mots de politesse en langue Lari selon le Standard MBUTA.',
    2: 'sait désormais poser des questions, exprimer des émotions et dialoguer simplement avec ses proches en langue Lari.',
    3: 'est capable de tenir une conversation sur la maison, l\'école, le marché et le temps qu\'il fait.',
    4: 'maîtrise la lecture des phonèmes spécifiques, les classes nominales bantoues et la grammaire fondamentale.',
    5: 'a acquis les sagesses ancestrales, les proverbes (Bisiya) et les récits patrimoniaux de la tradition orale Kongo.',
  };

  const currentLevelTitle = data.levelTitle || levelNames[data.level] || `NIVEAU ${data.level}`;
  const currentDescription = levelDescriptions[data.level] || levelDescriptions[1];
  const currentDate = data.date || new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const certId = data.certificateRef || `ML-CERT-2026-N${data.level}-${Math.abs(data.recipientName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 17).toString().padStart(4, '0')}`;

  const handlePrint = () => {
    playSuccessChime();
    window.print();
  };

  const handleShareWhatsApp = () => {
    playSuccessChime();
    const text = `🎉 Félicitations à ${data.recipientName} qui vient d'obtenir son DIPLÔME OFFICIEL de ${currentLevelTitle} sur Mwana Lari ! 🇨🇬✨\nScore : ${data.xpPoints} XP • Réf : ${certId}\nApprendre sa langue, comprendre ses racines !`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://mwanalari.cg/certificates/${certId}`);
    setIsCopied(true);
    playSuccessChime();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'EMERALD':
        return {
          outerBorder: 'border-emerald-700 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
          innerBorder: 'border-emerald-600',
          ribbonBg: 'bg-emerald-700 text-emerald-100',
          accentText: 'text-emerald-900',
          sealColor: 'from-emerald-600 to-teal-700 text-white',
          tagBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        };
      case 'TERRACOTTA':
        return {
          outerBorder: 'border-amber-800 bg-gradient-to-br from-orange-50 via-white to-amber-50',
          innerBorder: 'border-amber-700',
          ribbonBg: 'bg-amber-800 text-amber-100',
          accentText: 'text-amber-950',
          sealColor: 'from-amber-600 to-orange-700 text-white',
          tagBg: 'bg-orange-100 text-orange-950 border-orange-300',
        };
      default:
        return {
          outerBorder: 'border-amber-600 bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/50',
          innerBorder: 'border-amber-500',
          ribbonBg: 'bg-amber-600 text-amber-100',
          accentText: 'text-amber-950',
          sealColor: 'from-amber-500 via-yellow-400 to-amber-600 text-amber-950',
          tagBg: 'bg-amber-100 text-amber-950 border-amber-300',
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Printable Wrapper Container */}
      <div className="relative w-full max-w-5xl my-auto space-y-4 print:space-y-0 print:w-full print:max-w-none">
        
        {/* Top Floating Control Bar (Hidden on Print) */}
        <div className="no-print bg-white/95 border-2 border-brand-300 rounded-3xl p-3 sm:p-4 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-500 text-white flex items-center justify-center text-xl shadow-md">
              🎓
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-savanna-950">
                Diplôme Officiel « Mwana ya Mayele »
              </h3>
              <p className="text-[11px] text-savanna-700 font-medium hidden sm:block">
                Prêt pour impression A4 Paysage haute définition ou encadrement
              </p>
            </div>
          </div>

          {/* Controls: Theme & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Theme Selector */}
            <div className="hidden md:flex items-center gap-1 bg-savanna-100 p-1 rounded-xl border border-savanna-200">
              <button
                onClick={() => setTheme('GOLD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  theme === 'GOLD' ? 'bg-white shadow text-amber-900' : 'text-savanna-700 hover:text-savanna-950'
                }`}
              >
                Or Kongo
              </button>
              <button
                onClick={() => setTheme('EMERALD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  theme === 'EMERALD' ? 'bg-white shadow text-emerald-900' : 'text-savanna-700 hover:text-savanna-950'
                }`}
              >
                Forêt Royale
              </button>
              <button
                onClick={() => setTheme('TERRACOTTA')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  theme === 'TERRACOTTA' ? 'bg-white shadow text-orange-950' : 'text-savanna-700 hover:text-savanna-950'
                }`}
              >
                Terre Savane
              </button>
            </div>

            {/* Print / Download Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-brand-600 via-amber-500 to-brand-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-brand-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 sm:px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95"
              title="Partager le diplôme avec la famille sur WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-savanna-700 hover:text-savanna-950 hover:bg-savanna-100 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE OFFICIAL DIPLOMA SHEET (Landscape A4 High-Res Renders & Print Ready) */}
        {/* ========================================================================= */}
        <div
          ref={certRef}
          className={`print-certificate-container relative w-full aspect-[1.414/1] min-h-[500px] sm:min-h-[620px] rounded-3xl p-4 sm:p-8 shadow-2xl border-8 ${styles.outerBorder} overflow-hidden flex flex-col justify-between select-none animate-scaleUp print:rounded-none print:shadow-none print:border-8`}
        >
          
          {/* Inner Golden Border with Ornamental Corner Flourishes */}
          <div className={`absolute inset-2.5 sm:inset-4 border-2 ${styles.innerBorder} rounded-2xl pointer-events-none border-dashed opacity-80`} />
          
          {/* Top National & Academic Header */}
          <div className="text-center space-y-1 relative z-10">
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl sm:text-2xl">🇨🇬</span>
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-savanna-800">
                RÉPUBLIQUE DU CONGO • DÉLÉGATION DU PATRIMOINE & DES SAVOIRS TRADITIONNELS
              </div>
              <span className="text-xl sm:text-2xl">🇨🇬</span>
            </div>

            <div className="text-xs sm:text-sm font-extrabold text-brand-800 uppercase tracking-wider">
              ACADÉMIE DE LA LANGUE ET DE LA CULTURE LARI — STANDARD MBUTA
            </div>

            {/* Main Diploma Title Ribbon */}
            <div className="pt-2">
              <div className="inline-block relative">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-savanna-950 uppercase font-serif drop-shadow-sm px-4 sm:px-8 py-1">
                  🏆 Diplôme d'Honneur & de Réussite 🏆
                </h1>
                <div className="text-xs sm:text-sm font-black text-amber-700 italic">
                  « Mwana ya Mayele » (L'Enfant Éveillé et Fierté de sa Lignée)
                </div>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-savanna-700 italic font-medium max-w-xl mx-auto pt-0.5">
              « Apprendre sa langue. Comprendre ses racines. Préparer son avenir. »
            </p>
          </div>

          {/* Recipient & Distinction Presentation Body */}
          <div className="text-center space-y-2 sm:space-y-3 my-auto py-2 relative z-10">
            <p className="text-xs sm:text-sm font-bold text-savanna-800 uppercase tracking-wider">
              Le présent certificat d'excellence linguistique est solennellement décerné à :
            </p>

            {/* Student's Name in Large Calligraphy Style */}
            <div className="py-1">
              <div className="inline-block relative">
                <span className="text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-brand-800 via-terracotta-700 to-forest-800 bg-clip-text text-transparent px-4 py-1">
                  ✨ {data.recipientName} ✨
                </span>
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-1" />
              </div>
            </div>

            {/* Level Achieved */}
            <div className="max-w-2xl mx-auto space-y-1">
              <p className="text-xs sm:text-sm text-savanna-900 font-semibold leading-relaxed">
                Pour avoir validé avec assiduité et succès toutes les épreuves orales et écrites du :
              </p>
              <div className="inline-block px-4 py-1 rounded-full bg-amber-500/10 border-2 border-amber-500 text-amber-950 font-black text-xs sm:text-base uppercase tracking-wide shadow-sm">
                {currentLevelTitle}
              </div>
              <p className="text-[11px] sm:text-xs text-savanna-800 font-medium max-w-lg mx-auto italic pt-1">
                {data.recipientName} {currentDescription}
              </p>
            </div>

            {/* Achievement Badges Row */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap pt-2">
              <div className={`px-3 py-1 rounded-xl ${styles.tagBg} border text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-sm`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{data.xpPoints} Points XP</span>
              </div>
              <div className={`px-3 py-1 rounded-xl ${styles.tagBg} border text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-sm`}>
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>{data.wordsLearned || 50}+ Mots Lari Validés</span>
              </div>
              <div className={`px-3 py-1 rounded-xl ${styles.tagBg} border text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-sm`}>
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                <span>{data.streakDays || 5} Jours d'Assiduité</span>
              </div>
            </div>
          </div>

          {/* Signatures & Official 3D Seal Footer */}
          <div className="grid grid-cols-3 items-end pt-3 sm:pt-4 border-t-2 border-amber-300/80 relative z-10">
            
            {/* Left Signature: Scientific President */}
            <div className="text-center space-y-1">
              <div className="font-serif italic text-xs sm:text-sm font-black text-savanna-900 border-b border-savanna-400 pb-0.5 max-w-[140px] sm:max-w-[180px] mx-auto">
                Prof. Massamba
              </div>
              <div className="text-[9px] sm:text-[10px] font-extrabold text-savanna-800 leading-tight">
                Professeur Massamba
              </div>
              <div className="text-[8px] sm:text-[9px] text-savanna-600">
                Président du Comité Scientifique Lari
              </div>
            </div>

            {/* Center: Golden 3D Academic Seal */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr ${styles.sealColor} border-4 border-white shadow-xl flex flex-col items-center justify-center transform hover:scale-105 transition-transform`}>
                <ShieldCheck className="w-6 h-6 sm:w-9 sm:h-9" />
                <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-tighter">
                  MBUTA
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-900 mt-1">
                Sceau d'Authenticité
              </span>
            </div>

            {/* Right Signature: Elder Oral Tradition Guardian */}
            <div className="text-center space-y-1">
              <div className="font-serif italic text-xs sm:text-sm font-black text-savanna-900 border-b border-savanna-400 pb-0.5 max-w-[140px] sm:max-w-[180px] mx-auto">
                Mamma Pauline
              </div>
              <div className="text-[9px] sm:text-[10px] font-extrabold text-savanna-800 leading-tight">
                Mamma Pauline
              </div>
              <div className="text-[8px] sm:text-[9px] text-savanna-600">
                Gardienne du Patrimoine & des Aînés
              </div>
            </div>

          </div>

          {/* Bottom Micro Certificate Metadata */}
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-bold text-savanna-600 pt-2 relative z-10 border-t border-savanna-200 mt-1">
            <span>Réf. Vérification : <strong className="text-brand-800">{certId}</strong></span>
            <span>Fait à Brazzaville le {currentDate}</span>
            <span>Plateforme EdTech Mwana Lari 🇨🇬</span>
          </div>

        </div>

      </div>

    </div>
  );
};
