# ☁️ Guide de Déploiement du Backend Cloud & Base de Données en Ligne (Mwana Lari SaaS)

Ce guide détaille la mise en ligne du **Backend FastAPI** et de la **Base de Données PostgreSQL** pour l'application **Mwana Lari**.

---

## 🗄️ Architecture du Cloud Backend

```
┌────────────────────────────────────────────────────────┐
│   FRONTEND PWA / WORDPRESS (www.cmd.cg)                │
│   (React + TypeScript + Mode Hors-Ligne PWA)           │
└───────────────────────┬────────────────────────────────┘
                        │ Appels REST HTTPS / JSON (/api/v1)
                        ▼
┌────────────────────────────────────────────────────────┐
│   BACKEND CLOUD FASTAPI (Docker / Render / VPS)        │
│   • Authentification JWT Multi-Rôles                   │
│   • Gestion des 529 Mots & Audios HD                   │
│   • Passerelle MTN MoMo & Airtel Money                 │
│   • Suivi des Enfants & Validations MBUTA              │
└───────────────────────┬────────────────────────────────┘
                        │ SQLAlchemy Connection Pooling
                        ▼
┌────────────────────────────────────────────────────────┐
│   BASE DE DONNÉES POSTGRESQL EN LIGNE                  │
│   (Supabase / Neon.tech / Render / AWS RDS)            │
│   Tables : users, children, words, stories, payments...│
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Option 1 : Déploiement 100% Gratuit & Managé (Render + Neon / Supabase) — *Recommandé*

### Étape 1 : Créer la Base de Données PostgreSQL en Ligne (Neon ou Supabase)
1. Rendez-vous sur **[Neon.tech](https://neon.tech)** ou **[Supabase.com](https://supabase.com)** (Offre gratuite généreuse).
2. Créez un nouveau projet : `mwana-lari-db`.
3. Copiez la chaîne de connexion PostgreSQL (`DATABASE_URL`), par exemple :
   ```
   postgresql://mwana_user:VotreMotDePasse@ep-cool-cloud.neon.tech/mwana_lari_db?sslmode=require
   ```

### Étape 2 : Déployer le Backend FastAPI sur Render.com
1. Connectez-vous sur **[Render.com](https://render.com)** avec votre compte GitHub.
2. Cliquez sur **« New »** ➔ **« Blueprint »** (ou **« Web Service »**).
3. Sélectionnez le dépôt : `linclaudebileko-gif/mwana-lari`.
4. Render détectera automatiquement le fichier [`render.yaml`](file:///c:/Users/DELL/Mwana%20Lari/render.yaml).
5. Renseignez les variables d'environnement suivantes :
   * `DATABASE_URL` : *Collez l'URL de votre base PostgreSQL (Neon / Supabase / Render)*.
   * `SECRET_KEY` : *Générez une clé aléatoire sécurisée*.
   * `ENVIRONMENT` : `production`
   * `ALLOWED_ORIGINS` : `*` (ou `https://www.cmd.cg,https://mwanalari.cg`)
6. Cliquez sur **« Apply »** / **« Deploy »**.
7. En moins de 2 minutes, votre API sera en ligne avec son URL sécurisée (ex: `https://mwana-lari-api.onrender.com`).

---

## 🐳 Option 2 : Déploiement sur Serveur VPS / Dédié (Docker Compose)

Si vous possédez un serveur VPS (Ubuntu / Debian / AlmaLinux) avec Docker installé :

```bash
# 1. Cloner le projet depuis GitHub
git clone https://github.com/linclaudebileko-gif/mwana-lari.git
cd mwana-lari

# 2. Lancer la base PostgreSQL et le Backend en arrière-plan
docker compose up -d --build

# 3. Vérifier les logs et la santé des services
docker compose ps
docker compose logs -f api
```

L'API sera instantanément disponible sur `http://IP_DE_VOTRE_SERVEUR:8000`.

---

## 🌱 Étape 3 : Initialisation & Seeding des 529 Mots dans le Cloud

Pour peupler automatiquement votre base PostgreSQL en ligne avec les **529 mots Lari certifiés**, les contes, les forfaits Mobile Money et les comptes de démonstration :

Exécutez simplement la commande suivante depuis votre terminal :

```bash
# En local ou sur le serveur :
DATABASE_URL="postgresql://user:pass@votre-serveur-db:5432/mwana_lari_db" python backend/migrate_and_seed.py
```

Résultat attendu :
```
============================================================
[MWANA LARI] MIGRATION ET SEEDING CLOUD DATABASE
============================================================
[OK] Connexion à la base de données réussie !
[OK] Toutes les tables ont été créées avec succès !
[SEED] OK - Langues enregistrées (Lari, Lingala, Kikongo).
[SEED] OK - Utilisateurs démo créés (Admin, Linguiste, Parent, Enseignant).
[SEED] OK - 529 mots Lari insérés avec succès depuis la base lexicale.
[SEED] OK - Contes et proverbes patrimoniaux insérés.
[SEED] OK - Forfaits d'abonnement Mobile Money insérés en base.
[OK] Migration et Seeding terminés avec succès !
============================================================
```

---

## 🔗 Étape 4 : Lier le Frontend WordPress (`www.cmd.cg`) au Backend Cloud

Une fois votre Backend déployé (ex: `https://mwana-lari-api.onrender.com`), liez-le au Frontend WordPress de deux façons très simples :

### Méthode A : Configuration Runtime dans WordPress (Recommandée)
Dans votre page WordPress ou dans le fichier `index.html`, ajoutez la balise suivante avant le chargement des scripts :

```html
<script>
  window.__MWANA_API_URL__ = "https://mwana-lari-api.onrender.com/api/v1";
</script>
```

### Méthode B : Mode Hybride / Hors-Ligne Automatique
Si le serveur Cloud est momentanément en maintenance ou que l'utilisateur est dans une zone sans connexion au Congo :
* L'application bascule **automatiquement et de manière transparente** sur le stockage local (PWA Offline First).
* Les progrès de l'enfant et les mots appris sont conservés localement et resynchronisés dès le retour de la connexion !

---

## 🛡️ Comptes de Démonstration Inclus dans la Base en Ligne

| Rôle | Email | Mot de passe | Permissions |
| :--- | :--- | :--- | :--- |
| 👑 **Administrateur** | `admin@mwanalari.cg` | `MwanaLari2026!` | Gestion globale, statistiques & validation |
| 👵 **Linguiste MBUTA** | `linguiste@mwanalari.cg` | `MwanaLari2026!` | Validation des sons vocaux & enrichissement |
| 👨‍👩‍👧 **Parent d'élève** | `parent@mwanalari.cg` | `MwanaLari2026!` | Espace Famille, Enfants & Abonnements MoMo |
| 👨‍🏫 **Enseignant** | `enseignant@mwanalari.cg` | `MwanaLari2026!` | Suivi de classe & devoirs |
