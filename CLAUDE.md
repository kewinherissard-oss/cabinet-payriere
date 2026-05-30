# Cabinet Vétérinaire Dr PAYRIERE — Site internet

## Description

Site internet professionnel pour le **Cabinet du Dr PAYRIERE**, vétérinaire à Saint-Paul-sur-Save (31530). Interface entièrement en français. Fonctionne en ouvrant `index.html` directement dans un navigateur (protocole `file://`) ou via le serveur de développement local.

Déployé en ligne sur GitHub Pages : **https://kewinherissard-oss.github.io/cabinet-payriere/**

---

## Architecture des fichiers

```
/
├── index.html          # Structure HTML complète
├── style.css           # Système de design complet
├── app.js              # Animations et interactions JS (276 lignes)
├── chatbot.js          # Widget chatbot autonome (IIFE, ~500 lignes)
├── Code.gs             # Google Apps Script — webhook RDV (à déployer)
├── dr-payriere.jpg     # Photo réelle du Dr PAYRIERE (récupérée depuis Discord)
├── CLAUDE.md           # Ce fichier
├── .claude/
│   ├── launch.json     # Config serveur de développement (npx serve -p 3000)
│   └── settings.local.json
└── .gitignore
```

Dépôts Git :
- `origin` → `kewinherissard-oss/mon-budget` (ancien projet, ne pas modifier)
- `payriere` → `kewinherissard-oss/cabinet-payriere` (dépôt actif du site vétérinaire)

---

## Technologies

- **HTML5** — structure sémantique, pas de framework
- **CSS3** — variables CSS, flexbox, grid, responsive mobile-first
- **JavaScript ES6+** — vanilla JS, IIFEs, `requestAnimationFrame`, Canvas 2D
- **GSAP 3.12.5 + ScrollTrigger** — chargé via CDN, uniquement pour les animations au scroll
- **Google Apps Script** — webhook serverless gratuit pour l'automatisation des RDV

> Aucune autre bibliothèque tierce. Pas de bundler, pas de build step.

---

## Structure des sections (index.html)

| Ordre | ID / Classe | Contenu |
|-------|-------------|---------|
| 1 | `header` | Navigation fixe avec burger menu mobile — liens : Accueil, Services, L'équipe, Avis, **Boutique**, Contact, Prendre RDV |
| 2 | `#accueil` `.hero` | Hero 3D parallax — canvas étoilé, orbes photos animaux, titre, CTA |
| 3 | bandeau confiance | 4 points clés (urgences, équipe, matériel, accessibilité) |
| 4 | `#pmarqueeSection` | PerspectiveMarquee — défilement 3D animé en JS natif |
| 5 | `.animal-parade` | Défilé de 5 espèces avec photos rondes (Chiens, Chats, Lapins, Rongeurs, NAC) |
| 6 | `.gallery` | Strip galerie 4 photos réelles d'animaux |
| 7 | `#services` | 5 cartes services (Consultations, Vaccinations, Analyses, Chirurgie, Urgences) |
| 8 | `#equipe` | Photo réelle Dr PAYRIERE (`dr-payriere.jpg`), biographie, 30 ans d'expérience, diplômes |
| 9 | `.philosophie` | Phytothérapie en priorité, stérilisation chat ✅, stérilisation chien par implant |
| 10 | `#temoignages` | **5 vrais avis Google** (3 en grille + 2 en dessous centrés) |
| 11 | `#boutique` | ChronoVet — point relais officiel, liste produits, bouton vers chronovet.fr |
| 12 | `#contact` | Adresse, téléphone, email, urgences Vet-Urgences Ouest, horaires d'ouverture |
| 13 | `footer` | Navigation, copyright, slogan |

---

## Système de design (style.css)

### Variables CSS principales

```css
:root {
  --primary:       #1d4ed8;  /* Bleu royal */
  --primary-light: #dbeafe;
  --primary-dark:  #1e3a8a;
  --accent:        #f59e0b;  /* Or */
  --accent-dark:   #d97706;
  --dark:          #0a0f2e;  /* Marine profond */
  --text:          #1e293b;
  --text-muted:    #64748b;
  --bg:            #f8fafc;
  --surface:       #ffffff;
  --border:        #e2e8f0;
  --radius:        14px;
}
```

