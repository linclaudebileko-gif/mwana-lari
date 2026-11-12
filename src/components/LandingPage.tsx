import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  BookOpen,
  Gamepad2,
  Users,
  GraduationCap,
  Download,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  Award,
  TreePine,
  Play,
  Heart,
  Globe2,
  WifiOff,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Star,
  Layers,
  HelpCircle,
  Headphones,
  Check,
  ExternalLink,
  Shield,
  Scale,
  Search,
  X,
  Database,
  Pause,
  VolumeX
} from 'lucide-react';
import { playLariWordAudio, playSuccessChime, playKokoVoice } from '../utils/audio';
import { LARI_WORDS } from '../data/mockData';

interface LandingPageProps {
  onStartLearning: () => void;
  onNavigateTab: (tab: 'dashboard' | 'audiolab' | 'games' | 'dictionary' | 'heritage' | 'family' | 'school') => void;
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
  onOpenPwaModal: () => void;
  onOpenPrivacy: () => void;
  onOpenLegal: () => void;
}

interface AudioWordDemo {
  key: string;
  native: string;
  phonetic: string;
  french: string;
  category: 'greetings' | 'family' | 'nature' | 'wisdom';
  culturalNote: string;
}

const DEMO_WORDS: AudioWordDemo[] = [
  // 1. Salutations & Respect (8 mots)
  {
    key: 'mbote',
    native: 'Mbote',
    phonetic: '[m-bo-té]',
    french: 'Bonjour / Paix à toi',
    category: 'greetings',
    culturalNote: 'Salutation sacrée d\'accueil, de paix et de fraternité en terre Kongo.'
  },
  {
    key: 'matondo',
    native: 'Matondo',
    phonetic: '[ma-ton-do]',
    french: 'Merci du fond du cœur',
    category: 'greetings',
    culturalNote: 'Marque suprême de reconnaissance envers les personnes et les ancêtres.'
  },
  {
    key: 'bweni',
    native: 'Bweni',
    phonetic: '[bwe-ni]',
    french: 'Comment vas-tu ?',
    category: 'greetings',
    culturalNote: 'Demande bienveillante de nouvelles sur la santé et la famille.'
  },
  {
    key: 'ntondele',
    native: 'Ntondele',
    phonetic: '[n-ton-dé-lé]',
    french: 'Je te remercie / Gratitude',
    category: 'greetings',
    culturalNote: 'Remerciement chaleureux exprimant la joie profonde d\'un bienfait reçu.'
  },
  {
    key: 'wambote',
    native: 'Wa mbote',
    phonetic: '[wa-m-bo-té]',
    french: 'Sois le bienvenu / Paix',
    category: 'greetings',
    culturalNote: 'Formule d\'hospitalité traditionnelle pour accueillir un invité au foyer.'
  },
  {
    key: 'kwendambote',
    native: 'Kwenda mbote',
    phonetic: '[kwen-da-m-bo-té]',
    french: 'Au revoir / Bon voyage',
    category: 'greetings',
    culturalNote: 'Bénédiction de départ souhaitant une route protégée et paisible.'
  },
  {
    key: 'sikamambote',
    native: 'Sikama mbote',
    phonetic: '[si-ka-ma-m-bo-té]',
    french: 'Bon réveil / Réveille-toi en paix',
    category: 'greetings',
    culturalNote: 'Souhait matinal bienveillant adressé aux enfants et aînés au lever du jour.'
  },
  {
    key: 'iza',
    native: 'Iza',
    phonetic: '[i-za]',
    french: 'Viens / Approche',
    category: 'greetings',
    culturalNote: 'Invitation amicale à rejoindre le cercle de discussion sous le baobab.'
  },

  // 2. Famille & Liens du Sang (8 mots)
  {
    key: 'mwana',
    native: 'Mwana',
    phonetic: '[mwa-na]',
    french: 'Enfant / Descendant',
    category: 'family',
    culturalNote: 'L\'enfant est le trésor et le prolongement de la communauté (pluriel : bana).'
  },
  {
    key: 'tata',
    native: 'Tata',
    phonetic: '[ta-ta]',
    french: 'Père / Oncle paternel',
    category: 'family',
    culturalNote: 'Pilier d\'autorité, de transmission et de bienveillance dans le clan.'
  },
  {
    key: 'mama',
    native: 'Mama',
    phonetic: '[ma-ma]',
    french: 'Mère / Tante maternelle',
    category: 'family',
    culturalNote: 'Centre de la matrice familiale, nourricière et protectrice de la lignée.'
  },
  {
    key: 'mbuta',
    native: 'Mbuta',
    phonetic: '[m-bou-ta]',
    french: 'Aîné / Sage respecté',
    category: 'family',
    culturalNote: 'Détenteur de la coutume, garant de la concorde et de la paix lignagère.'
  },
  {
    key: 'yaya',
    native: 'Yaya',
    phonetic: '[ya-ya]',
    french: 'Grand frère / Grande sœur',
    category: 'family',
    culturalNote: 'Guide bienveillant des cadets, protecteur et modèle fraternel.'
  },
  {
    key: 'leke',
    native: 'Leke',
    phonetic: '[lé-ké]',
    french: 'Cadet / Petit frère / Petite sœur',
    category: 'family',
    culturalNote: 'Le plus jeune de la fratrie, entouré de l\'affection de toute la famille.'
  },
  {
    key: 'nkaka',
    native: 'Nkaka',
    phonetic: '[n-ka-ka]',
    french: 'Grand-parent / Aïeul',
    category: 'family',
    culturalNote: 'Mémoire vivante du clan qui raconte les contes et transmet l\'histoire.'
  },
  {
    key: 'bantu',
    native: 'Bantu',
    phonetic: '[ban-tou]',
    french: 'Les personnes / La communauté',
    category: 'family',
    culturalNote: 'L\'ensemble des êtres humains vivant en harmonie, respect et solidarité.'
  },

  // 3. Nature & Éléments (8 mots)
  {
    key: 'muti',
    native: 'Muti',
    phonetic: '[mou-ti]',
    french: 'Arbre / Baobab',
    category: 'nature',
    culturalNote: 'Symbole de l\'enracinement profond et de la longévité dans le Pool.'
  },
  {
    key: 'maza',
    native: 'Maza (Masa)',
    phonetic: '[ma-za]',
    french: 'Eau / Source de vie',
    category: 'nature',
    culturalNote: 'Élément vital des cours d\'eau sacrés du fleuve Congo et de ses affluents.'
  },
  {
    key: 'ntoto',
    native: 'Ntoto',
    phonetic: '[n-to-to]',
    french: 'Terre / Le sol sacré',
    category: 'nature',
    culturalNote: 'La terre nourricière de nos ancêtres, respectée et cultivée avec soin.'
  },
  {
    key: 'tiya',
    native: 'Tiya',
    phonetic: '[ti-ya]',
    french: 'Feu / Flamme du foyer',
    category: 'nature',
    culturalNote: 'Symbole de vie et de rassemblement lors des veillées de contes au village.'
  },
  {
    key: 'mvula',
    native: 'Mvula',
    phonetic: '[m-vou-la]',
    french: 'Pluie / Bénédiction',
    category: 'nature',
    culturalNote: 'L\'eau bienfaitrice qui arrose les plantations et nourrit la savane congolaise.'
  },
  {
    key: 'nzadi',
    native: 'Nzadi',
    phonetic: '[n-za-di]',
    french: 'Fleuve / Grande eau',
    category: 'nature',
    culturalNote: 'Le majestueux fleuve Congo, artère nourricière de toute la région.'
  },
  {
    key: 'ngonda',
    native: 'Ngonda',
    phonetic: '[n-gon-da]',
    french: 'Lune / Clarté de la nuit',
    category: 'nature',
    culturalNote: 'L\'astre qui éclaire les palabres des anciens et les chants nocturnes.'
  },
  {
    key: 'tembo',
    native: 'Tembo',
    phonetic: '[tem-bo]',
    french: 'Vent / Brise vivifiante',
    category: 'nature',
    culturalNote: 'Le souffle d\'air frais qui rafraîchit la terre et bruisse dans les feuillages.'
  },

  // 4. Sagesse & Proverbes (8 mots)
  {
    key: 'kiese',
    native: 'Kiese',
    phonetic: '[kye-sé]',
    french: 'Joie / Allégresse',
    category: 'wisdom',
    culturalNote: 'Le bonheur partagé lors des chants, contes et célébrations familiales.'
  },
  {
    key: 'kingana',
    native: 'Kingana',
    phonetic: '[kin-ga-na]',
    french: 'Proverbe / Enseignement',
    category: 'wisdom',
    culturalNote: 'La quintessence de l\'intelligence oratoire transmise de bouche à oreille.'
  },
  {
    key: 'ingeta',
    native: 'Ingeta',
    phonetic: '[in-gué-ta]',
    french: 'Oui / Qu\'il en soit ainsi !',
    category: 'wisdom',
    culturalNote: 'Formule rituelle marquant l\'approbation solennelle et l\'accord unanime.'
  },
  {
    key: 'ngolo',
    native: 'Ngolo',
    phonetic: '[n-go-lo]',
    french: 'Force / Courage / Énergie',
    category: 'wisdom',
    culturalNote: 'La vigueur morale et physique pour affronter sereinement les défis.'
  },
  {
    key: 'mayele',
    native: 'Mayele',
    phonetic: '[ma-yé-lé]',
    french: 'Intelligence / Sagesse',
    category: 'wisdom',
    culturalNote: 'La perspicacité, la vivacité d\'esprit et la connaissance des traditions.'
  },
  {
    key: 'ngemba',
    native: 'Ngemba',
    phonetic: '[n-guem-ba]',
    french: 'Paix / Concorde',
    category: 'wisdom',
    culturalNote: 'L\'harmonie, la conciliation et l\'entente paisible entre tous les membres.'
  },
  {
    key: 'bumuntu',
    native: 'Bumuntu',
    phonetic: '[bou-moun-tou]',
    french: 'Humanité / Dignité',
    category: 'wisdom',
    culturalNote: 'La vertu cardinale bantoue : manifester sa dignité humaine envers autrui.'
  },
  {
    key: 'kieleka',
    native: 'Kieleka',
    phonetic: '[kye-lé-ka]',
    french: 'Vérité / Sincérité',
    category: 'wisdom',
    culturalNote: 'La franchise et la fidélité à la vérité, fondements de la confiance mutuelle.'
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartLearning,
  onNavigateTab,
  onOpenAuth,
  onOpenSubscription,
  onOpenPwaModal,
  onOpenPrivacy,
  onOpenLegal
}) => {
  const [activeAudioCategory, setActiveAudioCategory] = useState<'all' | 'greetings' | 'family' | 'nature' | 'wisdom'>('all');
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'dict' | 'games' | 'audio' | 'heritage' | 'school'>('dict');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [searchMbutaQuery, setSearchMbutaQuery] = useState<string>('');
  const [visibleMbutaCount, setVisibleMbutaCount] = useState<number>(24);

  // Video player state for animated Hero showcase
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(10);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleVideoMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isVideoMuted;
    videoRef.current.muted = newMuted;
    setIsVideoMuted(newMuted);
    if (!newMuted && videoRef.current.paused) {
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  };

  const getActiveSubtitle = () => {
    const t = videoCurrentTime % 10;
    if (t < 2.5) {
      return {
        lari: "« Mbote na beno bana ! Yikama Koko sous le Baobab ! »",
        fr: "Bonjour les enfants ! Rejoignez Koko sous le grand Baobab !"
      };
    } else if (t < 5.0) {
      return {
        lari: "« Sous le Baobab sacré, écoutez la voix de nos aînés. »",
        fr: "Transmission orale vivante, contes et sagesses ancestrales."
      };
    } else if (t < 7.5) {
      return {
        lari: "« 2 668 mots MBUTA & prononciation tonale authentique. »",
        fr: "Apprenez pas à pas avec des linguistes et locuteurs natifs."
      };
    } else {
      return {
        lari: "« Matondo mingi ! Éveillez la fierté de vos racines Kongo. »",
        fr: "La première plateforme EdTech pour préserver notre patrimoine."
      };
    }
  };

  // Search across the full MBUTA 2668 words database
  const searchedMbutaWords = React.useMemo(() => {
    if (!searchMbutaQuery.trim()) return [];
    const q = searchMbutaQuery.toLowerCase().trim();
    return LARI_WORDS.filter((w) =>
      w.wordNative.toLowerCase().includes(q) ||
      w.translationFr.toLowerCase().includes(q) ||
      (w.translationEn && w.translationEn.toLowerCase().includes(q)) ||
      (w.category && w.category.toLowerCase().includes(q)) ||
      (w.phonetic && w.phonetic.toLowerCase().includes(q)) ||
      (w.nounClass && w.nounClass.toLowerCase().includes(q))
    );
  }, [searchMbutaQuery]);

  const handlePlayWord = (wordKey: string, customAudioUrl?: string) => {
    setPlayingWordKey(wordKey);
    const audio = playLariWordAudio(wordKey, {
      customAudioUrl,
      onEnd: () => setPlayingWordKey(null)
    });
    if (!audio) {
      setTimeout(() => setPlayingWordKey(null), 1200);
    }
  };

  const handleHeroSound = () => {
    handlePlayWord('mbote');
  };

  const filteredWords = activeAudioCategory === 'all'
    ? DEMO_WORDS
    : DEMO_WORDS.filter(w => w.category === activeAudioCategory);

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-savanna-100 text-savanna-950 flex flex-col font-sans selection:bg-brand-400 selection:text-savanna-950">
      
      {/* 1. TOP STICKY NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 glass-card border-b border-brand-300/80 px-3 sm:px-8 py-3 shadow-md transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 border border-brand-400 p-1 flex items-center justify-center shadow-md shadow-brand-500/20 transform hover:scale-105 transition-transform">
              <img
                src="/icons/icon-192.svg"
                alt="Logo Mwana Lari"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-brand-700 via-terracotta-600 to-forest-700 bg-clip-text text-transparent">
                  Mwana Lari
                </span>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 font-extrabold border border-forest-400/40">
                  🇨🇬 EdTech Congo
                </span>
              </div>
              <p className="text-[10px] text-savanna-800 font-semibold hidden md:block">
                Plateforme d'apprentissage et de transmission du Lari
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-bold text-savanna-900">
            <a href="#piliers" className="hover:text-brand-700 transition-colors">Les 4 Piliers</a>
            <a href="#audio-demo" className="hover:text-brand-700 transition-colors flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Écoute en Direct</span>
            </a>
            <a href="#fonctionnalites" className="hover:text-brand-700 transition-colors">Fonctionnalités</a>
            <a href="#pourquoi" className="hover:text-brand-700 transition-colors">Notre Mission</a>
            <a href="#tarifs" className="hover:text-brand-700 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-brand-700 transition-colors">FAQ</a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenAuth}
              className="hidden sm:flex items-center gap-1 text-xs font-extrabold px-3 py-2 rounded-xl text-savanna-900 hover:bg-savanna-200/70 transition-all border border-savanna-300"
            >
              <span>Connexion</span>
            </button>

            <button
              id="landing-cta-top"
              onClick={onStartLearning}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 via-amber-500 to-terracotta-500 text-white font-black text-xs sm:text-sm shadow-md shadow-brand-500/30 hover:shadow-lg hover:brightness-105 active:scale-95 transition-all shimmer-btn"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lancer l'Application</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>
          </div>

        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 px-4 sm:px-8 border-b border-brand-300/50">
        {/* Soft background ambient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-300/30 via-terracotta-300/20 to-forest-300/30 rounded-full blur-3xl pointer-events-none -z-10"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              
              {/* Badge announcement */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-brand-100 border border-brand-300 text-brand-900 text-xs sm:text-sm font-extrabold shadow-sm animate-pulse-glow">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500 flex-shrink-0 animate-bounce" />
                <span>🇨🇬 1ère Plateforme EdTech de transmission du Lari & des langues bantoues</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-savanna-950 leading-[1.12]">
                Apprenez la langue de <span className="bg-gradient-to-r from-brand-600 via-terracotta-600 to-forest-700 bg-clip-text text-transparent">vos racines</span>.
                <br className="hidden sm:block" />
                Éveillez la fierté de <span className="underline decoration-brand-400 decoration-wavy decoration-2">vos enfants</span>.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-lg text-savanna-800 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Une méthode interactive, immersive et ludo-éducative bilingue (<strong className="text-brand-900">Lari ↔ Français & Anglais</strong>) conçue avec des linguistes et aînés congolais. Pensée pour les enfants (3 à 15 ans), leurs parents et toute la diaspora à travers le monde.
              </p>

              {/* Primary Call to Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <button
                  id="landing-hero-start-btn"
                  onClick={onStartLearning}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-brand-500 via-amber-500 to-terracotta-500 text-white font-black text-sm sm:text-base shadow-xl shadow-brand-500/40 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Commencer Gratuitement</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#audio-demo"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-white/90 hover:bg-white text-savanna-900 font-extrabold text-sm sm:text-base border-2 border-brand-300 shadow-sm hover:border-brand-500 active:scale-95 transition-all"
                >
                  <Volume2 className="w-5 h-5 text-brand-600" />
                  <span>Écouter un extrait audio</span>
                </a>
              </div>

              {/* Offline & Trust indicators */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs font-bold text-savanna-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                  <span>2 668 mots audio MBUTA 1.0.0</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <WifiOff className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span>100% Fonctionnel Hors-Ligne (PWA)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-600 flex-shrink-0" />
                  <span>Conforme protection mineurs</span>
                </div>
              </div>

            </div>

            {/* Right Visual Showcase Column: Truly Animated Video Experience */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Visual Video Player Frame */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-300/90 bg-savanna-950 group transform hover:rotate-[-0.5deg] transition-all duration-500 ring-4 ring-brand-400/25">
                  
                  {/* Real Animated Video Stream with Sound & Loop */}
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    poster="/mwana_lari_hero.jpg"
                    onTimeUpdate={handleVideoTimeUpdate}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onClick={toggleVideoPlay}
                    className="w-full h-auto object-cover transform scale-[1.01] group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                  >
                    <source src="/mwana_lari_hero.mp4" type="video/mp4" />
                    <img
                      src="/mwana_lari_hero.jpg"
                      alt="Enfants apprenant le Lari avec Koko sous le Baobab"
                      className="w-full h-auto object-cover animate-ken-burns"
                    />
                  </video>

                  {/* Atmospheric Cinematic Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 pointer-events-none"></div>

                  {/* Floating Glowing Embers / Savanna Fireflies */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <span className="absolute bottom-6 left-12 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-firefly-1"></span>
                    <span className="absolute bottom-12 left-1/3 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_#fde047] animate-firefly-2"></span>
                    <span className="absolute bottom-16 right-1/4 w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_14px_#fb923c] animate-firefly-3"></span>
                    <span className="absolute bottom-10 right-12 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-firefly-4"></span>
                  </div>

                  {/* Top Live Status Bar */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white z-20 pointer-events-auto">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-black shadow-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-live-dot flex-shrink-0"></span>
                      <span className="tracking-wider uppercase text-amber-300">Vidéo Animée • 4K HD</span>
                    </div>

                    {/* Sound Mute / Unmute Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVideoMute();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/25 text-[11px] font-extrabold text-white transition-all shadow-md active:scale-95 cursor-pointer"
                      title={isVideoMuted ? "Activer le son du conte" : "Couper le son"}
                    >
                      {isVideoMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Activer le Son</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-green-400 animate-pulse" />
                          <span className="text-green-400 font-bold hidden sm:inline">Son Actif</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Center Play/Pause Overlay Button */}
                  <div 
                    onClick={toggleVideoPlay}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 cursor-pointer ${
                      isVideoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                    }`}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-brand-600 via-amber-500 to-terracotta-500 text-white flex items-center justify-center shadow-2xl border-2 border-white/60 transform hover:scale-110 active:scale-95 transition-all">
                      {isVideoPlaying ? (
                        <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
                      ) : (
                        <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Subtitles & Timeline Bar */}
                  <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 text-white z-20 pointer-events-auto space-y-2">
                    
                    {/* Live Synchronized Subtitle Box */}
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/20 shadow-lg transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="font-black text-xs sm:text-sm text-amber-300 truncate">
                            {getActiveSubtitle().lari}
                          </div>
                          <div className="text-[10px] sm:text-xs text-white/90 font-medium truncate">
                            {getActiveSubtitle().fr}
                          </div>
                        </div>

                        {/* Animated Equalizer soundwave bars */}
                        <div className="flex items-end gap-1 h-5 px-1.5 flex-shrink-0" title="Audio en direct">
                          <span className={`w-1 bg-amber-400 rounded-full ${isVideoPlaying && !isVideoMuted ? 'animate-soundwave-1 h-5' : 'h-1.5'}`}></span>
                          <span className={`w-1 bg-amber-300 rounded-full ${isVideoPlaying && !isVideoMuted ? 'animate-soundwave-2 h-5' : 'h-3'}`}></span>
                          <span className={`w-1 bg-orange-400 rounded-full ${isVideoPlaying && !isVideoMuted ? 'animate-soundwave-3 h-5' : 'h-2'}`}></span>
                          <span className={`w-1 bg-amber-500 rounded-full ${isVideoPlaying && !isVideoMuted ? 'animate-soundwave-4 h-5' : 'h-4'}`}></span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Timeline Scrubber */}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/80">
                      <span>0:0{Math.floor(videoCurrentTime % 10)}</span>
                      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-brand-400 to-amber-400 transition-all duration-200"
                          style={{ width: `${((videoCurrentTime % 10) / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span>0:10</span>
                    </div>

                  </div>

                </div>

                {/* Floating Interactive Card 1: Audio Playback Badge */}
                <div
                  onClick={handleHeroSound}
                  className="absolute -top-4 -left-3 sm:-left-6 glass-card-amber p-3 sm:p-3.5 rounded-2xl border-2 border-brand-400 shadow-xl cursor-pointer transform hover:scale-105 active:scale-95 transition-all animate-float-slow z-30"
                  title="Cliquer pour écouter 'Mbote' !"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md">
                      <Volume2 className={`w-5 h-5 ${playingWordKey === 'mbote' ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black text-brand-800 tracking-wider">Audio Prononciation</div>
                      <div className="text-xs sm:text-sm font-extrabold text-savanna-950 flex items-center gap-1">
                        <span>"Mbote !"</span>
                        <span className="text-[10px] text-brand-700 font-semibold">(Bonjour)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Interactive Card 2: Streak & Level */}
                <div className="absolute -bottom-4 -right-2 sm:-right-6 glass-card p-3 sm:p-3.5 rounded-2xl border-2 border-forest-400 shadow-xl transform hover:scale-105 transition-all z-30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-forest-600 text-white flex items-center justify-center shadow-md">
                      <TreePine className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black text-forest-800 tracking-wider">Arbre de Progrès</div>
                      <div className="text-xs sm:text-sm font-extrabold text-savanna-950 flex items-center gap-1">
                        <span>Baobab Niv. 5</span>
                        <span className="text-[10px] text-forest-700 font-semibold">• 1 250 XP</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE AUDIO DISCOVERY SECTION ("Écoutez le Lari en Direct") */}
      <section id="audio-demo" className="py-14 sm:py-20 px-4 sm:px-8 bg-gradient-to-b from-savanna-100 via-amber-50 to-savanna-100 border-b border-brand-300/60">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-900 border border-brand-300 text-xs font-black uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5 text-brand-600" />
              <span>Studio d'Immersion Phonétique • Version MBUTA (2 668 mots)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-savanna-950">
              Touchez un mot. <span className="bg-gradient-to-r from-brand-600 via-terracotta-600 to-forest-700 bg-clip-text text-transparent">Écoutez sa véritable prononciation</span>.
            </h2>
            <p className="text-xs sm:text-base text-savanna-800 font-medium">
              Chaque mot de notre base a été enregistré et validé selon la tradition orale et le dictionnaire scientifique MBUTA (2 668 entrées audio). Recherchez n'importe quel mot du dictionnaire ou explorez la sélection guidée ci-dessous :
            </p>
          </div>

          {/* Search bar across all 2 668 MBUTA words */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-savanna-500">
                <Search className="w-5 h-5 text-brand-600" />
              </div>
              <input
                type="text"
                value={searchMbutaQuery}
                onChange={(e) => {
                  setSearchMbutaQuery(e.target.value);
                  setVisibleMbutaCount(24);
                }}
                placeholder="Rechercher parmi les 2 668 mots MBUTA (ex: mbote, muntu, nzambi, nzila, eau, mère...)"
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border-2 border-brand-300 text-savanna-950 font-bold text-xs sm:text-sm placeholder:text-savanna-400 placeholder:font-normal focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-200/50 shadow-md transition-all"
              />
              {searchMbutaQuery && (
                <button
                  onClick={() => setSearchMbutaQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-savanna-400 hover:text-savanna-700"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-savanna-700 px-2 pt-2">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-brand-600" />
                <span>Corpus officiel MBUTA 1.0.0 • 2 668 enregistrements audio</span>
              </span>
              {searchMbutaQuery && (
                <span className="text-brand-800 font-extrabold">
                  {searchedMbutaWords.length} mot{searchedMbutaWords.length > 1 ? 's' : ''} trouvé{searchedMbutaWords.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Render Mode: Search Results vs Category Selection */}
          {searchMbutaQuery.trim() ? (
            <div className="space-y-6 pt-2">
              {searchedMbutaWords.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {searchedMbutaWords.slice(0, visibleMbutaCount).map((word) => {
                      const isPlaying = playingWordKey === word.wordNative;
                      return (
                        <div
                          key={word.id}
                          onClick={() => handlePlayWord(word.wordNative, word.audioUrl)}
                          className={`group relative p-4 rounded-3xl transition-all cursor-pointer border-2 ${
                            isPlaying
                              ? 'bg-brand-50 border-brand-500 shadow-xl scale-[1.03] ring-4 ring-brand-300/50'
                              : 'bg-white/95 hover:bg-white border-brand-200/80 hover:border-brand-400 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="font-black text-xl sm:text-2xl text-savanna-950 group-hover:text-brand-700 transition-colors">
                                {word.wordNative}
                              </span>
                              {word.phonetic && (
                                <span className="block text-xs font-semibold text-brand-700">
                                  {word.phonetic}
                                </span>
                              )}
                            </div>

                            <button
                              className={`p-2.5 rounded-2xl shadow-sm transition-all flex-shrink-0 ${
                                isPlaying
                                  ? 'bg-brand-500 text-white scale-110 shadow-brand-500/40'
                                  : 'bg-brand-100 text-brand-900 group-hover:bg-brand-500 group-hover:text-white'
                              }`}
                              aria-label={`Écouter ${word.wordNative}`}
                            >
                              <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                            </button>
                          </div>

                          <div className="font-bold text-sm text-terracotta-700 mb-1.5">
                            {word.translationFr}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-savanna-600 font-semibold pt-1 border-t border-savanna-100">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-brand-900 text-[10px] font-extrabold">
                              MBUTA #{word.id.replace('w', '')}
                            </span>
                            {word.nounClass && (
                              <span className="text-savanna-500 text-[10px]">
                                {word.nounClass}
                              </span>
                            )}
                          </div>

                          {/* Soundwave animation indicator */}
                          {isPlaying && (
                            <div className="mt-2.5 pt-2 border-t border-brand-200 flex items-center justify-center gap-1 text-brand-600">
                              <span className="w-1 h-3 bg-brand-500 rounded-full animate-bounce"></span>
                              <span className="w-1 h-5 bg-brand-600 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                              <span className="w-1 h-4 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1 h-6 bg-brand-700 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                              <span className="text-[10px] font-extrabold uppercase ml-1.5">Lecture MBUTA...</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Load more button if results exceed visible count */}
                  {searchedMbutaWords.length > visibleMbutaCount && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setVisibleMbutaCount(prev => prev + 24)}
                        className="px-6 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                      >
                        Afficher plus de résultats ({visibleMbutaCount} sur {searchedMbutaWords.length})
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 bg-white/80 rounded-3xl border-2 border-dashed border-brand-300 p-6 max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl mx-auto">
                    🔍
                  </div>
                  <h4 className="font-black text-savanna-950 text-base">Aucun mot trouvé pour « {searchMbutaQuery} »</h4>
                  <p className="text-xs text-savanna-700">
                    Essayez de chercher en Lari ou en Français (ex: <em>mbote, muntu, nzila, eau, père</em>), ou explorez la sélection guidée.
                  </p>
                  <button
                    onClick={() => setSearchMbutaQuery('')}
                    className="px-4 py-2 rounded-xl bg-savanna-200 hover:bg-savanna-300 text-savanna-950 font-bold text-xs"
                  >
                    Effacer la recherche
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Category Filter Chips for Curated Selection */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[
                  { id: 'all', label: 'Tous les Mots (32 essentiels)', icon: Layers },
                  { id: 'greetings', label: 'Salutations & Respect', icon: Sparkles },
                  { id: 'family', label: 'Famille & Liens du Sang', icon: Users },
                  { id: 'nature', label: 'Nature & Éléments', icon: TreePine },
                  { id: 'wisdom', label: 'Sagesse & Proverbes', icon: Award }
                ].map(cat => {
                  const Icon = cat.icon;
                  const isActive = activeAudioCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveAudioCategory(cat.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 scale-105'
                          : 'bg-white text-savanna-800 hover:bg-savanna-200/80 border border-brand-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Word Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                {filteredWords.map((word) => {
                  const isPlaying = playingWordKey === word.key;
                  return (
                    <div
                      key={word.key}
                      onClick={() => handlePlayWord(word.key)}
                      className={`group relative p-4 rounded-3xl transition-all cursor-pointer border-2 ${
                        isPlaying
                          ? 'bg-brand-50 border-brand-500 shadow-xl scale-[1.03] ring-4 ring-brand-300/50'
                          : 'bg-white/90 hover:bg-white border-brand-200/80 hover:border-brand-400 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="font-black text-xl sm:text-2xl text-savanna-950 group-hover:text-brand-700 transition-colors">
                            {word.native}
                          </span>
                          <span className="block text-xs font-semibold text-brand-700">
                            {word.phonetic}
                          </span>
                        </div>

                        <button
                          className={`p-2.5 rounded-2xl shadow-sm transition-all flex-shrink-0 ${
                            isPlaying
                              ? 'bg-brand-500 text-white scale-110 shadow-brand-500/40'
                              : 'bg-brand-100 text-brand-900 group-hover:bg-brand-500 group-hover:text-white'
                          }`}
                          aria-label={`Écouter ${word.native}`}
                        >
                          <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                        </button>
                      </div>

                      <div className="font-bold text-sm text-terracotta-700 mb-1.5">
                        {word.french}
                      </div>

                      <p className="text-[11px] text-savanna-700 line-clamp-2 leading-relaxed">
                        {word.culturalNote}
                      </p>

                      {/* Soundwave animation indicator */}
                      {isPlaying && (
                        <div className="mt-2.5 pt-2 border-t border-brand-200 flex items-center justify-center gap-1 text-brand-600">
                          <span className="w-1 h-3 bg-brand-500 rounded-full animate-bounce"></span>
                          <span className="w-1 h-5 bg-brand-600 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                          <span className="w-1 h-4 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1 h-6 bg-brand-700 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                          <span className="text-[10px] font-extrabold uppercase ml-1.5">En cours d'écoute...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Bottom Callout */}
          <div className="text-center pt-4">
            <button
              onClick={() => onNavigateTab('dictionary')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-brand-950 font-extrabold text-xs sm:text-sm border border-brand-300 transition-all shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-brand-700" />
              <span>Explorer les 2 668 mots dans le Grand Dictionnaire MBUTA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* 4. THE 4 FOUNDATIONAL PILLARS SECTION */}
      <section id="piliers" className="py-14 sm:py-20 px-4 sm:px-8 border-b border-brand-300/60">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-900 border border-forest-300 text-xs font-black uppercase tracking-wider">
              <TreePine className="w-3.5 h-3.5 text-forest-700" />
              <span>Socle Pédagogique & Culturel</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-savanna-950">
              Les 4 Piliers Fondateurs de <span className="bg-gradient-to-r from-brand-600 to-terracotta-600 bg-clip-text text-transparent">Mwana Lari</span>
            </h2>
            <p className="text-xs sm:text-base text-savanna-800 font-medium">
              Une architecture complète articulée autour de la langue vivante, du patrimoine des aînés, de la transmission intrafamiliale et de l'innovation technologique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pilier 1: Langue */}
            <div className="glass-card-amber p-6 rounded-3xl border-2 border-brand-400/80 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl shadow-md mb-4">
                  🗣️
                </div>
                <h3 className="text-xl font-black text-savanna-950 mb-2">
                  1. Langue Vivante
                </h3>
                <p className="text-xs sm:text-sm text-savanna-800 font-medium leading-relaxed">
                  Progression pédagogique sur 5 niveaux d'apprentissage. Immersion tonale, phonologie authentique, et maîtrise des 18 classes nominales bantoues avec des exemples du quotidien.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-brand-300/80 flex items-center text-xs font-extrabold text-brand-900">
                <span>5 Niveaux • Du Bambin au Sage</span>
              </div>
            </div>

            {/* Pilier 2: Culture */}
            <div className="glass-card-terracotta p-6 rounded-3xl border-2 border-terracotta-400/80 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-terracotta-600 text-white flex items-center justify-center text-2xl shadow-md mb-4">
                  📚
                </div>
                <h3 className="text-xl font-black text-savanna-950 mb-2">
                  2. Mémoire & Contes
                </h3>
                <p className="text-xs sm:text-sm text-savanna-800 font-medium leading-relaxed">
                  L'univers <em>Nzolo ya Bakulu</em> (L'Héritage des Aînés) : contes oraux ancestraux, proverbes illustrés et berceuses traditionnelles sonorisées au sanza (kalimba) et au tambour ngoma.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-terracotta-300/80 flex items-center text-xs font-extrabold text-terracotta-900">
                <span>Littérature Orale & Musiques</span>
              </div>
            </div>

            {/* Pilier 3: Famille */}
            <div className="glass-card-forest p-6 rounded-3xl border-2 border-forest-400/80 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-forest-600 text-white flex items-center justify-center text-2xl shadow-md mb-4">
                  👨‍👩‍👧
                </div>
                <h3 className="text-xl font-black text-savanna-950 mb-2">
                  3. Lien Intergénérationnel
                </h3>
                <p className="text-xs sm:text-sm text-savanna-800 font-medium leading-relaxed">
                  Défis quotidiens du soir partagés entre parents, enfants et grands-parents. Réconciliation de la diaspora avec leurs aînés au pays et renforcement de l'identité culturelle.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-forest-300/80 flex items-center text-xs font-extrabold text-forest-900">
                <span>Défis du soir & Espace Parent</span>
              </div>
            </div>

            {/* Pilier 4: Technologie */}
            <div className="glass-card p-6 rounded-3xl border-2 border-amber-300/80 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-savanna-800 text-white flex items-center justify-center text-2xl shadow-md mb-4">
                  🤖
                </div>
                <h3 className="text-xl font-black text-savanna-950 mb-2">
                  4. Technologie & Écoles
                </h3>
                <p className="text-xs sm:text-sm text-savanna-800 font-medium leading-relaxed">
                  PWA ultra-rapide 100% hors-ligne sans connexion obligatoire. Synthèse Web Audio, gamification avec arbre de Baobab, et tableau de bord enseignant pour les écoles bilingues.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-savanna-300 flex items-center text-xs font-extrabold text-savanna-950">
                <span>PWA • Offline-First • Écoles</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE FEATURE SHOWCASE WITH TABS */}
      <section id="fonctionnalites" className="py-14 sm:py-20 px-4 sm:px-8 bg-white/70 border-b border-brand-300/60">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-900 border border-brand-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Exploration Complète</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-savanna-950">
              Des modules conçus pour un <span className="bg-gradient-to-r from-brand-600 via-amber-600 to-terracotta-600 bg-clip-text text-transparent">apprentissage durable</span>
            </h2>
            <p className="text-xs sm:text-base text-savanna-800 font-medium">
              Chaque fonctionnalité a été peaufinée pour stimuler la curiosité des jeunes apprenants et faciliter l'accompagnement des éducateurs.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-brand-200 pb-4">
            {[
              { id: 'dict', label: 'Grand Dictionnaire MBUTA (2 668)', icon: BookOpen },
              { id: 'games', label: 'Jeux de Koko (4 modes)', icon: Gamepad2 },
              { id: 'audio', label: 'Studio & Laboratoire Audio', icon: Volume2 },
              { id: 'heritage', label: 'Contes & Voix des Aînés', icon: Heart },
              { id: 'school', label: 'Espace École & Classes', icon: GraduationCap }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all ${
                    isActive
                      ? 'bg-savanna-900 text-amber-300 shadow-lg scale-105'
                      : 'bg-savanna-100 text-savanna-800 hover:bg-savanna-200 border border-savanna-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feature Tab Details */}
          <div className="glass-card p-6 sm:p-10 rounded-3xl border-2 border-brand-300/80 shadow-xl">
            {activeFeatureTab === 'dict' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Dictionnaire MBUTA Intelligent</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-savanna-950">
                    Recherche instantanée et classification par genres bantous
                  </h3>
                  <p className="text-xs sm:text-sm text-savanna-800 leading-relaxed font-medium">
                    Le corpus intégral de 2 668 entrées lexicales répertoriées selon la version scientifique MBUTA 1.0.0 avec transcription phonétique internationale, traduction bilingue (Français et Anglais), phrases d'exemples contextualisées et enregistrements audio authentiques.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-savanna-900 font-bold">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Filtres par les 18 classes nominales (Mu-/Ba-, Ki-/Bi-...)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Prononciation audio haute fidélité pour chaque terme</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Possibilité pour les aînés et linguistes de contribuer</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigateTab('dictionary')}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Ouvrir le Dictionnaire</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-gradient-to-br from-blue-50 to-amber-50 p-6 rounded-3xl border-2 border-blue-200 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-200">
                    <span className="font-extrabold text-blue-900 text-sm">Aperçu fiche dictionnaire</span>
                    <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">Classe 1/2</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-black text-blue-950">Muntu / Bantu</div>
                    <div className="text-xs text-blue-800 font-semibold">[moun-tou] • Être humain, personne</div>
                    <div className="p-3 bg-white/90 rounded-xl text-xs text-savanna-900 border border-blue-100 space-y-1">
                      <div className="font-bold text-terracotta-800">« Muntu yandi una kiese »</div>
                      <div className="text-savanna-700">« Cette personne est remplie de joie »</div>
                    </div>
                    <div className="text-[11px] text-savanna-700 italic pt-1">
                      💡 Note : À la racine de la philosophie humaniste universelle Ubuntu / Muntu.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'games' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4" />
                    <span>Ludo-Éducation Gamifiée</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-savanna-950">
                    4 Mini-jeux conçus avec la mascotte Koko
                  </h3>
                  <p className="text-xs sm:text-sm text-savanna-800 leading-relaxed font-medium">
                    Pour mémoriser sans effort et avec le sourire. L'enfant gagne des points d'expérience (XP), fait grandir son Baobab et débloque des trophées culturels.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold text-savanna-900 pt-1">
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <div className="font-extrabold text-emerald-950">🧩 Puzzles de Mots</div>
                      <div className="text-[11px] text-emerald-800 font-normal">Reconstituez les syllabes</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                      <div className="font-extrabold text-amber-950">🃏 Cartes Mémoire</div>
                      <div className="text-[11px] text-amber-800 font-normal">Associez images et sons</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                      <div className="font-extrabold text-blue-950">🎧 Écoute & Trouve</div>
                      <div className="text-[11px] text-blue-800 font-normal">Reconnaissance auditive</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200">
                      <div className="font-extrabold text-orange-950">🤔 Énigmes de Koko</div>
                      <div className="text-[11px] text-orange-800 font-normal">Devinettes traditionnelles</div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigateTab('games')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Jouer aux Jeux de Koko</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-gradient-to-tr from-emerald-100 via-amber-50 to-emerald-50 p-6 rounded-3xl border-2 border-emerald-300 text-center space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400 p-2 shadow-lg flex items-center justify-center text-4xl animate-bounce">
                    🦊
                  </div>
                  <h4 className="font-black text-xl text-emerald-950">« Bravo, mwana ! +50 XP gagnés »</h4>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto font-medium">
                    Une pédagogie bienveillante sans échec pénalisant, valorisant chaque tentative de l'enfant.
                  </p>
                </div>
              </div>
            )}

            {activeFeatureTab === 'audio' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="text-xs font-black text-brand-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" />
                    <span>Studio Vocal & Phonétique</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-savanna-950">
                    Écoute tonale et comparateur de voix
                  </h3>
                  <p className="text-xs sm:text-sm text-savanna-800 leading-relaxed font-medium">
                    Le Lari est une langue tonale où l'intonation donne le sens. Notre studio audio permet d'écouter la voix de référence à vitesse normale ou ralentie, d'enregistrer la voix de l'enfant et de comparer les courbes sonores.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-savanna-900 font-bold">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Mode d'écoute au ralenti pour bien saisir les tons</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Enregistrement sécurisé local sans envoi de données privées</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Moteur sonore Web Audio API autonome</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigateTab('audiolab')}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Tester le Studio Audio</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border-2 border-brand-300 space-y-4">
                  <div className="flex items-center justify-between text-xs font-extrabold text-brand-900">
                    <span>Onde Sonore de Référence</span>
                    <span className="text-forest-700">● Tonalité Haute</span>
                  </div>
                  <div className="h-20 bg-brand-100 rounded-2xl flex items-center justify-center gap-1.5 px-4">
                    {[15, 30, 60, 40, 80, 50, 70, 95, 45, 65, 35, 75, 55, 25, 40, 60, 20].map((h, i) => (
                      <span
                        key={i}
                        className="w-1.5 bg-brand-600 rounded-full"
                        style={{ height: `${h}%` }}
                      ></span>
                    ))}
                  </div>
                  <div className="text-center text-xs text-savanna-800 font-semibold">
                    Comparaison en direct avec la voix de l'enfant
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'heritage' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="text-xs font-black text-terracotta-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    <span>Nzolo ya Bakulu (L'Héritage des Aînés)</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-savanna-950">
                    Contes oraux sonorisés comme au coin du feu
                  </h3>
                  <p className="text-xs sm:text-sm text-savanna-800 leading-relaxed font-medium">
                    Redécouvrez les récits légendaires du Pool (<em>Nkosi na Mbwa</em>, <em>Ngo na Nsusu</em>, <em>Kongo dia Ntotila</em>) contés par les voix vénérables de nos anciens avec des paysages sonores traditionnels au sanza et balafon.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-savanna-900 font-bold">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Texte synchronisé bilingue Lari / Français</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Morales traditionnelles et questions de réflexion pour la famille</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Possibilité de soumettre de nouveaux récits oraux</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigateTab('heritage')}
                      className="px-5 py-2.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Écouter les Contes</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-xl border-2 border-terracotta-300">
                  <img
                    src="/mwana_lari_heritage.jpg"
                    alt="Veillée de contes des aînés sous le baobab"
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/mwana_lari_heritage.jpg';
                    }}
                  />
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl glass-card text-savanna-950 text-xs font-bold flex items-center justify-between">
                    <span>📖 Conte : Nkosi na Mbwa</span>
                    <span className="text-terracotta-700 font-extrabold">Audio HD Sanza</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'school' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="text-xs font-black text-forest-700 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Mwana Lari École</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-savanna-950">
                    Outils dédiés pour les enseignants et écoles bilingues
                  </h3>
                  <p className="text-xs sm:text-sm text-savanna-800 leading-relaxed font-medium">
                    Un tableau de bord complet pour gérer des classes, assigner des unités thématiques, suivre l'évolution des compétences lexicales et imprimer des diplômes officiels d'accomplissement.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-savanna-900 font-bold">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Suivi individuel et collectif des acquisitions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Génération de certificats de réussite imprimables (A4 paysage)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                      <span>Mode sans distraction avec contrôle strict du temps d'écran</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigateTab('school')}
                      className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Découvrir l'Espace École</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-gradient-to-tr from-forest-50 to-amber-50 p-6 rounded-3xl border-2 border-forest-300 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-forest-200 text-xs font-extrabold text-forest-900">
                    <span>Tableau de bord Enseignant</span>
                    <span className="text-forest-700 font-bold">Classe : CE2 Bilingue</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl shadow-sm">
                      <span className="font-bold">Mots maîtrisés cette semaine</span>
                      <span className="font-extrabold text-forest-700">92%</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl shadow-sm">
                      <span className="font-bold">Temps moyen par élève</span>
                      <span className="font-extrabold text-brand-700">14 min / jour</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl shadow-sm">
                      <span className="font-bold">Certificats délivrés</span>
                      <span className="font-extrabold text-amber-700">18 diplômes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6. WHY MWANA LARI? (MISSION & DIASPORA) */}
      <section id="pourquoi" className="py-14 sm:py-20 px-4 sm:px-8 border-b border-brand-300/60">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-brand-300 text-xs font-black uppercase tracking-wider">
                <Globe2 className="w-3.5 h-3.5 text-brand-600" />
                <span>Pourquoi Mwana Lari ?</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-savanna-950 leading-tight">
                Une urgence patrimoniale, une <span className="bg-gradient-to-r from-brand-600 to-terracotta-600 bg-clip-text text-transparent">fierté pour les générations futures</span>.
              </h2>

              <p className="text-xs sm:text-base text-savanna-800 font-medium leading-relaxed">
                Partout dans le monde, la diaspora et les familles citadines constatent que les jeunes générations perdent le contact avec leur langue maternelle. Communiquer avec les aînés, comprendre les proverbes lors des réunions familiales, ou simplement affirmer son identité devient difficile.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-savanna-950">Sauvegarde et transmission active</h4>
                    <p className="text-xs sm:text-sm text-savanna-700">Fixer la langue dans des outils numériques modernes pour qu'elle continue de vivre chez les 3-15 ans.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-terracotta-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-savanna-950">Reconnexion avec la terre d'origine</h4>
                    <p className="text-xs sm:text-sm text-savanna-700">Permettre à l'enfant né en Europe, en Amérique ou à Pointe-Noire de parler fièrement avec sa grand-mère au village.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-savanna-950">100% Hors-Ligne & Accessible</h4>
                    <p className="text-xs sm:text-sm text-savanna-700">Parce que l'accès à internet reste instable ou coûteux dans certaines zones, notre PWA fonctionne sans connexion.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonials cards */}
            <div className="lg:col-span-6 space-y-4">
              
              <div className="glass-card-amber p-5 sm:p-6 rounded-3xl border-2 border-brand-300 shadow-md">
                <div className="flex items-center gap-1 text-amber-500 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-savanna-900 font-medium italic mb-3">
                  « Mes enfants de 6 et 9 ans sont nés à Paris. Grâce aux Jeux de Koko et aux contes sonores, ils savent enfin dire bonjour, compter et chanter en Lari. Quand leur grand-mère a appelé de Brazza, elle en a eu les larmes aux yeux ! »
                </p>
                <div className="flex items-center justify-between text-xs font-bold text-savanna-800">
                  <span>Sandrine M. — Maman de 2 enfants (Paris)</span>
                  <span className="text-brand-700 font-extrabold">Membre Famille</span>
                </div>
              </div>

              <div className="glass-card-forest p-5 sm:p-6 rounded-3xl border-2 border-forest-300 shadow-md">
                <div className="flex items-center gap-1 text-amber-500 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-savanna-900 font-medium italic mb-3">
                  « La rigueur scientifique du dictionnaire et le respect des tons bantous font de Mwana Lari un support remarquable. C'est l'outil moderne que nous attendions tous pour appuyer l'éveil bilingue en classe. »
                </p>
                <div className="flex items-center justify-between text-xs font-bold text-savanna-800">
                  <span>Prof. Guy-Florent N. — Enseignant chercheur (Brazzaville)</span>
                  <span className="text-forest-700 font-extrabold">Partenaire École</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 7. TRANSPARENT PRICING & PLANS */}
      <section id="tarifs" className="py-14 sm:py-20 px-4 sm:px-8 bg-gradient-to-b from-savanna-100 via-white to-savanna-100 border-b border-brand-300/60">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-900 border border-forest-300 text-xs font-black uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-forest-600" />
              <span>Formules Claires & Sans Engagement</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-savanna-950">
              Des tarifs adaptés aux familles et à la diaspora
            </h2>
            <p className="text-xs sm:text-base text-savanna-800 font-medium">
              Payez facilement en devises locales via <strong className="text-brand-900">Airtel Money</strong>, <strong className="text-amber-800">MTN Mobile Money</strong>, ou par carte bancaire internationale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Plan 1: Gratuit Découverte */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-brand-200 shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-black text-savanna-700 uppercase tracking-wider">Initiation</div>
                <h3 className="text-xl font-black text-savanna-950">Gratuit Découverte</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-savanna-950">0 FCFA</span>
                  <span className="text-xs text-savanna-700 font-bold">/ Pour toujours</span>
                </div>
                <p className="text-xs text-savanna-700">Idéal pour faire ses premiers pas et tester les jeux de Koko.</p>
                
                <ul className="space-y-2.5 text-xs text-savanna-900 font-semibold pt-2 border-t border-brand-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Niveau 1 Découverte débloqué</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Dictionnaire de base (50 mots audio)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>1 Mini-jeu de Koko accessible</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>1 Profil enfant</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={onStartLearning}
                  className="w-full py-3 rounded-2xl bg-savanna-200 hover:bg-savanna-300 text-savanna-950 font-extrabold text-xs sm:text-sm transition-all"
                >
                  Commencer Gratuitement
                </button>
              </div>
            </div>

            {/* Plan 2: Pass Famille Étoile (Recommandé) */}
            <div className="relative glass-card-amber p-6 sm:p-8 rounded-3xl border-4 border-brand-500 shadow-2xl flex flex-col justify-between transform md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-600 to-terracotta-600 text-white font-black text-[11px] uppercase tracking-wider shadow-md">
                ⭐ Le Plus Populaire
              </div>

              <div className="space-y-4">
                <div className="text-xs font-black text-brand-800 uppercase tracking-wider">Accès Complet Famille</div>
                <h3 className="text-xl font-black text-savanna-950">Pass Famille Étoile</h3>
                
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-brand-900">1 500 FCFA</span>
                    <span className="text-xs text-brand-800 font-bold">/ mois (ou 2,49 €)</span>
                  </div>
                  <div className="text-[11px] text-forest-700 font-bold mt-0.5">
                    Option annuelle à 15 000 FCFA (2 mois offerts)
                  </div>
                </div>

                <p className="text-xs text-savanna-800">L'expérience complète sans restriction pour toute votre fratrie au Congo.</p>
                
                <ul className="space-y-2.5 text-xs text-savanna-950 font-bold pt-2 border-t border-brand-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Tous les 5 Niveaux débloqués</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Grand Dictionnaire MBUTA (2 668 mots & audio HD)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Tous les 4 Jeux de Koko illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Bibliothèque complète des Contes & Proverbes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Jusqu'à 3 à 5 profils enfants & synchronisation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Mode 100% Hors-Ligne illimité</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  id="landing-pricing-star-btn"
                  onClick={onOpenSubscription}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-amber-500 to-terracotta-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-brand-500/40 hover:brightness-105 active:scale-95 transition-all shimmer-btn"
                >
                  Choisir le Pass Famille (1 500 FCFA)
                </button>
              </div>
            </div>

            {/* Plan 3: Grand Clan, Diaspora & Écoles */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-forest-300 shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-black text-forest-800 uppercase tracking-wider">Grandes Familles & Diaspora</div>
                <h3 className="text-xl font-black text-savanna-950">Grand Clan & Diaspora</h3>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-forest-900">2 500 FCFA</span>
                    <span className="text-xs text-forest-800 font-bold">/ mois (ou 4,99 €)</span>
                  </div>
                  <div className="text-[11px] text-forest-700 font-bold mt-0.5">
                    Option annuelle à 25 000 FCFA (2 mois offerts)
                  </div>
                </div>
                <p className="text-xs text-savanna-700">Pour les grandes fratries, la diaspora internationale et les classes scolaires.</p>
                
                <ul className="space-y-2.5 text-xs text-savanna-900 font-semibold pt-2 border-t border-forest-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Jusqu'à 10 profils enfants ou groupe classe</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Tout le contenu pédagogique & audio HD débloqué</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Tableau de bord Enseignant & suivi personnalisé</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Génération et impression des diplômes de réussite</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Support linguistique et technique prioritaire</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={onOpenSubscription}
                  className="w-full py-3 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-extrabold text-xs sm:text-sm transition-all"
                >
                  Choisir l'Offre Grand Clan (2 500 FCFA)
                </button>
              </div>
            </div>

          </div>

          {/* Payment Badges */}
          <div className="text-center pt-2">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-2xl bg-savanna-200/60 border border-savanna-300 text-xs font-bold text-savanna-800">
              <span>Moyens de paiement acceptés :</span>
              <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 border border-red-200">Airtel Money 📱</span>
              <span className="px-2 py-0.5 rounded-lg bg-yellow-100 text-yellow-900 border border-yellow-300">MTN Mobile Money 🟡</span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-200">Carte Visa / Mastercard 💳</span>
            </div>
          </div>

        </div>
      </section>

      {/* 8. PWA INSTALLATION & ANDROID APK SECTION */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 border-b border-brand-300/60">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card-amber p-8 sm:p-12 rounded-3xl border-2 border-brand-400 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500 text-white text-[11px] font-black uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Disponible sur Tous Vos Appareils</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-black text-savanna-950">
                  Installez Mwana Lari en 1 Clic sur Smartphone, Tablette & Ordinateur
                </h3>

                <p className="text-xs sm:text-base text-savanna-800 font-medium">
                  Grâce à la technologie Progressive Web App (PWA), profitez d'une expérience ultra-fluide identique à une application native, sans passer par un magasin d'applications payant.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-extrabold text-savanna-900">
                  <div className="p-3 bg-white/90 rounded-2xl border border-brand-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>0 Mo d'espace gaspillé</span>
                  </div>
                  <div className="p-3 bg-white/90 rounded-2xl border border-brand-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Mises à jour automatiques</span>
                  </div>
                  <div className="p-3 bg-white/90 rounded-2xl border border-brand-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Fonctionne dans l'avion</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    onClick={onOpenPwaModal}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Installer la PWA (iPhone / Android / PC)</span>
                  </button>

                  <a
                    href="/mwana-lari.apk"
                    download="mwana-lari.apk"
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-savanna-900 hover:bg-black text-white font-extrabold text-xs sm:text-sm shadow-md transition-all"
                  >
                    <span>🤖 Télécharger le package Android (.APK)</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-4 flex items-center justify-center">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-white p-3 shadow-2xl border-4 border-brand-300 flex flex-col items-center justify-center text-center transform hover:rotate-2 transition-transform">
                  <img
                    src="/icons/icon-192.svg"
                    alt="Logo PWA"
                    className="w-24 h-24 object-contain mb-2"
                  />
                  <span className="font-black text-xs text-brand-900">Mwana Lari PWA</span>
                  <span className="text-[10px] text-forest-700 font-extrabold">Hors-Ligne Actif</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION SECTION */}
      <section id="faq" className="py-14 sm:py-20 px-4 sm:px-8 bg-white/80 border-b border-brand-300/60">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-900 border border-brand-300 text-xs font-black uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
              <span>Questions Fréquentes</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-savanna-950">
              Tout ce que vous devez savoir sur Mwana Lari
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "L'application convient-elle à un enfant qui ne parle pas un seul mot de Lari ?",
                a: "Absolument ! Mwana Lari a été spécialement conçue pour les débutants complets. La méthode commence par des salutations imagées simples, des jeux visuels et une immersion auditive bienveillante sans prérequis linguistique."
              },
              {
                q: "Comment fonctionne le mode 100% hors-ligne ?",
                a: "Dès que vous ouvrez l'application avec une connexion, l'ensemble des 2 668 mots de la version MBUTA, des fiches de grammaire et des histoires sont mis en mémoire locale sécurisée (IndexedDB et Service Worker). Vous pouvez ensuite utiliser l'application au village ou dans les transports sans consommer de forfait internet."
              },
              {
                q: "Comment s'effectuent les paiements par Airtel Money et MTN Mobile Money ?",
                a: "Lors de la souscription au Pass Famille Étoile, sélectionnez votre opérateur (Airtel ou MTN) et entrez votre numéro de téléphone. Vous recevez directement un prompt USSD sur votre mobile pour valider la transaction en toute sécurité avec votre code PIN personnel."
              },
              {
                q: "Les données de mes enfants sont-elles protégées ?",
                a: "Oui, de manière absolue. Conformément à la Loi n° 29-2019 de la République du Congo sur la protection des données à caractère personnel et aux standards internationaux de protection de l'enfance, nous ne vendons aucune donnée, n'affichons aucune publicité commerciale, et les espaces sensibles sont protégés par un code PIN parental."
              },
              {
                q: "Puis-je utiliser le même compte sur plusieurs téléphones et tablettes ?",
                a: "Oui ! Le Pass Famille Étoile permet de synchroniser jusqu'à 5 profils enfants distincts sur tous les appareils de la maison (smartphones Android, iPhone, tablettes et ordinateurs)."
              }
            ].map((faq, index) => {
              const isExpanded = expandedFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border-2 border-brand-200/90 bg-savanna-50 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-black text-xs sm:text-base text-savanna-950 hover:text-brand-800 transition-colors gap-3"
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-brand-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-savanna-700 flex-shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-savanna-800 font-medium leading-relaxed border-t border-brand-200/60 bg-white/70">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 10. FINAL CALL TO ACTION BANNER */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-r from-brand-600 via-amber-600 to-terracotta-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-amber-200 text-xs sm:text-sm font-extrabold">
            <span>🇨🇬 Offrez à vos enfants la fierté de leur identité</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Prêt à commencer le voyage linguistique au cœur de la terre Kongo ?
          </h2>

          <p className="text-sm sm:text-lg text-amber-100 font-medium max-w-2xl mx-auto">
            Rejoignez des centaines de familles qui reconnectent chaque jour leurs enfants avec la langue Lari, ses contes et ses traditions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <button
              id="landing-bottom-cta-btn"
              onClick={onStartLearning}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-savanna-950 hover:bg-black text-amber-300 font-black text-sm sm:text-base shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Ouvrir l'Application Mwana Lari</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-sm sm:text-base backdrop-blur-md border border-white/40 transition-all"
            >
              Créer un Compte Famille
            </button>
          </div>
        </div>
      </section>

      {/* 11. PROFESSIONAL COMPREHENSIVE FOOTER */}
      <footer className="bg-savanna-950 text-savanna-200 py-12 px-4 sm:px-8 border-t border-brand-800">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-savanna-800">
            
            {/* Col 1: Brand presentation */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-400 p-1 flex items-center justify-center">
                  <img src="/icons/icon-192.svg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-xl text-amber-400">Mwana Lari</span>
              </div>
              <p className="text-xs text-savanna-300 max-w-sm leading-relaxed">
                Plateforme SaaS EdTech et laboratoire de sauvegarde linguistique dédiée à l'apprentissage interactif du Lari et du patrimoine culturel Kongo (Pool, Congo-Brazzaville).
              </p>
              <div className="text-[11px] text-amber-400/90 font-bold">
                « Apprendre sa langue. Comprendre ses racines. Préparer son avenir. » 🇨🇬
              </div>
            </div>

            {/* Col 2: Navigation rapide */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-black text-white uppercase tracking-wider text-[11px]">Plateforme</h4>
              <ul className="space-y-2">
                <li><button onClick={onStartLearning} className="hover:text-amber-400 transition-colors">Tableau de Bord</button></li>
                <li><button onClick={() => onNavigateTab('dictionary')} className="hover:text-amber-400 transition-colors">Grand Dictionnaire MBUTA</button></li>
                <li><button onClick={() => onNavigateTab('games')} className="hover:text-amber-400 transition-colors">Jeux de Koko</button></li>
                <li><button onClick={() => onNavigateTab('audiolab')} className="hover:text-amber-400 transition-colors">Studio Audio & Phonétique</button></li>
                <li><button onClick={() => onNavigateTab('heritage')} className="hover:text-amber-400 transition-colors">Nzolo ya Bakulu (Contes)</button></li>
              </ul>
            </div>

            {/* Col 3: Publics & Solutions */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-black text-white uppercase tracking-wider text-[11px]">Solutions</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigateTab('family')} className="hover:text-amber-400 transition-colors">Pour les Familles & Enfants</button></li>
                <li><button onClick={() => onNavigateTab('school')} className="hover:text-amber-400 transition-colors">Pour les Écoles & Enseignants</button></li>
                <li><button onClick={onOpenSubscription} className="hover:text-amber-400 transition-colors">Tarifs & Abonnements</button></li>
                <li><button onClick={onOpenPwaModal} className="hover:text-amber-400 transition-colors">Installer l'Application PWA</button></li>
                <li><a href="/mwana-lari.apk" download className="hover:text-amber-400 transition-colors">Télécharger APK Android</a></li>
              </ul>
            </div>

            {/* Col 4: Conformité & Sécurité */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-black text-white uppercase tracking-wider text-[11px]">Légal & Sécurité</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={onOpenPrivacy} className="hover:text-amber-400 transition-colors flex items-center gap-1">
                    <Shield className="w-3 h-3 text-forest-400" />
                    <span>Vie Privée & Mineurs (Loi n° 29-2019)</span>
                  </button>
                </li>
                <li>
                  <button onClick={onOpenLegal} className="hover:text-amber-400 transition-colors flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-400" />
                    <span>Mentions Légales & RFC 9116</span>
                  </button>
                </li>
                <li><a href="/.well-known/security.txt" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">Politique de Sécurité (security.txt)</a></li>
                <li className="text-[11px] text-savanna-400">Paiement Sécurisé SSL 256-bit</li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright & Version */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-savanna-400 font-medium">
            <div>
              © {new Date().getFullYear()} Mwana Lari — Développé pour la préservation des langues africaines. Tous droits réservés.
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-forest-900 text-forest-300 font-bold border border-forest-700">PWA v2.1 Active</span>
              <span>•</span>
              <span>Brazzaville & Diaspora</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
