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
    email:   'mpayriere.vet@gmail.com',
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

  /* ── Règles de réponse (threshold = nb minimum de keywords correspondants) ── */
  const RULES = [
    {
      id: 'bonjour',
      keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou', 'hey', 'bjr', 'bsr'],
      threshold: 1,
      response: 'Bonjour ! 😊 Je suis Puce, l\'assistante du Dr PAYRIERE. Comment puis-je vous aider ?',
      chips: ['Horaires', 'Prendre RDV', 'Services', 'Urgences'],
    },
    {
      id: 'aurevoir',
      keywords: ['aurevoir', 'bonne journee', 'bonne soiree', 'ciao', 'bye', 'bientot', 'tchao'],
      threshold: 1,
      response: 'Au revoir ! 🐾 N\'hésitez pas à revenir si vous avez d\'autres questions. Bonne journée !',
      chips: ['Prendre RDV', 'Horaires'],
    },
    {
      id: 'merci',
      keywords: ['merci', 'super', 'parfait', 'nickel', 'genial', 'top', 'impeccable', 'excellent'],
      threshold: 1,
      response: 'Avec plaisir ! 🐾 N\'hésitez pas si vous avez d\'autres questions.',
      chips: ['Prendre RDV', 'Horaires', 'Adresse'],
    },
    {
      id: 'horaires-lundi',
      keywords: ['lundi'],
      threshold: 1,
      response: '🗓️ Le cabinet est ouvert <strong>le lundi de 9h30 à 12h30 et de 15h à 19h</strong>.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-mardi',
      keywords: ['mardi'],
      threshold: 1,
      response: '🏠 Le mardi, le Dr PAYRIERE effectue des <strong>visites à domicile uniquement</strong>. Pas de consultations au cabinet.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-mercredi',
      keywords: ['mercredi'],
      threshold: 1,
      response: '🗓️ Le cabinet est ouvert <strong>le mercredi de 9h30 à 12h30 et de 15h à 19h</strong>.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-jeudi',
      keywords: ['jeudi'],
      threshold: 1,
      response: '🏠 Le jeudi, le Dr PAYRIERE effectue des <strong>visites à domicile uniquement</strong>. Pas de consultations au cabinet.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-vendredi',
      keywords: ['vendredi'],
      threshold: 1,
      response: '🗓️ Le cabinet est ouvert <strong>le vendredi de 9h30 à 12h30 et de 15h à 19h</strong>.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    {
      id: 'horaires-weekend',
      keywords: ['samedi', 'dimanche', 'weekend'],
      threshold: 1,
      response: '🔴 Le cabinet est <strong>fermé le samedi et le dimanche</strong>. Pour une urgence, contactez Vet-Urgences Ouest au <a href="tel:0561112131">05 61 11 21 31</a>.',
      chips: ['Urgences', 'Tous les horaires'],
    },
    {
      id: 'horaires',
      keywords: ['horaire', 'ouvert', 'ouverture', 'ferme', 'heure', 'quand', 'disponible', 'agenda', 'planning', 'fermeture', 'travaillez', 'recevez', 'jours'],
      threshold: 1,
      response: () => `Voici nos horaires :<br><br>
        🗓️ <strong>Lundi / Mercredi / Vendredi</strong><br>9h30–12h30 et 15h–19h<br><br>
        🏠 <strong>Mardi / Jeudi</strong><br>Visites à domicile uniquement<br><br>
        🔴 <strong>Samedi / Dimanche</strong><br>Fermé`,
      chips: ['Prendre RDV', 'Adresse', 'Urgences'],
    },
    {
      id: 'adresse',
      keywords: ['adresse', 'situe', 'trouver', 'localisation', 'gps', 'itineraire', 'saint-paul', 'coquelicots', '31530', 'acces', 'parking', 'chemin'],
      threshold: 1,
      response: '📍 Nous sommes au <strong>3 impasse des Coquelicots, Saint-Paul-sur-Save (31530)</strong>.<br><br>Grand parking gratuit sur place.',
      chips: ['Horaires', 'Téléphone', 'Prendre RDV'],
    },
    {
      id: 'telephone',
      keywords: ['telephone', 'appeler', 'numero', 'appel', 'joindre', 'coordonnee', 'contacter', 'appelle', 'contact'],
      threshold: 1,
      response: '📞 Vous pouvez nous appeler au <strong><a href="tel:0561492799">05 61 49 27 99</a></strong>.<br><br>Lun / Mer / Ven : 9h30–12h30 et 15h–19h.',
      chips: ['Horaires', 'Prendre RDV'],
    },
    {
      id: 'email',
      keywords: ['email', 'mail', 'courriel', 'ecrire'],
      threshold: 1,
      response: '✉️ Vous pouvez nous écrire à <strong><a href="mailto:mpayriere.vet@gmail.com">mpayriere.vet@gmail.com</a></strong>.',
      chips: ['Téléphone', 'Prendre RDV'],
    },
    {
      id: 'rdv',
      keywords: ['rendez-vous', 'rendez', 'rdv', 'reserver', 'reservation', 'planifier', 'fixer', 'booker', 'programmer', 'appointment'],
      threshold: 1,
      action: 'booking',
      response: 'Je vais vous aider à préparer votre demande de rendez-vous ! 📅',
      chips: [],
    },
    {
      id: 'urgence',
      keywords: ['urgence', 'urgent', 'nuit', 'garde', 'accident', 'blesse', 'grave', 'vite', 'secours', 'empoisonnement', 'avale'],
      threshold: 1,
      response: `🚨 En dehors de nos horaires, contactez :<br><br>
        <strong>Vet-Urgences Ouest</strong><br>
        📞 <a href="tel:0561112131"><strong>05 61 11 21 31</strong></a><br><br>
        Disponibles 24h/24, 7j/7.`,
      chips: ['Horaires du cabinet', 'Adresse'],
    },
    {
      id: 'services',
      keywords: ['service', 'soin', 'propose', 'offre', 'prestation', 'pratique', 'specialite', 'proposez', 'faites', 'traitements'],
      threshold: 1,
      response: `Voici nos services :<br><br>
        🩺 <strong>Consultations</strong> & bilans de santé<br>
        💉 <strong>Vaccinations</strong><br>
        🔬 <strong>Analyses</strong> & échographie<br>
        🏥 <strong>Chirurgie</strong> (stérilisation, extractions…)<br>
        🦷 <strong>Dentisterie</strong> & détartrage<br>
        🌿 <strong>Phytothérapie</strong>, acupuncture, ostéopathie<br>
        🏠 <strong>Visites à domicile</strong> (mar/jeu)`,
      chips: ['Prendre RDV', 'Espèces acceptées', 'Stérilisation'],
    },
    {
      id: 'especes',
      keywords: ['espece', 'animal', 'accepte', 'accueille', 'recoivent', 'prenez', 'soignez', 'traitez', 'accueillez', 'animaux'],
      threshold: 1,
      response: '🐾 Nous accueillons tous vos compagnons :<br><br>🐶 Chiens &nbsp;🐱 Chats &nbsp;🐰 Lapins<br>🐹 Rongeurs &nbsp;🦜 Oiseaux &nbsp;🐍 NAC<br><br>Aucun animal n\'est trop petit pour être bien soigné !',
      chips: ['Services', 'Prendre RDV'],
    },
    {
      id: 'chien',
      keywords: ['chien', 'chienne', 'toutou', 'canin', 'canine', 'chiot'],
      threshold: 1,
      response: '🐶 Nous prenons en charge les chiens pour toutes les consultations : vaccinations, chirurgie, dentisterie, bilans de santé et bien plus !',
      chips: ['Vaccination', 'Stérilisation', 'Prendre RDV'],
    },
    {
      id: 'chat-animal',
      keywords: ['chatte', 'felin', 'chaton', 'chatons'],
      threshold: 1,
      response: '🐱 Nous accueillons les chats pour toutes les consultations. Le Dr PAYRIERE a une approche douce, idéale pour les chats craintifs !',
      chips: ['Vaccination', 'Stérilisation', 'Prendre RDV'],
    },
    {
      id: 'lapin',
      keywords: ['lapin', 'lapine', 'lapereau', 'lapins'],
      threshold: 1,
      response: '🐰 Le Dr PAYRIERE est expérimentée avec les lapins : suivi régulier, vaccination myxomatose/VHD, stérilisation et soins dentaires.',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'rongeur',
      keywords: ['rongeur', 'hamster', 'cobaye', 'gerbille', 'souris', 'furet', 'rongeurs'],
      threshold: 1,
      response: '🐹 Nous prenons en charge les rongeurs et petits mammifères (hamsters, cobayes, gerbilles, rats…) ainsi que les furets.',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'nac',
      keywords: ['nac', 'oiseau', 'reptile', 'perroquet', 'tortue', 'serpent', 'chinchilla', 'exotique', 'oiseaux'],
      threshold: 1,
      response: '🦜 Le Dr PAYRIERE soigne également les NAC : oiseaux, reptiles, chinchillas et autres animaux exotiques. Appelez-nous pour confirmer selon l\'espèce.',
      chips: ['Prendre RDV', 'Téléphone'],
    },
    {
      id: 'sterilisation',
      keywords: ['sterilisation', 'steriliser', 'castration', 'castrer', 'suprelorin', 'implant', 'sterilise', 'castres'],
      threshold: 1,
      response: `🐱 <strong>Chat</strong> : stérilisation chirurgicale recommandée.<br><br>
        🐶 <strong>Chien</strong> : le Dr PAYRIERE préfère l'<strong>implant Suprelorin®</strong> — réversible, sans anesthésie générale, préserve l'équilibre hormonal.`,
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'vaccin',
      keywords: ['vaccin', 'vaccination', 'vacciner', 'rappel', 'primo', 'immunite', 'vaccins'],
      threshold: 1,
      response: `💉 Vaccinations disponibles pour toutes les espèces :<br><br>
        🐶 <strong>Chien</strong> : primo à 6-8 semaines, rappel annuel<br>
        🐱 <strong>Chat</strong> : primo à 8-9 semaines, rappel annuel<br>
        🐰 <strong>Lapin</strong> : myxomatose + VHD, rappel annuel`,
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'chirurgie',
      keywords: ['chirurgie', 'operation', 'operer', 'bloc', 'anesthesie', 'intervenir', 'operable'],
      threshold: 1,
      response: '🏥 Nous disposons d\'un <strong>bloc opératoire moderne</strong> pour les interventions : stérilisation, extractions dentaires, chirurgies de routine.',
      chips: ['Prendre RDV', 'Stérilisation'],
    },
    {
      id: 'dentaire',
      keywords: ['dent', 'dents', 'dentaire', 'dentisterie', 'detartrage', 'machoire', 'gencive', 'bouche'],
      threshold: 1,
      response: '🦷 Soins dentaires proposés :<br><br>• Détartrage sous anesthésie<br>• Extractions dentaires<br>• Conseils d\'hygiène bucco-dentaire<br><br>Des dents saines = un animal en bonne santé !',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'analyse',
      keywords: ['analyse', 'sang', 'bilan', 'echographie', 'examen', 'diagnostic', 'labo', 'test', 'resultat', 'radio'],
      threshold: 1,
      response: '🔬 Nous réalisons au cabinet :<br><br>• Prises de sang & analyses biologiques<br>• Échographie<br>• Bilans de santé complets<br><br>Résultats rapides pour un diagnostic précis !',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'phyto',
      keywords: ['naturel', 'plante', 'phytotherapie', 'huile', 'homeopathie', 'douce', 'essentielle', 'bio', 'naturelle'],
      threshold: 1,
      response: '🌿 Le Dr PAYRIERE privilégie les solutions naturelles :<br><br>• Phytothérapie (plantes médicinales)<br>• Huiles essentielles vétérinaires<br>• Oligoéléments & compléments naturels<br>• Acupuncture & fleurs de Bach',
      chips: ['Services', 'Prendre RDV'],
    },
    {
      id: 'osteo',
      keywords: ['osteopathie', 'osteo', 'acupuncture', 'bach', 'fleur', 'manipulation'],
      threshold: 1,
      response: '🌸 Le Dr PAYRIERE pratique :<br><br>• <strong>Ostéopathie</strong> animale<br>• <strong>Acupuncture</strong><br>• <strong>Fleurs de Bach</strong><br><br>Idéal pour les animaux anxieux ou douloureux.',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'domicile',
      keywords: ['domicile', 'maison', 'deplacement', 'deplacer', 'chez moi', 'chez nous', 'visite'],
      threshold: 1,
      response: '🏠 Le Dr PAYRIERE effectue des <strong>visites à domicile le mardi et le jeudi</strong>. Appelez-nous pour organiser cela !<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV', 'Horaires'],
    },
    {
      id: 'identification',
      keywords: ['identification', 'identifier', 'chip', 'transpondeur', 'tatouage', 'electronique'],
      threshold: 1,
      response: '🔖 L\'identification est <strong>obligatoire en France</strong> pour les chiens (4 mois) et les chats (7 mois). Nous réalisons la pose de puce électronique au cabinet.',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'parasites',
      keywords: ['vermifuge', 'ver', 'parasite', 'antipuce', 'tique', 'antiparasitaire', 'puces', 'poux', 'vermifuger'],
      threshold: 1,
      response: '🛡️ Nous prescrivons les traitements antiparasitaires adaptés : vermifuges, antiparasitaires externes, colliers. Demandez-nous lors de votre prochaine visite !',
      chips: ['Prendre RDV', 'Boutique ChronoVet'],
    },
    {
      id: 'boutique',
      keywords: ['boutique', 'chronovet', 'commande', 'produit', 'medicament', 'acheter', 'relais', 'livraison', 'achat'],
      threshold: 1,
      response: '🛒 Le cabinet est <strong>point relais ChronoVet officiel</strong> !<br><br>Commandez sur <a href="https://www.chronovet.fr" target="_blank">chronovet.fr</a> et récupérez au cabinet — <strong>sans frais de livraison</strong>.',
      chips: ['Horaires', 'Adresse'],
    },
    {
      id: 'tarif',
      keywords: ['tarif', 'prix', 'cout', 'combien', 'cher', 'euro', 'payer', 'remboursement', 'assurance', 'mutuelle', 'facturation'],
      threshold: 1,
      response: 'Les tarifs varient selon la consultation et l\'animal. Pour un devis, appelez-nous :<br><br>📞 <strong><a href="tel:0561492799">05 61 49 27 99</a></strong>',
      chips: ['Prendre RDV', 'Horaires'],
    },
    {
      id: 'alimentation',
      keywords: ['alimentation', 'nourriture', 'croquette', 'regime', 'manger', 'poids', 'obese', 'diet', 'nutrition', 'nourrir'],
      threshold: 1,
      response: '🥗 Le Dr PAYRIERE vous conseille sur l\'alimentation adaptée lors d\'une consultation. Une bonne nutrition est la base de la santé de votre animal !',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: 'docteur',
      keywords: ['docteur', 'veterinaire', 'veto', 'payriere', 'equipe', 'experience', 'diplome', 'formation', 'qui'],
      threshold: 1,
      response: '👩‍⚕️ Le <strong>Dr PAYRIERE</strong> est vétérinaire depuis plus de <strong>30 ans</strong>.<br><br>Elle maîtrise la médecine conventionnelle ainsi que l\'ostéopathie, l\'acupuncture et la phytothérapie pour une approche douce et globale.',
      chips: ['Services', 'Prendre RDV', 'Avis clients'],
    },
    {
      id: 'malade',
      keywords: ['malade', 'maladie', 'symptome', 'inquiet', 'vomit', 'diarrhee', 'mange plus', 'boit plus', 'douleur', 'blessure', 'boite', 'abattu'],
      threshold: 1,
      response: '🩺 Si votre animal présente des symptômes inquiétants, consultez-nous rapidement :<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br><br>En dehors des horaires → <strong>Vet-Urgences Ouest</strong> : <a href="tel:0561112131">05 61 11 21 31</a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    {
      id: 'passeport',
      keywords: ['passeport', 'voyage', 'etranger', 'certificat', 'international', 'europe', 'transport'],
      threshold: 1,
      response: '✈️ Nous délivrons les <strong>passeports européens</strong> et certificats de santé pour voyager avec votre animal. Contactez-nous en avance !<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV', 'Téléphone'],
    },
    {
      id: 'avis',
      keywords: ['avis', 'temoignage', 'recommande', 'opinion', 'note', 'etoile', 'google', 'confiance'],
      threshold: 1,
      response: '⭐⭐⭐⭐⭐ Nos clients nous font confiance !<br><br><em>« Très pro, attentionnée et réactive »</em> — Léa L.<br><em>« Vous pouvez y aller les yeux fermés »</em> — Christopher B.<br><em>« Une veto en or et passionnée »</em> — Florence D.',
      chips: ['Prendre RDV', 'Services'],
    },
    {
      id: '_fallback',
      keywords: [],
      threshold: -1,
      response: 'Je ne suis pas sûre de comprendre votre question. 🐾<br><br>Vous pouvez m\'interroger sur nos <strong>horaires</strong>, <strong>services</strong>, <strong>tarifs</strong>… ou appelez-nous au <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>.',
      chips: ['Horaires', 'Adresse', 'Prendre RDV', 'Urgences'],
    },
  ];

  /* ── Envoi RDV via Google Apps Script (email + Calendar) + ntfy.sh (push) ── */
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxbpM-4eLwtqComh3X8n22vxuuVMzNzdQ1sY2QTPsPcOgL2a2I_PhU5Bl29ttp9anM6/exec';
  const NTFY_TOPIC  = 'rdv-cabinet-payriere-31530';

  function sendWebhook(data) {
    const params = new URLSearchParams({
      name:   data.name   || '',
      phone:  data.phone  || '',
      email:  data.email  || '',
      date:   data.date   || '',
      animal: data.animal || '',
      motive: data.motive || '',
    });
    fetch(WEBHOOK_URL + '?' + params.toString(), { mode: 'no-cors' }).catch(() => {});

    const message = [
      'Proprietaire : ' + (data.name   || '?'),
      'Telephone    : ' + (data.phone  || '?'),
      'Email        : ' + (data.email  || '?'),
      'Creneau      : ' + (data.date   || '?'),
      'Animal       : ' + (data.animal || '?'),
      'Motif        : ' + (data.motive || '?'),
    ].join('\n');
    fetch('https://ntfy.sh/' + NTFY_TOPIC, {
      method: 'POST',
      headers: { 'Title': 'Nouveau RDV - ' + (data.animal || '') + ' - ' + (data.name || ''), 'Priority': 'high' },
      body: message,
    }).catch(() => {});
  }

  /* ── État interne ── */
  let panelOpen   = false;
  let booking     = false;
  let bookingStep = 0;
  let bookingData = {};

  /* ── Références DOM (remplies dans buildDOM) ── */
  let elRoot, elBubble, elGreet, elPanel, elMessages, elQuick, elInput, elSend, elTyping;

  /* ── Construction du DOM ── */
  function buildDOM() {
    elRoot = make('div', { id: 'cb-root' });

    /* Bulle de salutation */
    elGreet = make('div', { id: 'cb-greet' });
    elGreet.innerHTML = '<span class="cb-greet-paw">🐾</span>Bonjour ! Je suis <strong>Puce</strong>,<br>comment puis-je vous aider ?<span id="cb-greet-close">✕</span>';

    /* Chat animé cliquable (remplace l ancien bouton rond) */
    elBubble = make('button', { id: 'cb-bubble', 'aria-label': 'Ouvrir l\'assistant Puce', title: 'Puce — Assistante du cabinet' });
    elBubble.innerHTML = '<img src="puce avatar2.png" alt="Puce" id="cb-cat-img">';

    elPanel = make('div', { id: 'cb-panel', role: 'dialog', 'aria-label': 'Assistant du cabinet vétérinaire' });
    elPanel.innerHTML = `
      <div class="cb-header">
        <div class="cb-header-info">
          <div class="cb-header-avatar"><img src="puce avatar2.png" alt="Puce" style="width:100%;height:100%;object-fit:contain;"></div>
          <div>
            <div class="cb-header-name">Puce 🐱 — Cabinet Dr PAYRIERE</div>
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

    elRoot.appendChild(elGreet);
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
    return rule.keywords.filter(kw =>
      tokens.some(tok => tok === kw || tok.includes(kw) || kw.includes(tok))
    ).length;
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

  function buildMailto(data) {
    const subject = encodeURIComponent('🐾 Demande de RDV — ' + (data.animal || '') + ' — ' + (data.name || ''));
    const body = encodeURIComponent(
      'Bonjour Dr PAYRIERE,\n\n' +
      'Nouvelle demande de rendez-vous reçue via le site internet :\n\n' +
      'Propriétaire : ' + (data.name   || '') + '\n' +
      'Téléphone    : ' + (data.phone  || '') + '\n' +
      'Email        : ' + (data.email  || '') + '\n' +
      'Créneau      : ' + (data.date   || '') + '\n' +
      'Animal       : ' + (data.animal || '') + '\n' +
      'Motif        : ' + (data.motive || '') + '\n\n' +
      'Merci de confirmer le rendez-vous.\n\nCordialement,\n' + (data.name || '')
    );
    return 'mailto:mpayriere.vet@gmail.com?subject=' + subject + '&body=' + body;
  }

  function showRecap() {
    const data = bookingData;
    setChips([]);
    sendWebhook(data);
    showTyping();
    setTimeout(() => {
      hideTyping();
      appendMsg('bot', 'Récapitulatif de votre demande :<br><br>' +
        '👤 <strong>' + escapeHtml(data.name)   + '</strong><br>' +
        '📞 ' + escapeHtml(data.phone)  + '<br>' +
        '✉️ ' + escapeHtml(data.email)  + '<br>' +
        '🗓️ ' + escapeHtml(data.date)   + '<br>' +
        '🐾 ' + escapeHtml(data.animal) + '<br>' +
        '📋 ' + escapeHtml(data.motive));
      scrollBottom();
    }, 700);

    setTimeout(() => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        const mailto = buildMailto(data);

        appendMsg('bot', '✅ <strong>Demande envoyée automatiquement !</strong><br><br>' +
          'Le Dr PAYRIERE a reçu une notification et vous contactera au <strong>' + escapeHtml(data.phone) + '</strong> pour confirmer votre créneau.<br><br>' +
          '📧 Vous pouvez aussi envoyer un email directement :');

        const wrap = make('div', { class: 'cb-booking-actions' });

        const btnMail = make('a', { href: mailto, class: 'cb-action-btn cb-action-mail' });
        btnMail.innerHTML = '📧 Envoyer ma demande par email';

        const btnCall = make('a', { href: 'tel:0561492799', class: 'cb-action-btn cb-action-call' });
        btnCall.innerHTML = '📞 Appeler le cabinet';

        const btnRedo = make('button', { class: 'cb-action-btn cb-action-redo' });
        btnRedo.innerHTML = '🔄 Nouvelle demande';
        btnRedo.addEventListener('click', () => {
          resetBooking();
          appendMsg('bot', 'D\'accord ! Comment puis-je vous aider ?');
          setChips(['Prendre RDV', 'Horaires', 'Services', 'Urgences']);
        });

        wrap.appendChild(btnMail);
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
    elGreet.classList.remove('cb-greet-show');
    elBubble.classList.add('cb-bubble-open');
    setTimeout(() => elInput.focus(), 300);
  }

  function closePanel() {
    panelOpen = false;
    elPanel.classList.remove('cb-open');
    elBubble.classList.remove('cb-bubble-open');
  }

  /* ── Événements ── */
  function bindEvents() {
    elBubble.addEventListener('click', () => panelOpen ? closePanel() : openPanel());
    elGreet.addEventListener('click', (e) => {
      if (e.target.id === 'cb-greet-close') {
        elGreet.classList.remove('cb-greet-show');
      } else {
        openPanel();
      }
    });

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
  /* Auto-salutation après 2s */
  setTimeout(() => { elGreet.classList.add('cb-greet-show'); }, 2000);

  /* ── API publique — accessible depuis index.html ── */
  window.openChatbotRDV = function () {
    if (!panelOpen) openPanel();
    setTimeout(() => {
      if (!booking) {
        appendMsg('user', 'Prendre RDV');
        startBooking();
      }
    }, 350);
  };

})();