### Patterns visuels utilisés

- **Glassmorphisme** — `backdrop-filter: blur()` + bordures semi-transparentes (navbar scrollée, cartes, chatbot)
- **Orbes photos** — images circulaires avec `border-radius: 50%`, `box-shadow` multicouche
- **Hero background** — dégradé Navy→Bleu en overlay sur photo Unsplash (chien)
- **Photos animaux** — Unsplash CDN avec paramètres `?w=&h=&fit=crop&q=80`
- **Photo Dr PAYRIERE** — fichier local `dr-payriere.jpg`, cadré avec `object-position: center 5%; transform: scale(1.5); transform-origin: center 20%` pour zoomer sur le visage/buste
- **Typography** — `clamp()` pour les titres, `font-weight: 900` sur les headings
- **data-gsap-card** — attribut sur les cartes pour l'animation au scroll GSAP

### Classes CSS notables

- `.testimonials-grid` — grille 3 colonnes pour les 3 premiers avis
- `.testimonials-more` — grille 2 colonnes centrée (max-width 820px) pour les 2 avis supplémentaires
- `.about-card img` — `object-fit: cover; object-position: center 5%; transform: scale(1.5)` pour recadrer la photo du Dr
- `#cb-root` — widget chatbot fixe, z-index 1100 (au-dessus du header à 1000)
- `#cb-bubble` — bouton FAB bleu avec animation pulse dorée
- `#cb-panel` — fenêtre chat glassmorphisme `rgba(10,15,46,.92)` + `backdrop-filter: blur(22px)`
- `.cb-chip` — suggestions rapides, hover doré
- `.cb-booking-actions` — boutons d'action post-RDV

---

## Animations JavaScript (app.js)

### 1. Canvas particules (`initCanvas`)
Fond étoilé animé dans le hero. 110 points qui bougent et scintillent via `requestAnimationFrame` sur un `<canvas>`.

### 2. Parallax souris (`initMouseParallax`)
Plusieurs couches `.p-layer` avec `data-depth` (0.05 à 0.45) se déplacent à des vitesses différentes au survol de la souris. Crée un effet 3D sans librairie 3D.

### 3. PerspectiveMarquee (`initPerspectiveMarquee`)
Défilement de texte en 3D (rotateX + rotateY + perspective CSS). Items : `['Chiens', 'Chats', 'Lapins', 'Rongeurs', 'Vaccins', 'Chirurgie', 'Santé']`. Blur et opacité par item selon la distance au centre.

### 4. GSAP ScrollTrigger (sur `window.load`)
- Entrée animée du hero (tag → titre → sous-titre → emojis → CTA)
- Parallax scroll sur les couches du hero
- Fade-out du contenu hero au scroll
- Apparition en stagger des cartes (`.animal-parade`, `[data-gsap-card]`)
- Reveal des sections (`[data-gsap-reveal]`)

---

## Chatbot assistant virtuel (chatbot.js)

Widget IIFE autonome injecté dans `document.body`, aucune dépendance, aucun conflit avec `app.js`.

### Architecture DOM générée

```
#cb-root (position:fixed, bottom:24px, right:24px, z-index:1100)
  ├── #cb-bubble        ← bouton FAB bleu 🐾, animation pulse
  └── #cb-panel         ← fenêtre chat (glassmorphisme navy)
        ├── .cb-header  ← avatar + "Assistant Dr PAYRIERE" + statut vert + ✕
        ├── .cb-messages ← bulles scrollables (bot/user)
        ├── .cb-quick   ← chips suggestions contextuelles
        └── .cb-input-row ← champ texte + bouton envoi doré
```

### Moteur de réponses (NLP léger)
- **Normalisation** : lowercase + suppression accents
- **Scoring keywords** : `hits / keywords.length` — seuil configurable par règle
- **25+ règles** couvrant : horaires (par jour), adresse, téléphone, email, services, espèces, urgences, vaccination, stérilisation, phytothérapie, boutique, domicile, ostéopathie, avis, tarifs, fallback

### Flux de prise de RDV (6 étapes)

