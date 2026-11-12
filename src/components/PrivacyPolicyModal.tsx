import React from 'react';
import { X, Shield, Lock, FileText, CheckCircle2, HeartHandshake, Eye, UserCheck } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-forest-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-savanna-950">
              Politique de Confidentialité & Protection des Mineurs
            </h2>
            <p className="text-xs sm:text-sm text-savanna-700 font-medium">
              Conformité Loi congolaise n° 29-2019 relative à la protection des données & Standards internationaux EdTech
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-5 text-xs sm:text-sm text-savanna-900 leading-relaxed font-sans">
          
          <section className="bg-forest-50 border border-forest-200 rounded-2xl p-4 space-y-2">
            <h3 className="font-extrabold text-forest-900 flex items-center gap-2 text-sm sm:text-base">
              <HeartHandshake className="w-5 h-5 text-forest-600" />
              1. Notre engagement pour la sécurité des enfants
            </h3>
            <p className="text-forest-800">
              La plateforme <strong>Mwana-Lari</strong> est un espace d'apprentissage culturel et linguistique bienveillant. La protection de la vie privée des enfants et de leurs familles constitue notre priorité absolue. Nous appliquons le principe de <em>Privacy by Design</em> et de minimisation stricte des données collectées.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-extrabold text-savanna-950 text-sm sm:text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-600" />
              2. Données collectées et finalités
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-savanna-800">
              <li>
                <strong>Données des profils enfants :</strong> Prénom (ou pseudonyme), tranche d'âge, avatar choisi, progression pédagogique (niveaux, points XP, assiduité). <em>Aucune donnée d'état civil complet ni géolocalisation précise n'est requise.</em>
              </li>
              <li>
                <strong>Enregistrements vocaux (Laboratoire Audio) :</strong> Les sons prononcés par l'enfant au microphone sont traités localement via la Web Audio API pour la comparaison phonétique. Ils ne sont ni commercialisés, ni transférés à des courtiers de données.
              </li>
              <li>
                <strong>Données des tuteurs légaux / parents :</strong> Adresse email, nom d'usage et numéro de téléphone mobile (pour les notifications et paiements Mobile Money MTN/Airtel).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-extrabold text-savanna-950 text-sm sm:text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-600" />
              3. Consentement parental et Contrôle d'accès
            </h3>
            <p className="text-savanna-800">
              Conformément à la réglementation sur la protection des mineurs, toute inscription et tout abonnement payant sont placés sous la responsabilité exclusive d'un parent ou tuteur majeur. La barrière parentale (*Parental Gate*) protège l'accès aux réglages sensibles et aux achats.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-extrabold text-savanna-950 text-sm sm:text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-600" />
              4. Sécurité des transactions et Chiffrement
            </h3>
            <p className="text-savanna-800">
              Toutes les communications réseau sont chiffrées de bout en bout via TLS 1.3 (HTTPS). Les paiements par Mobile Money (MTN MoMo et Airtel Money) sont traités via des protocoles sécurisés USSD/Push certifiés. Mwana Lari ne conserve aucun code secret bancaire ou code PIN Mobile Money.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-extrabold text-savanna-950 text-sm sm:text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              5. Vos droits (Accès, Rectification, Suppression)
            </h3>
            <p className="text-savanna-800">
              À tout moment, les parents et tuteurs peuvent demander l'exportation complète ou la suppression définitive du compte et des profils enfants associés en écrivant à notre Délégué à la Protection des Données (DPO) :
            </p>
            <div className="bg-savanna-100 rounded-xl p-3 border border-savanna-300 font-mono text-xs text-savanna-900">
              📧 Contact DPO & Sécurité : <strong>dpo@cmd.cg</strong> ou <strong>security@cmd.cg</strong><br />
              🏢 Organisation : CMD Congo — Brazzaville, République du Congo
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-savanna-200 pt-4 flex items-center justify-between">
          <span className="text-[11px] text-savanna-600">
            Dernière révision : Août 2026 • Version 1.2
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md transition-all"
          >
            J'ai compris et j'accepte
          </button>
        </div>
      </div>
    </div>
  );
};
