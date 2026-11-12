import React from 'react';
import { X, Scale, ShieldAlert, Globe, Server, Code2 } from 'lucide-react';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-savanna-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-white border-2 border-brand-300 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-savanna-700 hover:text-savanna-950 hover:bg-savanna-100 transition-colors"
          title="Fermer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-savanna-200 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-600 flex items-center justify-center text-white shadow-md">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-savanna-950">
              Mentions Légales & Divulgation de Sécurité
            </h2>
            <p className="text-xs sm:text-sm text-savanna-700 font-medium">
              Informations sur l'éditeur, l'hébergement et la sécurité de l'infrastructure
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-5 text-xs sm:text-sm text-savanna-900 leading-relaxed font-sans">
          
          <section className="space-y-2">
            <h3 className="font-extrabold text-savanna-950 text-sm sm:text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-600" />
              1. Éditeur de la plateforme
            </h3>
            <p className="text-savanna-800">
              Le service <strong>Mwana Lari</strong> est édité par l'organisation <strong>CMD Congo</strong>.<br />
              <strong>Siège social :</strong> Brazzaville, République du Congo.<br />
              <strong>Site web officiel :</strong> <a href="https://www.cmd.cg" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline font-bold">www.cmd.cg</a><br />
              <strong>Contact général :</strong> contact@cmd.cg
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-extrabold text-savanna-950 text-sm sm:text-base flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-600" />
              2. Hébergement & Infrastructure
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-savanna-800">
              <li><strong>Front-End Web & CDN Statique :</strong> Infrastructure haute disponibilité Apache / Nginx / CDN, desservie sous protocole sécurisé HTTPS / TLS.</li>
              <li><strong>API Cloud & Bases de Données :</strong> Serveurs d'applications conteneurisés avec chiffrement des données au repos et en transit.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-extrabold text-savanna-950 text-sm sm:text-base flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand-600" />
              3. Propriété intellectuelle & Patrimoine linguistique
            </h3>
            <p className="text-savanna-800">
              Les contenus culturels, contes traditionnels, proverbes et lexiques sont préservés selon la méthodologie scientifique MBUTA. La plateforme est publiée sous licence libre MIT pour favoriser l'essor et la sauvegarde des langues africaines.
            </p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
            <h3 className="font-extrabold text-amber-950 text-sm sm:text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              4. Politique de Divulgation Responsable de Sécurité (RFC 9116)
            </h3>
            <p className="text-amber-900">
              Si vous découvrez une faille de sécurité ou une vulnérabilité potentielle sur nos services, nous vous prions de ne pas l'exploiter et de nous la signaler de manière responsable selon la norme RFC 9116 :
            </p>
            <div className="bg-white/80 rounded-xl p-3 border border-amber-300 font-mono text-xs text-amber-950">
              🔒 Équipe Cybersécurité : <strong>security@cmd.cg</strong><br />
              📄 Fichier de sécurité officiel : <strong>/.well-known/security.txt</strong>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-savanna-200 pt-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