```
Étape 1 → Nom du propriétaire
Étape 2 → Téléphone (validation regex)
Étape 3 → Email (validation regex — pour confirmation automatique)
Étape 4 → Créneau souhaité (chips : Lun/Mer/Ven × matin/après-midi)
Étape 5 → Animal + prénom (chips espèces)
Étape 6 → Motif (chips) → sendWebhook() → confirmation ✅
```

- Saisie `annuler` / `stop` à n'importe quelle étape → retour au chat libre
- `sendWebhook(data)` envoie un `fetch() GET mode:no-cors` vers Google Apps Script

### Configuration webhook

Dans `chatbot.js`, ligne à configurer après déploiement du script Google :

```js
const WEBHOOK_URL = 'REMPLACER_PAR_URL_APPS_SCRIPT';
```

---

## Automatisation RDV — Google Apps Script (Code.gs)

Fichier à déployer **une seule fois** sur https://script.google.com (compte mpayriere@gmail.com).

### Ce que fait le script à chaque RDV

1. **Crée un événement Google Calendar** (`CalendarApp`) avec titre, description complète, créneau calculé
2. **Envoie un email de notification** à `mpayriere@gmail.com` (`GmailApp`)
3. **Envoie un email de confirmation** au client (si email fourni)

### Calcul du créneau
- `parseDate(str)` : convertit "Lundi matin" → prochain lundi, heure 10h00
- `getNextWorkday()` : fallback si créneau non parseable → J+1 ouvré
- "matin" → 10h00, "après-midi" → 16h00, durée 30 min

### Déploiement (une seule fois)

```
1. script.google.com → Nouveau projet → coller Code.gs
2. Déployer → Application Web
   - Exécuter en tant que : Moi
   - Accès : Tout le monde
3. Copier l'URL → remplacer WEBHOOK_URL dans chatbot.js
4. git add chatbot.js && git push payriere main
```

---

## Témoignages — Vrais avis Google

Les 5 avis sont issus de Google Reviews (source : bestveterinaire.fr) :

| Auteur | Étoiles | Date | Résumé |
|--------|---------|------|--------|
| Léa L. | ⭐⭐⭐⭐⭐ | Mars 2025 | Urgence chat, très pro, attentionnée, réactive |
| Christopher B. | ⭐⭐⭐⭐⭐ | Déc. 2024 | Suivi lapin + pomsky, très à l'écoute, disponible |
| Florence D. | ⭐⭐⭐⭐⭐ | Déc. 2018 | Approche naturelle, veto en or et passionnée |
| M. L. Chargé | ⭐⭐⭐⭐⭐ | Oct. 2019 | Passionnée, parmi les meilleures rencontrées |
| Jennifer N. | ⭐⭐⭐⭐⭐ | Mars 2019 | Ostéopathie, acupuncture, fleurs de Bach |

---

## Informations du cabinet

- **Nom** : Cabinet du Dr PAYRIERE
- **Adresse** : 3 impasse des Coquelicots, Saint-Paul-sur-Save, 31530
- **Téléphone** : 05 61 49 27 99
- **Email** : mpayriere@gmail.com
- **Urgences** : Vet-Urgences Ouest — 05 61 11 21 31
- **Horaires** : Lun / Mer / Ven 9h30–12h30 et 15h–19h | Mar / Jeu : visites à domicile | Sam / Dim : fermé
- **Espèces** : Chiens, Chats, Lapins, Rongeurs, NAC
- **Boutique** : Point relais ChronoVet officiel (chronovet.fr)

---

## Conventions de code

- Interface entièrement en **français**
- **Aucune bibliothèque tierce** sauf GSAP (CDN, animation uniquement)
- **Aucun commentaire** dans le code sauf les blocs de séparation `/* ══ */`
- JS organisé en **IIFEs** autonomes
- CSS organisé par composant avec commentaires séparateurs `/* ── */`
- Images animaux proviennent d'**Unsplash** via CDN — photo Dr PAYRIERE en **fichier local** (`dr-payriere.jpg`)
- Responsive **mobile-first**, breakpoints à 768px et 480px

---

## Serveur de développement

```bash
npx serve -p 3000 .
# Puis ouvrir http://localhost:3000
```

## Déploiement

```bash
git add .
git commit -m "description"
git push payriere main
# Forcer rebuild GitHub Pages si nécessaire :
gh api repos/kewinherissard-oss/cabinet-payriere/pages/builds --method POST
```
