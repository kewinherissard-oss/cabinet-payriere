'use strict';

/* ══════════════════════════════════════════════
   CHATBOT — Cabinet Dr PAYRIERE
   Widget autonome, aucune dépendance externe
   ══════════════════════════════════════════════ */
(function ChatBot() {

  /* ── Base de connaissances ── */
  const KB = {
    name:    'Cabinet Vétérinaire Dr PAYRIERE',
    address: '3 impasse des Coquelicots, Saint-Paul-sur-Save (31530)',
    phone:   '05 61 49 27 99',
    email:   'mpayriere@gmail.com',
    hours: {
      lundi:    '9h30 – 12h30 et 15h – 19h',
      mardi:    'Visites à domicile uniquement',
      mercredi: '9h30 – 12h30 et 15h – 19h',
      jeudi:    'Visites à domicile uniquement',
      vendredi: '9h30 – 12h30 et 15h – 19h',
      samedi:   'Fermé',
      dimanche: 'Fermé',
    },
    emergency: { name: 'Vet-Urgences Ouest', phone: '05 61 11 21 31' },
  };

  /* ── Règles de réponse ── */
  const RULES = [
    {
      id: 'bonjour',
      keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou', 'hey'],
      threshold: 0.8,
      response: 'Bonjour ! 😊 Comment puis-je vous aider aujourd\'hui ?',
      chips: ['Horaires', 'Prendre RDV', 'Services', 'Urgences'],
    },
    {
      id: 'merci',
      keywords: ['merci', 'super', 'parfait', 'nickel', 'genial', 'top'],
      threshold: 0.8,
      response: 'Avec plaisir ! 🐾 N\'hésitez pas si vous avez d\'autres questions.',
      chips: ['Prendre RDV', 'Horaires', 'Adresse'],
    },
    {
      id: 'horaires',
      keywords: ['horaire', 'ouvert', 'ouverture', 'ferme', 'heure', 'quand', 'disponible'],
      threshold: 0.2,
      response: () => `Voici nos horaires d'ouverture :<br><br>
        🗓️ <strong>Lundi / Mercredi / Vendredi</strong><br>9h30 – 12h30 et 15h – 19h<br><br>
        🏠 <strong>Mardi / Jeudi</strong><br>Visites à domicile uniquement<br><br>
        🔴 <strong>Samedi / Dimanche</strong><br>Fermé`,
      chips: ['Prendre RDV', 'Adresse', 'Urgences'],
    },
    {
      id: 'horaires-lundi',
      keywords: ['lundi'],
      threshold: 0.9,
      response: '🗓️ Le cabinet est ouvert <strong>le lundi de 9h30 à 12h30 et de 15h à 19h</strong>.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-mardi',
      keywords: ['mardi'],
      threshold: 0.9,
      response: '🏠 Le mardi, le Dr PAYRIERE effectue des <strong>visites à domicile uniquement</strong>. Pas de consultations au cabinet.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-mercredi',
      keywords: ['mercredi'],
      threshold: 0.9,
      response: '🗓️ Le cabinet est ouvert <strong>le mercredi de 9h30 à 12h30 et de 15h à 19h</strong>.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-jeudi',
      keywords: ['jeudi'],
      threshold: 0.9,
      response: '🏠 Le jeudi, le Dr PAYRIERE effectue des <strong>visites à domicile uniquement</strong>. Pas de consultations au cabinet.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-vendredi',
      keywords: ['vendredi'],
      threshold: 0.9,
      response: '🗓️ Le cabinet est ouvert <strong>le vendredi de 9h30 à 12h30 et de 15h à 19h</strong>.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-weekend',
      keywords: ['samedi', 'dimanche', 'weekend', 'week-end'],
      threshold: 0.8,
      response: '🔴 Le cabinet est <strong>fermé le samedi et le dimanche</strong>. Pour une urgence en dehors des horaires, contactez Vet-Urgences Ouest.',
      chips: ['Urgences', 'Tous les horaires'],
    },
    {
      id: 'adresse',
      keywords: ['adresse', 'ou', 'situe', 'trouver', 'localisation', 'gps', 'chemin', 'venir', 'aller'],
      threshold: 0.2,
      response: '📍 Nous sommes au <strong>3 impasse des Coquelicots, Saint-Paul-sur-Save (31530)</strong>.<br><br>En face de l\'Intermarché, grand parking gratuit.',
      chips: ['Horaires', 'Téléphone', 'Prendre RDV'],
    },
    {
      id: 'telephone',
      keywords: ['telephone', 'appeler', 'numero', 'tel', 'appel', 'contact', 'joindre'],
      threshold: 0.25,
      response: '📞 Vous pouvez nous appeler au <strong><a href="tel:0561492799">05 61 49 27 99</a></strong>.<br><br>Horaires d\'appel : Lun / Mer / Ven 9h30–12h30 et 15h–19h.',
      chips: ['Horaires', 'Prendre RDV'],
    },
    {
      id: 'email',
      keywords: ['email', 'mail', 'courriel', 'ecrire', 'message'],
      threshold: 0.5,
      response: '✉️ Vous pouvez nous écrire à <strong><a href="mailto:mpayriere@gmail.com">mpayriere@gmail.com</a></strong>.',
      chips: ['Téléphone', 'Prendre RDV'],
    },
    {
      id: 'rdv',
      keywords: ['rendez', 'rdv', 'consulter', 'reservation', 'reserver', 'appointment', 'prendre', 'planifier'],
      threshold: 0.2,
      action: 'booking',
      response: 'Je vais vous aider à préparer votre demande de rendez-vous ! 📅',
      chips: [],
    },
    {
      id: 'services',
      keywords: ['service', 'soin', 'propose', 'offre', 'prestation', 'fait', 'pratique'],
      threshold: 0.2,
      response: `Voici nos services :<br><br>
        🩺 <strong>Consultations</strong> & urgences<br>
        💉 <strong>Vaccinations</strong><br>
        🔬 <strong>Analyses</strong> & échographie<br>
        🏥 <strong>Chirurgie</strong> (stérilisation, extractions…)<br>
        🦷 <strong>Dentisterie</strong> & détartrage<br>
        🌿 <strong>Phytothérapie</strong> & médecine naturelle`,
      chips: ['Prendre RDV', 'Espèces acceptées', 'Stérilisation'],
    },
    {
      id: 'especes',
      keywords: ['espece', 'animal', 'accepte', 'accueille', 'recoivent', 'type', 'quelle'],
      threshold: 0.2,
      response: 'Nous accueillons avec plaisir :<br><br>🐶 Chiens &nbsp; 🐱 Chats &nbsp; 🐰 Lapins<br>🐹 Rongeurs &nbsp; 🦜 Oiseaux &nbsp; 🐍 NAC<br><br>Bref, tous vos compagnons sont les bienvenus ! 🐾',
      chips: ['Services', 'Prendre RDV'],
    },
    {
      id: 'chien',
      keywords: ['chien', 'chienne', 'toutou', 'canin', 'canine'],
      threshold: 0.8,
      response: '🐶 Bien sûr, nous prenons en charge les chiens pour toutes les consultations : vaccinations, chirurgie, dentisterie, bilans de santé et bien plus !',
      chips: ['Vaccination chien', 'Stérilisation', 'Prendre RDV'],
    },
    {
      id: 'chat',
      keywords: ['chat', 'chatte', 'felin', 'chaton'],
      threshold: 0.8,
      response: '🐱 Nous accueillons les chats pour toutes les consultations. Le Dr PAYRIERE a une approche douce qui permet de manipuler même les chats les plus craintifs !',
      chips: ['Vaccination chat', 'Stérilisation', 'Prendre RDV'],
    },
    {
      id: 'lapin',
      keywords: ['lapin', 'lapine', 'lapereau', 'cuniculture'],
      threshold: 0.8,
      response: '🐰 Le Dr PAYRIERE est expérimentée avec les lapins — suivi régulier, vaccination myxomatose/VHD, stérilisation et soins dentaires.',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'urgence',
      keywords: ['urgence', 'urgent', 'nuit', 'garde', 'week-end', 'weekend', 'fermé', 'ferme', 'dehors'],
      threshold: 0.2,
      response: `🚨 En dehors de nos horaires, contactez :<br><br>
        <strong>Vet-Urgences Ouest</strong><br>
        📞 <a href="tel:0561112131">05 61 11 21 31</a><br><br>
        Disponibles 24h/24 pour les urgences vétérinaires.`,
      chips: ['Horaires du cabinet', 'Adresse'],
    },
    {
      id: 'tarif',
      keywords: ['tarif', 'prix', 'cout', 'combien', 'cher', 'euro', 'facturation'],
      threshold: 0.3,
      response: 'Pour connaître nos tarifs, n\'hésitez pas à nous appeler directement 📞<br><br><a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br><br>Nous répondrons à toutes vos questions !',
      chips: ['Prendre RDV', 'Horaires'],
    },
    {
      id: 'phyto',
      keywords: ['naturel', 'plante', 'phytotherapie', 'naturelle', 'huile', 'homeopathie', 'douce'],
      threshold: 0.25,
      response: '🌿 Le Dr PAYRIERE privilégie les solutions naturelles avant les traitements conventionnels :<br><br>• Phytothérapie (plantes médicinales)<br>• Huiles essentielles vétérinaires<br>• Oligoéléments & compléments naturels<br>• Acupuncture & fleurs de Bach<br><br>La médecine conventionnelle intervient en complément si nécessaire.',
      chips: ['Services', 'Prendre RDV'],
    },
    {
      id: 'sterilisation',
      keywords: ['sterilisation', 'steriliser', 'castration', 'castrer', 'opere', 'suprelorin', 'implant', 'hormonal'],
      threshold: 0.2,
      response: `🐱 <strong>Stérilisation du chat</strong> : recommandée chirurgicalement. Prévient les maladies hormonales et améliore l'espérance de vie.<br><br>
        🐶 <strong>Stérilisation du chien</strong> : le Dr PAYRIERE préfère l'<strong>implant hormonal Suprelorin®</strong> — réversible, sans anesthésie générale, préserve l'équilibre hormonal.`,
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'vaccin',
      keywords: ['vaccin', 'vaccination', 'primo', 'rappel', 'vacciner', 'immunite'],
      threshold: 0.25,
      response: `💉 Nous proposons les vaccinations pour toutes les espèces :<br><br>
        🐶 <strong>Chien</strong> : primo à 6-8 semaines, rappel à 1 an, puis tous les 1-3 ans<br>
        🐱 <strong>Chat</strong> : primo à 8-9 semaines, rappel annuel<br>
        🐰 <strong>Lapin</strong> : myxomatose + VHD, rappel annuel<br><br>
        Consultez-nous pour un programme personnalisé !`,
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'puce',
      keywords: ['puce', 'tatouage', 'identification', 'identifier', 'chip', 'transpondeur'],
      threshold: 0.3,
      response: '🔖 L\'identification est <strong>obligatoire en France</strong> pour les chiens (4 mois) et les chats (7 mois). Nous réalisons la pose de puce électronique au cabinet.',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'parasites',
      keywords: ['vermifuge', 'ver', 'parasite', 'antipuce', 'tique', 'antiparasitaire', 'puce'],
      threshold: 0.25,
      response: '🛡️ Nous vous conseillons et prescrivons les traitements antiparasitaires adaptés à votre animal (vermifuges, antiparasitaires externes, colliers…). Demandez-nous lors de votre prochaine visite !',
      chips: ['Prendre RDV', 'Boutique ChronoVet'],
    },
    {
      id: 'boutique',
      keywords: ['boutique', 'chronovet', 'commande', 'produit', 'medicament', 'acheter', 'relais', 'livraison'],
      threshold: 0.2,
      response: '🛒 Le cabinet est <strong>point relais ChronoVet officiel</strong> !<br><br>Commandez vos produits vétérinaires en ligne sur <a href="https://www.chronovet.fr" target="_blank">chronovet.fr</a> et récupérez-les directement au cabinet — <strong>sans frais de livraison</strong>.',
      chips: ['Horaires', 'Adresse'],
    },
    {
      id: 'domicile',
      keywords: ['domicile', 'maison', 'deplacement', 'visite', 'venir', 'chez'],
      threshold: 0.3,
      response: '🏠 Le Dr PAYRIERE effectue des <strong>visites à domicile le mardi et le jeudi</strong>. Appelez-nous pour organiser une visite chez vous !<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV', 'Horaires'],
    },
    {
      id: 'osteo',
      keywords: ['osteopathie', 'osteo', 'acupuncture', 'bach', 'fleur', 'manipulation'],
      threshold: 0.3,
      response: '🌸 Le Dr PAYRIERE pratique également :<br><br>• <strong>Ostéopathie</strong> animale<br>• <strong>Acupuncture</strong><br>• <strong>Fleurs de Bach</strong><br><br>Ces approches douces permettent de traiter même les animaux les plus anxieux sans sédation.',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'alimentation',
      keywords: ['alimentation', 'nourriture', 'croquette', 'regime', 'manger', 'poids', 'obese', 'diet'],
      threshold: 0.25,
      response: '🥗 Le Dr PAYRIERE peut vous conseiller sur l\'alimentation adaptée à votre animal lors d\'une consultation. Une alimentation équilibrée est essentielle à la santé de votre compagnon !',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'avis',
      keywords: ['avis', 'temoignage', 'recommande', 'opinion', 'note', 'etoile', 'google'],
      threshold: 0.3,
      response: '⭐⭐⭐⭐⭐ Nos clients nous font confiance !<br><br><em>« Très pro, attentionnée et réactive »</em> — Léa L.<br><em>« Vous pouvez y aller les yeux fermés »</em> — Christopher B.<br><em>« Une veto en or et passionnée »</em> — Florence D.',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: '_fallback',
      keywords: [],
      threshold: -1,
      response: 'Je ne suis pas sûr de comprendre votre question. 🐾<br><br>Vous pouvez nous appeler directement au <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a> pour toute question spécifique.',
      chips: ['Horaires', 'Adresse', 'Prendre RDV', 'Urgences'],
    },
  ];

  /* ── Webhook Google Apps Script ── */
  const WEBHOOK_URL = 'REMPLACER_PAR_URL_APPS_SCRIPT';

  function sendWebhook(data) {
    if (WEBHOOK_URL === 'REMPLACER_PAR_URL_APPS_SCRIPT') return;
    const params = new URLSearchParams({
      name:   data.name   || '',
      phone:  data.phone  || '',
      email:  data.email  || '',
      date:   data.date   || '',
      animal: data.animal || '',
      motive: data.motive || '',
    });
    fetch(WEBHOOK_URL + '?' + params.toString(), { mode: 'no-cors' }).catch(() => {});
  }

  /* ── État interne ── */
  let panelOpen   = false;
  let booking     = false;
  let bookingStep = 0;
  let bookingData = {};

  /* ── Références DOM (remplies dans buildDOM) ── */
  let elRoot, elBubble, elPanel, elMessages, elQuick, elInput, elSend, elTyping;

  /* ── Construction du DOM ── */
  function buildDOM() {
    elRoot = make('div', { id: 'cb-root' });

    elBubble = make('button', { id: 'cb-bubble', 'aria-label': 'Ouvrir l\'assistant', title: 'Assistant virtuel' });
    elBubble.innerHTML = '🐾';

    elPanel = make('div', { id: 'cb-panel', role: 'dialog', 'aria-label': 'Assistant du cabinet vétérinaire' });
    elPanel.innerHTML = `
      <div class="cb-header">
        <div class="cb-header-info">
          <div class="cb-header-avatar">🐾</div>
          <div>
            <div class="cb-header-name">Assistant Dr PAYRIERE</div>
            <div class="cb-header-status"><span class="cb-status-dot"></span>En ligne</div>
          </div>
        </div>
        <button class="cb-close" aria-label="Fermer">✕</button>
      </div>
      <div class="cb-messages" id="cb-messages" role="log" aria-live="polite"></div>
      <div class="cb-quick" id="cb-quick"></div>
      <div class="cb-input-row">
        <input id="cb-input" type="text" placeholder="Écrivez votre message…" autocomplete="off" maxlength="300">
        <button id="cb-send" aria-label="Envoyer">➤</button>
      </div>
    `;

    elRoot.appendChild(elBubble);
    elRoot.appendChild(elPanel);
    document.body.appendChild(elRoot);

    elMessages = document.getElementById('cb-messages');
    elQuick    = document.getElementById('cb-quick');
    elInput    = document.getElementById('cb-input');
    elSend     = document.getElementById('cb-send');

    elTyping = make('div', { class: 'cb-typing' });
    elTyping.innerHTML = '<span></span><span></span><span></span>';
  }

  function make(tag, attrs) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  /* ── Helpers messages ── */
  function appendMsg(role, html) {
    const el = make('div', { class: 'cb-msg', 'data-role': role });
    el.innerHTML = role === 'user' ? escapeHtml(html) : html;
    elMessages.appendChild(el);
    scrollBottom();
    return el;
  }

  function showTyping() {
    elMessages.appendChild(elTyping);
    scrollBottom();
  }

  function hideTyping() {
    if (elTyping.parentNode) elTyping.parentNode.removeChild(elTyping);
  }

  function setChips(labels) {
    elQuick.innerHTML = '';
    (labels || []).forEach(label => {
      const btn = make('button', { class: 'cb-chip' });
      btn.textContent = label;
      btn.addEventListener('click', () => handleInput(label));
      elQuick.appendChild(btn);
    });
  }

  function scrollBottom() {
    setTimeout(() => { elMessages.scrollTop = elMessages.scrollHeight; }, 50);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Moteur NLP ── */
  function normalize(str) {
    return str.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function matchScore(rule, tokens) {
    if (!rule.keywords.length) return -1;
    const hits = rule.keywords.filter(kw =>
      tokens.some(tok => tok.includes(kw) || kw.includes(tok))
    );
    return hits.length / rule.keywords.length;
  }

  function findBestRule(input) {
    const tokens = normalize(input).split(' ');
    let best = null, bestScore = -Infinity;
    RULES.forEach(rule => {
      const score = matchScore(rule, tokens);
      if (score >= rule.threshold && score > bestScore) {
        best = rule;
        bestScore = score;
      }
    });
    return best || RULES.find(r => r.id === '_fallback');
  }

  /* ── Flux de prise de rendez-vous ── */
  function startBooking() {
    booking = true;
    bookingStep = 1;
    bookingData = {};
    setChips([]);
    setTimeout(() => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        appendMsg('bot', 'Pour préparer votre demande, j\'ai besoin de quelques informations. 📋<br><br><strong>Quel est votre prénom et nom ?</strong>');
        scrollBottom();
      }, 700);
    }, 300);
  }

  function handleBookingInput(text) {
    const chips_creneaux = ['Lundi matin', 'Lundi après-midi', 'Mercredi matin', 'Mercredi après-midi', 'Vendredi matin', 'Vendredi après-midi', 'Je ne sais pas encore'];
    const chips_animaux  = ['🐶 Chien', '🐱 Chat', '🐰 Lapin', '🐹 Rongeur', '🦜 Autre'];
    const chips_motifs   = ['Consultation générale', 'Vaccination', 'Chirurgie / Stérilisation', 'Urgence', 'Suivi / Rappel'];

    if (normalize(text).match(/^(annuler|stop|quitter|non merci|abandonner)$/)) {
      resetBooking();
      showTyping();
      setTimeout(() => {
        hideTyping();
        appendMsg('bot', '❌ Demande annulée. Je reste disponible si vous avez d\'autres questions ! 🐾');
        setChips(['Horaires', 'Prendre RDV', 'Adresse', 'Services']);
      }, 500);
      return;
    }

    if (bookingStep === 1) {
      if (text.trim().length < 2) {
        botReply('Merci de saisir votre <strong>prénom et nom</strong> (au moins 2 caractères). 😊');
        return;
      }
      bookingData.name = text.trim();
      bookingStep = 2;
      botReply(`Merci <strong>${escapeHtml(bookingData.name.split(' ')[0])}</strong> 😊<br><br><strong>Quel est votre numéro de téléphone ?</strong>`);

    } else if (bookingStep === 2) {
      const clean = text.replace(/[\s\.\-]/g, '');
      if (!/^[0-9\+]{9,14}$/.test(clean)) {
        botReply('Ce numéro ne semble pas valide. Merci de saisir un <strong>numéro de téléphone</strong> correct (ex : 06 12 34 56 78).');
        return;
      }
      bookingData.phone = text.trim();
      bookingStep = 3;
      botReply('Quelle est votre <strong>adresse email</strong> ? (pour recevoir une confirmation)');

    } else if (bookingStep === 3) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim())) {
        botReply('Cet email ne semble pas valide. Merci de saisir une <strong>adresse email correcte</strong> (ex : prenom@gmail.com).');
        return;
      }
      bookingData.email = text.trim();
      bookingStep = 4;
      setChips(chips_creneaux);
      botReply('Quel <strong>créneau vous conviendrait</strong> ? (Le cabinet est ouvert Lun / Mer / Ven)');

    } else if (bookingStep === 4) {
      if (text.trim().length < 2) {
        botReply('Merci d\'indiquer un créneau souhaité ou de choisir "Je ne sais pas encore".');
        return;
      }
      bookingData.date = text.trim();
      bookingStep = 5;
      setChips(chips_animaux);
      botReply('Quel animal souhaitez-vous amener ? <strong>Précisez l\'espèce et le prénom</strong> de votre compagnon 🐾');

    } else if (bookingStep === 5) {
      if (text.trim().length < 2) {
        botReply('Merci de préciser l\'espèce et le prénom de votre animal (ex : "Mon chat Minou").');
        return;
      }
      bookingData.animal = text.trim();
      bookingStep = 6;
      setChips(chips_motifs);
      botReply('Quel est le <strong>motif de la consultation</strong> ?');

    } else if (bookingStep === 6) {
      if (text.trim().length < 2) {
        botReply('Merci d\'indiquer le motif de votre visite (ex : "Vaccination annuelle").');
        return;
      }
      bookingData.motive = text.trim();
      bookingStep = 7;
      showRecap();
    }
  }

  function showRecap() {
    const data = bookingData;
    setChips([]);
    sendWebhook(data);
    showTyping();
    setTimeout(() => {
      hideTyping();
      appendMsg('bot', `Récapitulatif de votre demande :<br><br>
        👤 <strong>${escapeHtml(data.name)}</strong><br>
        📞 ${escapeHtml(data.phone)}<br>
        ✉️ ${escapeHtml(data.email)}<br>
        🗓️ ${escapeHtml(data.date)}<br>
        🐾 ${escapeHtml(data.animal)}<br>
        📋 ${escapeHtml(data.motive)}`);
      scrollBottom();
    }, 700);

    setTimeout(() => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        appendMsg('bot', `✅ <strong>Demande envoyée automatiquement !</strong><br><br>
          Le Dr PAYRIERE vous contactera au <strong>${escapeHtml(data.phone)}</strong> pour confirmer votre rendez-vous.<br><br>
          📧 Un email de confirmation a été envoyé à <strong>${escapeHtml(data.email)}</strong>.`);

        const wrap = make('div', { class: 'cb-booking-actions' });
        const btnCall = make('a', { href: 'tel:0561492799', class: 'cb-action-btn cb-action-call' });
        btnCall.innerHTML = '📞 Appeler quand même';
        const btnRedo = make('button', { class: 'cb-action-btn cb-action-redo' });
        btnRedo.innerHTML = '🔄 Nouvelle demande';
        btnRedo.addEventListener('click', () => {
          resetBooking();
          appendMsg('bot', 'D\'accord ! Comment puis-je vous aider ?');
          setChips(['Prendre RDV', 'Horaires', 'Services', 'Urgences']);
        });
        wrap.appendChild(btnCall);
        wrap.appendChild(btnRedo);
        elMessages.appendChild(wrap);
        scrollBottom();
        resetBooking();
      }, 800);
    }, 1800);
  }

  function resetBooking() {
    booking     = false;
    bookingStep = 0;
    bookingData = {};
  }

  function botReply(html) {
    showTyping();
    setTimeout(() => {
      hideTyping();
      appendMsg('bot', html);
      scrollBottom();
    }, 600 + Math.random() * 300);
  }

  /* ── Dispatch principal ── */
  function handleInput(raw) {
    const text = raw.trim();
    if (!text) return;

    elInput.value = '';
    appendMsg('user', text);
    setChips([]);

    if (booking) {
      setTimeout(() => handleBookingInput(text), 100);
      return;
    }

    /* Raccourcis chips spéciaux */
    if (text === 'Tous les horaires') {
      const rule = RULES.find(r => r.id === 'horaires');
      botReplyRule(rule);
      return;
    }
    if (text === 'Vaccination chien') {
      botReplyText('💉 Vaccination chien :<br><br>• Primo à 6-8 semaines (CHPPIL)<br>• Rappel à 1 an<br>• Puis tous les 1 à 3 ans selon le vaccin<br><br>Consultez-nous pour un programme adapté !', ['Prendre RDV', 'Services']);
      return;
    }
    if (text === 'Vaccination chat') {
      botReplyText('💉 Vaccination chat :<br><br>• Primo à 8-9 semaines (typhus, calicivirus, rhinotrachéite)<br>• Rappel à 1 an<br>• Puis annuel<br><br>La vaccination leucose est recommandée selon le mode de vie.', ['Prendre RDV', 'Services']);
      return;
    }
    if (text === 'Boutique ChronoVet') {
      const rule = RULES.find(r => r.id === 'boutique');
      botReplyRule(rule);
      return;
    }
    if (text === 'Espèces acceptées') {
      const rule = RULES.find(r => r.id === 'especes');
      botReplyRule(rule);
      return;
    }

    const rule = findBestRule(text);
    botReplyRule(rule);
  }

  function botReplyRule(rule) {
    showTyping();
    const delay = 500 + Math.random() * 400;
    setTimeout(() => {
      hideTyping();
      const response = typeof rule.response === 'function' ? rule.response() : rule.response;
      appendMsg('bot', response);
      if (rule.chips) setChips(rule.chips);
      if (rule.action === 'booking') startBooking();
      scrollBottom();
    }, delay);
  }

  function botReplyText(html, chips) {
    showTyping();
    setTimeout(() => {
      hideTyping();
      appendMsg('bot', html);
      if (chips) setChips(chips);
      scrollBottom();
    }, 600 + Math.random() * 300);
  }

  /* ── Ouverture / Fermeture ── */
  function openPanel() {
    panelOpen = true;
    elPanel.classList.add('cb-open');
    elBubble.innerHTML = '✕';
    elBubble.setAttribute('aria-label', 'Fermer l\'assistant');
    setTimeout(() => elInput.focus(), 300);
  }

  function closePanel() {
    panelOpen = false;
    elPanel.classList.remove('cb-open');
    elBubble.innerHTML = '🐾';
    elBubble.setAttribute('aria-label', 'Ouvrir l\'assistant');
  }

  /* ── Événements ── */
  function bindEvents() {
    elBubble.addEventListener('click', () => panelOpen ? closePanel() : openPanel());

    elPanel.querySelector('.cb-close').addEventListener('click', closePanel);

    elSend.addEventListener('click', () => handleInput(elInput.value));

    elInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); handleInput(elInput.value); }
    });
  }

  /* ── Message de bienvenue ── */
  function welcome() {
    setTimeout(() => {
      appendMsg('bot', `Bonjour ! 👋 Je suis l'assistant du <strong>Cabinet Vétérinaire Dr PAYRIERE</strong>.<br><br>Comment puis-je vous aider ?`);
      setChips(['Horaires', 'Prendre RDV', 'Adresse', 'Services', 'Urgences']);
    }, 500);
  }

  /* ── Init ── */
  buildDOM();
  bindEvents();
  welcome();

})();
