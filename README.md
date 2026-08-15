# 🇨🇬 Mwana Lari — Plateforme EdTech & Patrimoine Linguistique Lari

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-green.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

> **« Apprendre sa langue. Comprendre ses racines. Préparer son avenir. »**

**Mwana Lari** est une plateforme SaaS EdTech bilingue (**Lari ↔ Français / Anglais**) dédiée à l'apprentissage interactif, la préservation et la transmission intergénérationnelle de la langue et de la culture **Lari** (Congo-Brazzaville, Pool) pour les enfants (3 à 15 ans), leurs parents, leurs aînés et les écoles.

---

## 🏛️ Les 4 Piliers Fondateurs

```
┌────────────────────────────────────────────────────────────────────────┐
│                              MWANA LARI                                │
├──────────────┬──────────────────┬────────────────────┬─────────────────┤
│   🗣️ LANGUE   │    📚 CULTURE    │     👨‍👩‍👧 FAMILLE    │  🤖 TECHNOLOGIE │
│ Progression  │ Contes, proverbes│ Défis quotidiens   │ Audio HD, PWA,  │
│ 5 niveaux    │ & littérature    │ & reconnexion      │ Offline-First & │
│ pédagogiques │ orale Lari       │ des générations    │ Gamification    │
└──────────────┴──────────────────┴────────────────────┴─────────────────┘
```

---

## ✨ Fonctionnalités Majeures

- 🧭 **Dashboard & Parcours Pédagogique** : Niveaux d'apprentissage progressifs (Niveau 1 à 5), gestion des points d'expérience (XP), séries d'assiduité (*streaks*) et arbre de compétences.
- 🎙️ **Laboratoire Audio & Prononciation** : Écoute en haute définition des sons tonals lari, enregistrement au micro et comparaison vocale.
- 🎮 **Koko Games** : Mini-jeux ludo-éducatifs (Énigmes de Koko, Mémory des cartes, Écoute & Trouve, Puzzles de mots).
- 📖 **Dictionnaire Culturel Intelligent** : Recherche bidirectionnelle instantanée Lari ↔ Français, filtres par classes nominales bantoues, exemples bilingues et notes historiques.
- 👵 **Nzolo ya Bakulu (Héritage des Aînés)** : Bibliothèque de contes traditionnels (*Nkosi na Mbwa*, *Ngo na Nsusu*...), proverbes et berceuses avec paysages sonores traditionnels (Sanza / Kalimba).
- 👨‍👩‍👧 **Espace Famille & Défis Intergénérationnels** : Défis du soir partagés entre parents et enfants, suivi du temps d'écran et contrôle parental.
- 🏫 **Mwana Lari École** : Dashboard enseignant pour gérer les classes et suivre les progrès des élèves.
- 📶 **PWA & Mode 100% Hors-Ligne** : Fonctionnement complet sans connexion Internet grâce à IndexedDB et synchronisation automatique.

---

## 📁 Documentation & Ressources Scientifiques

- 📄 [Cahier des Charges Fonctionnel & Technique V1.0](docs/cahier_des_charges_v1.0.md) : Spécifications détaillées, personas, modèle de données et roadmap.
- 📚 [Répertoire des 48 Sources Documentaires](docs/base_documentaire_lari/SOURCES_BIBLIOGRAPHIQUES.md) : Dictionnaires, grammaires, thèses et archives historiques classés de A à L.
- 🗣️ [Guide Linguistique & Phonologique du Lari](docs/base_documentaire_lari/GUIDE_LINGUISTIQUE_LARI.md) : Phonologie, tons, 18 classes nominales et syntaxe.
- 📊 [Base Lexicale Structurée (JSON)](data/lexicon/dictionnaire_lari_francais.json) & [CSV](data/lexicon/dictionnaire_lari_francais.csv).

---

## 🛠️ Stack Technologique

- **Frontend** : React 18, TypeScript, Tailwind CSS, Lucide Icons, Web Audio API, Service Worker / PWA.
- **Backend** : FastAPI (Python), SQLAlchemy, Pydantic v2, SQLite / PostgreSQL.
- **Synthèse & Audio** : Synthétiseur formantique Web Audio API et moteur de paysages sonores traditionnels.

---

## 🚀 Installation & Lancement Local

### Prérequis
- Node.js (v18+)
- Python 3.10+ (pour le backend FastAPI optionnel)

### 1. Cloner le dépôt
```bash
git clone https://github.com/linclaudebileko-gif/mwana-lari.git
cd mwana-lari
```

### 2. Lancer le Frontend
```bash
# Générer les fichiers audio et compiler le bundle
node scripts/generate_audio.js
node build.cjs

# Démarrer le serveur local
node serve.js
```
👉 Accédez à l'application sur : **`http://localhost:3000/`**

### 3. Lancer le Backend API (Optionnel)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # ou .\.venv\Scripts\activate sur Windows
pip install -r requirements.txt
python run.py
```
👉 API Swagger disponible sur : **`http://localhost:8000/docs`**

---

## 🤝 Contribution & Gouvernance

Les contributions pour enrichir le lexique, corriger des prononciations ou ajouter des contes traditionnels sont les bienvenues.
Toute modification linguistique est soumise à validation selon le standard **MBUTA** et les travaux scientifiques du comité de relecture.

---

## 📄 Licence

Ce projet est sous licence MIT.
*Conçu avec passion pour la préservation et la transmission des langues africaines.* 🇨🇬
