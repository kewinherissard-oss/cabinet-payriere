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
    emergency: { name: 'Vet-Urgentys', phone: '05 61 11 21 31', url: 'https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460' },
  };

  /* ── Règles NLP — priority: score pondéré (hits × priority). Plus c'est élevé, plus ça prime. ── */
  const RULES = [

    /* ════ SALUTATIONS (piste séparée, priority 1) ════ */
    {
      id: 'bonjour', priority: 1,
      keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou', 'hey', 'bjr', 'bsr'],
      threshold: 1,
      response: 'Bonjour ! 😊 Je suis Puce, l\'assistante du Dr PAYRIERE. Comment puis-je vous aider ?',
      chips: ['Horaires', 'Prendre RDV', 'Services', 'Urgences'],
    },
    { id: 'aurevoir', priority: 1,
      keywords: ['aurevoir', 'bonne journee', 'bonne soiree', 'ciao', 'bye', 'bientot', 'tchao'],
      threshold: 1,
      response: 'Au revoir ! 🐾 N\'hésitez pas à revenir si vous avez d\'autres questions. Bonne journée !',
      chips: ['Prendre RDV', 'Horaires'],
    },
    { id: 'merci', priority: 1,
      keywords: ['merci', 'super', 'parfait', 'nickel', 'genial', 'top', 'impeccable', 'excellent'],
      threshold: 1,
      response: 'Avec plaisir ! 🐾 N\'hésitez pas si vous avez d\'autres questions.',
      chips: ['Prendre RDV', 'Horaires', 'Adresse'],
    },

    /* ════ DANGER IMMÉDIAT (priority 100) ════ */
    { id: 'medicament-humain-danger', priority: 100,
      keywords: ['ibuprofene', 'ibuprofen', 'paracetamol', 'aspirine', 'doliprane', 'nurofen', 'antidouleur humain'],
      threshold: 1,
      response: '⚠️ <strong>DANGER</strong> — N\'administrez <strong>jamais</strong> de médicaments humains à votre animal !<br><br>🔴 L\'<strong>ibuprofène</strong> et le <strong>paracétamol</strong> sont <strong>mortels</strong> pour les chiens et les chats, même à faible dose.<br><br>En cas d\'ingestion accidentelle, appelez immédiatement :<br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a> ou <a href="tel:0561112131"><strong>Vet-Urgentys : 05 61 11 21 31</strong></a>',
      chips: ['Urgences'],
    },
    { id: 'urgence-avale', priority: 100,
      keywords: ['avale objet', 'ingere', 'corps etranger', 'intoxication', 'empoisonne', 'poison', 'toxique', 'mange quelque chose'],
      threshold: 1,
      response: '🚨 <strong>URGENT</strong> — Animal ayant avalé un objet ou une substance toxique : <strong>appelez sans attendre</strong> :<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br><br>En dehors des heures → <a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank"><strong>Vet-Urgentys</strong></a> : <a href="tel:0561112131"><strong>05 61 11 21 31</strong></a>',
      chips: ['Urgences'],
    },

    /* ════ URGENCES (priority 90) ════ */
    { id: 'urgence', priority: 90,
      keywords: ['urgence', 'urgent', 'garde', 'accident', 'blesse', 'grave', 'secours', 'empoisonnement'],
      threshold: 1,
      response: '🚨 En dehors de nos horaires, contactez :<br><br><a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank" rel="noopener"><strong>Vet-Urgentys</strong></a><br>📞 <a href="tel:0561112131"><strong>05 61 11 21 31</strong></a><br><br>Disponibles 24h/24, 7j/7.',
      chips: ['Horaires du cabinet', 'Adresse'],
    },
    { id: 'urgence-soir', priority: 90,
      keywords: ['ce soir', 'tout de suite', 'immediatement', 'maintenant urgent', 'ce moment urgent'],
      threshold: 1,
      response: '🚨 Si c\'est une urgence <strong>en dehors de nos horaires</strong> :<br><br><a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank"><strong>Vet-Urgentys</strong></a><br>📞 <a href="tel:0561112131"><strong>05 61 11 21 31</strong></a> — 24h/24, 7j/7',
      chips: ['Horaires du cabinet'],
    },

    /* ════ SYMPTÔMES SPÉCIFIQUES (priority 80) ════ */
    { id: 'urinaire', priority: 80,
      keywords: ['urine', 'uriner', 'urinaire', 'pipi', 'miction', 'fait ses besoins', 'incontinence'],
      threshold: 1,
      response: '🩺 <strong>Problème urinaire chez votre animal</strong> — plusieurs causes possibles :<br><br>• <strong>Infection urinaire</strong> (cystite) : fréquent, surtout chez le chat mâle<br>• <strong>Calculs rénaux</strong> ou vésicaux<br>• <strong>Diabète</strong> (uriner beaucoup + boire beaucoup)<br>• <strong>Insuffisance rénale</strong> (animal âgé)<br>• <strong>Marquage</strong> territorial (comportemental)<br><br>Une consultation + analyse d\'urine permettra de poser le bon diagnostic.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'vomissement', priority: 80,
      keywords: ['vomit', 'vomissements', 'vomis', 'rend', 'revoie', 'nausee', 'vomissant'],
      threshold: 1,
      response: '🩺 Un animal qui vomit occasionnellement peut avoir mangé trop vite ou quelque chose d\'irritant. Si les vomissements sont <strong>fréquents, avec du sang ou durent plus de 24h</strong>, consultez rapidement.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'diarrhee', priority: 80,
      keywords: ['diarrhee', 'selle molle', 'selles liquides', 'gastro', 'ventre', 'intestin'],
      threshold: 1,
      response: '🩺 La diarrhée chez un animal peut être due à un changement alimentaire, une infection ou une parasitose. Si elle dure <strong>plus de 48h</strong> ou contient du sang, consultez.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'mange-plus', priority: 80,
      keywords: ['mange plus', 'ne mange', 'anorexie', 'refuse manger', 'plus manger', 'perd appetit', 'appetit coupe'],
      threshold: 1,
      response: '🩺 Un animal qui ne mange plus depuis <strong>plus de 24h</strong> (chat) ou <strong>48h</strong> (chien) nécessite une consultation.<br><br>Causes possibles : douleur, infection, obstruction, stress ou maladie systémique.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br>En dehors des horaires → <a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank"><strong>Vet-Urgentys</strong></a> : <a href="tel:0561112131">05 61 11 21 31</a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'boite', priority: 80,
      keywords: ['boite', 'boiter', 'boiterie', 'marche mal', 'patte bless', 'se deplace mal', 'ne marche plus'],
      threshold: 1,
      response: '🐾 Un animal qui boite peut avoir une blessure, entorse, fracture ou douleur articulaire. Si la boiterie est <strong>soudaine et ne passe pas en 24h</strong>, consultez.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'agressivite', priority: 80,
      keywords: ['agressif', 'agressive', 'mord', 'grogne', 'attaque', 'mordre', 'agressivite', 'devient mechant'],
      threshold: 1,
      response: '🐶 Un changement de comportement soudain peut signaler une <strong>douleur cachée</strong>. L\'agressivité peut être :<br><br>• <strong>Médicale</strong> : douleur dentaire, arthrite, infection<br>• <strong>Comportementale</strong> : stress, peur, manque de socialisation<br><br>Consultation recommandée pour écarter une cause physique.<br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV'],
    },
    { id: 'poils', priority: 80,
      keywords: ['perd ses poils', 'chute de poils', 'alopecie', 'pelage abime', 'poils tombent', 'perd son poil', 'se lèche excessivement'],
      threshold: 1,
      response: '🐾 Une chute de poils anormale peut indiquer :<br><br>• <strong>Allergie</strong> (alimentaire ou environnementale)<br>• <strong>Parasitose</strong> : gale, teigne, puces<br>• <strong>Déséquilibre hormonal</strong> : hypothyroïdie, Cushing<br>• <strong>Stress</strong> ou surgrooming (chats)<br><br>Un bilan clinique + analyses permettront de cibler la cause.<br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV'],
    },
    { id: 'malade-general', priority: 80,
      keywords: ['malade', 'maladie', 'symptome', 'inquiet', 'quelque chose va pas', 'pas dans son assiette', 'abattu', 'fatigue', 'apathique'],
      threshold: 1,
      response: '🩺 Si votre animal ne semble pas dans son état normal, consultez-nous. Les animaux cachent souvent leur douleur — mieux vaut agir tôt.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br>Urgences → <a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank"><strong>Vet-Urgentys</strong></a> : <a href="tel:0561112131">05 61 11 21 31</a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'chaleur', priority: 80,
      keywords: ['chaleur', 'chaleurs', 'en chaleur', 'cycle', 'saignement', 'rut'],
      threshold: 1,
      response: '🐱 Une femelle en chaleur peut être stérilisée, mais il est préférable d\'<strong>attendre entre deux cycles</strong> pour réduire les risques. Le Dr PAYRIERE vous conseillera au cas par cas.<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Stérilisation', 'Prendre RDV'],
    },

    /* ════ PROCÉDURES MÉDICALES (priority 70) ════ */
    { id: 'sterilisation', priority: 70,
      keywords: ['sterilisation', 'steriliser', 'castration', 'castrer', 'suprelorin', 'sterilise'],
      threshold: 1,
      response: '✂️ <strong>Stérilisation au cabinet :</strong><br><br>🐱 <strong>Chat/Chatte</strong> : intervention chirurgicale recommandée dès 5–6 mois. Prévient tumeurs mammaires, infections utérines et comportements indésirables.<br><br>🐶 <strong>Chien mâle</strong> : le Dr PAYRIERE privilégie l\'<strong>implant Suprelorin®</strong> — réversible, sans anesthésie générale, préserve l\'équilibre hormonal.<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV', 'Âge stérilisation'],
    },
    { id: 'sterilisation-age', priority: 70,
      keywords: ['quel age steriliser', 'quand steriliser', 'age sterilisation', 'trop tot steriliser', 'steriliser a quel age'],
      threshold: 1,
      response: '✂️ Âges recommandés :<br><br>🐱 <strong>Chat/Chatte</strong> : dès 5–6 mois, avant les premières chaleurs<br>🐶 <strong>Chienne</strong> : après les 1ères chaleurs (6–12 mois selon la race)<br>🐶 <strong>Chien mâle</strong> : à partir de 6 mois (implant Suprelorin®)',
      chips: ['Stérilisation', 'Prendre RDV'],
    },
    { id: 'sterilisation-conval', priority: 70,
      keywords: ['convalescence', 'recuperation', 'cicatrisation', 'repos apres', 'apres operation', 'suites operatoires', 'duree recuperation'],
      threshold: 1,
      response: '🏥 Après la stérilisation :<br><br>• Retour à domicile le <strong>jour même</strong> en général<br>• Repos strict <strong>7 à 10 jours</strong><br>• Port de la collerette (éviter léchage)<br>• Visite de contrôle + retrait des fils à J10',
      chips: ['Prendre RDV', 'Stérilisation'],
    },
    { id: 'sterilisation-risques', priority: 70,
      keywords: ['risque operation', 'danger sterilisation', 'risque anesthesie', 'peur operation', 'securite chirurgie'],
      threshold: 1,
      response: '✅ La stérilisation est une opération <strong>très courante et sûre</strong>. Les risques anesthésiques sont minimisés par un bilan préopératoire. Nous évaluons chaque animal avant toute intervention.',
      chips: ['Stérilisation', 'Prendre RDV'],
    },
    { id: 'vaccin', priority: 70,
      keywords: ['vaccin', 'vaccination', 'vacciner', 'rappel vaccin', 'primo vaccination', 'vaccins'],
      threshold: 1,
      response: '💉 <strong>Calendrier vaccinal :</strong><br><br>🐶 <strong>Chien</strong> : primo à 6–8 semaines, rappel à 1 an, puis tous les 1–3 ans<br>🐱 <strong>Chat</strong> : primo à 8–9 semaines, rappel annuel<br>🐰 <strong>Lapin</strong> : myxomatose + VHD, rappel annuel<br><br>Nous personnalisons le programme selon le mode de vie de votre animal.',
      chips: ['Prendre RDV', 'Vaccins obligatoires'],
    },
    { id: 'vaccin-oblig', priority: 70,
      keywords: ['vaccin obligatoire', 'obligatoire vaccin', 'rage obligatoire', 'vaccination obligatoire', 'loi vaccin'],
      threshold: 1,
      response: '💉 En France, seul le vaccin <strong>antirabique (rage)</strong> est légalement obligatoire pour les voyages et certaines collectivités. Les autres vaccins sont fortement recommandés selon le mode de vie.',
      chips: ['Vaccination', 'Prendre RDV'],
    },
    { id: 'chirurgie', priority: 70,
      keywords: ['chirurgie', 'operation chirurgicale', 'operer', 'bloc operatoire', 'intervenir chirurgicalement', 'acte chirurgical'],
      threshold: 1,
      response: '🏥 Notre cabinet dispose d\'un <strong>bloc opératoire moderne</strong>. Nous réalisons : stérilisations, extractions dentaires, chirurgies des tissus mous et autres interventions courantes.',
      chips: ['Prendre RDV', 'Stérilisation'],
    },
    { id: 'chirurgie-jeun', priority: 70,
      keywords: ['jeun', 'manger avant operation', 'nourrir avant anesthesie', 'eau avant operation', 'a jeun'],
      threshold: 1,
      response: '🏥 Avant toute anesthésie générale :<br><br>• <strong>Nourriture</strong> : arrêt 8–12h avant l\'intervention<br>• <strong>Eau</strong> : arrêt 2–4h avant<br><br>Nous vous confirmons les consignes exactes lors de la prise de RDV.',
      chips: ['Prendre RDV'],
    },
    { id: 'chirurgie-hospitalisation', priority: 70,
      keywords: ['hospitalisation', 'garder au cabinet', 'rester clinique', 'rentrer maison quand', 'nuit cabinet'],
      threshold: 1,
      response: '🏥 Pour la plupart des interventions, votre animal rentre à la <strong>maison le jour même</strong>. Pour les chirurgies complexes, une nuit en observation peut être nécessaire.',
      chips: ['Prendre RDV'],
    },
    { id: 'dentaire', priority: 70,
      keywords: ['dent', 'dentaire', 'detartrage', 'machoire', 'gencive', 'dents jaunes', 'mauvaise haleine', 'extraction dentaire'],
      threshold: 1,
      response: '🦷 <strong>Soins dentaires :</strong><br><br>• Détartrage sous anesthésie légère<br>• Extractions dentaires<br>• Polissage et conseils hygiène<br><br>Les maladies dentaires touchent <strong>80% des chiens et chats de plus de 3 ans</strong>. Un contrôle annuel est recommandé !<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV'],
    },
    { id: 'analyse', priority: 70,
      keywords: ['prise de sang', 'analyse sanguine', 'echographie', 'bilan sanguin', 'bilan de sante', 'examen de sang', 'radio'],
      threshold: 1,
      response: '🔬 <strong>Analyses & imagerie au cabinet :</strong><br><br>• Prises de sang & analyses biologiques<br>• Échographie<br>• Bilans de santé complets<br><br>Des résultats rapides pour un diagnostic précis sans vous déplacer loin !',
      chips: ['Prendre RDV'],
    },

    /* ════ MÉDICAMENTS & PRÉVENTION (priority 60) ════ */
    { id: 'medicament-ordonnance', priority: 60,
      keywords: ['renouveler ordonnance', 'renouvellement ordonnance', 'prescription', 'renouveler traitement', 'ordonnance expiree'],
      threshold: 1,
      response: '📋 Pour renouveler une ordonnance, appelez-nous :<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br><br>Selon le traitement, une consultation de contrôle peut être nécessaire avant le renouvellement.',
      chips: ['Prendre RDV', 'Téléphone'],
    },
    { id: 'medicament-achat', priority: 60,
      keywords: ['acheter medicament', 'ou acheter', 'pharmacie veterinaire', 'commander medicament', 'retirer traitement'],
      threshold: 1,
      response: '💊 Les médicaments prescrits sont disponibles :<br><br>• Directement au <strong>cabinet</strong><br>• Via <strong>ChronoVet</strong> (commande en ligne, retrait au cabinet sans frais)<br><br>Une ordonnance vétérinaire est souvent nécessaire.',
      chips: ['Boutique ChronoVet', 'Prendre RDV'],
    },
    { id: 'antiparasitaire-puces', priority: 60,
      keywords: ['puces animal', 'mon animal a des puces', 'traitement anti-puces', 'demangeaison puce', 'se gratte beaucoup'],
      threshold: 1,
      response: '🦟 <strong>Mon animal a des puces — que faire ?</strong><br><br>1️⃣ Traitez <strong>l\'animal</strong> avec un antiparasitaire adapté (spot-on, comprimé...)<br>2️⃣ Traitez <strong>tout l\'environnement</strong> : litière, canapé, tapis, voiture (les puces vivent 95% du temps dans l\'environnement !)<br>3️⃣ Répétez le traitement selon la durée d\'efficacité du produit<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a> pour le bon produit selon votre animal',
      chips: ['Prendre RDV', 'Boutique ChronoVet'],
    },
    { id: 'antiparasitaire-tique', priority: 60,
      keywords: ['tique', 'enlever tique', 'retirer tique', 'comment tique', 'mon animal a une tique'],
      threshold: 1,
      response: '🕷️ <strong>Comment gérer une tique :</strong><br><br>• Utilisez un <strong>tire-tique</strong> (rotation douce, ne jamais arracher brutalement)<br>• Ne jamais brûler ni écraser la tique in situ<br>• Désinfectez la plaie<br>• Surveillez 2–3 semaines (rougeur, fièvre, abattement = consultez)<br><br>Si votre animal <strong>a avalé</strong> une tique, appelez-nous.',
      chips: ['Prendre RDV', 'Boutique ChronoVet'],
    },
    { id: 'antiparasitaire-freq', priority: 60,
      keywords: ['frequence antiparasitaire', 'tous les combien vermifuge', 'quand donner antiparasitaire', 'programme antiparasitaire'],
      threshold: 1,
      response: '🛡️ <strong>Fréquences recommandées :</strong><br><br>• <strong>Vermifuge</strong> : tous les 3 mois (adulte), tous les mois (chiot/chaton)<br>• <strong>Anti-puces</strong> : tous les 1–3 mois selon le produit<br>• <strong>Anti-tiques</strong> : toute l\'année en zone à risque<br><br>Nous établissons un programme personnalisé selon votre animal !',
      chips: ['Prendre RDV', 'Boutique ChronoVet'],
    },
    { id: 'identification', priority: 60,
      keywords: ['identification', 'puce electronique', 'faire identifier', 'transpondeur', 'tatouage animal'],
      threshold: 1,
      response: '🔖 L\'identification est <strong>obligatoire</strong> :<br><br>🐶 <strong>Chien</strong> : dès 4 mois<br>🐱 <strong>Chat</strong> : dès 7 mois (avant tout voyage)<br><br>Nous posons la puce électronique au cabinet lors d\'une consultation. L\'animal est enregistré sur le fichier national I-CAD.',
      chips: ['Prendre RDV'],
    },
    { id: 'phyto', priority: 60,
      keywords: ['phytotherapie', 'plantes medicinales', 'huiles essentielles', 'homeopathie', 'medecine douce', 'naturel veterinaire'],
      threshold: 1,
      response: '🌿 Le Dr PAYRIERE privilégie les <strong>solutions naturelles</strong> avant les traitements conventionnels :<br><br>• Phytothérapie (plantes médicinales vétérinaires)<br>• Huiles essentielles adaptées aux animaux<br>• Oligoéléments & compléments alimentaires<br>• Acupuncture & fleurs de Bach<br><br>La médecine conventionnelle intervient en complément si nécessaire.',
      chips: ['Services', 'Prendre RDV'],
    },
    { id: 'osteo', priority: 60,
      keywords: ['osteopathie animale', 'acupuncture veterinaire', 'fleurs de bach animal', 'manipulation osteo'],
      threshold: 1,
      response: '🌸 Le Dr PAYRIERE pratique :<br><br>• <strong>Ostéopathie</strong> animale — tensions musculo-squelettiques, douleurs chroniques<br>• <strong>Acupuncture</strong> — stimulation des points d\'énergie<br>• <strong>Fleurs de Bach</strong> — anxiété, comportements indésirables<br><br>Idéal pour les animaux stressés ou en douleur chronique.',
      chips: ['Prendre RDV'],
    },

    /* ════ ORGANISATION & RDV (priority 50) ════ */
    { id: 'rdv', priority: 50,
      keywords: ['rendez-vous', 'prendre rdv', 'reserver consultation', 'planifier visite', 'fixer rendez', 'appointment'],
      threshold: 1, action: 'booking',
      response: 'Je vais vous aider à préparer votre demande de rendez-vous ! 📅',
      chips: [],
    },
    { id: 'rdv-annuler', priority: 50,
      keywords: ['annuler rdv', 'annulation rendez-vous', 'deplacer rendez-vous', 'reporter consultation', 'modifier rdv'],
      threshold: 1,
      response: '📅 Pour annuler ou modifier un rendez-vous, appelez-nous :<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br><br>Lun / Mer / Ven : 9h30–12h30 et 15h–19h',
      chips: ['Horaires', 'Prendre RDV'],
    },
    { id: 'rdv-duree', priority: 50,
      keywords: ['duree consultation', 'combien de temps consultation', 'consultation longue', 'temps rdv'],
      threshold: 1,
      response: '⏱️ Une consultation dure en général <strong>20 à 30 minutes</strong>. Elle peut être plus longue pour les examens complets ou les premiers bilans.',
      chips: ['Prendre RDV', 'Horaires'],
    },
    { id: 'rdv-en-ligne', priority: 50,
      keywords: ['reserver en ligne', 'rdv internet', 'rendez-vous en ligne', 'appli rdv', 'site internet rdv'],
      threshold: 1,
      response: '📞 Les rendez-vous se prennent actuellement <strong>uniquement par téléphone</strong> :<br><br><a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br><br>Lun / Mer / Ven : 9h30–12h30 et 15h–19h',
      chips: ['Horaires', 'Prendre RDV'],
    },
    { id: 'rdv-attente', priority: 50,
      keywords: ['attente rdv', 'delai consultation', 'place disponible', 'disponibilite', 'liste attente'],
      threshold: 1,
      response: 'Pour connaître les prochaines disponibilités, appelez-nous directement :<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Prendre RDV', 'Horaires'],
    },
    { id: 'horaires-lundi', priority: 50, keywords: ['lundi'], threshold: 1,
      response: '🗓️ Le cabinet est ouvert <strong>le lundi de 9h30 à 12h30 et de 15h à 19h</strong>.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    { id: 'horaires-mardi', priority: 50, keywords: ['mardi'], threshold: 1,
      response: '🏠 Le mardi, le Dr PAYRIERE effectue des <strong>visites à domicile uniquement</strong>. Pas de consultations au cabinet.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    { id: 'horaires-mercredi', priority: 50, keywords: ['mercredi'], threshold: 1,
      response: '🗓️ Le cabinet est ouvert <strong>le mercredi de 9h30 à 12h30 et de 15h à 19h</strong>.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    { id: 'horaires-jeudi', priority: 50, keywords: ['jeudi'], threshold: 1,
      response: '🏠 Le jeudi, le Dr PAYRIERE effectue des <strong>visites à domicile uniquement</strong>. Pas de consultations au cabinet.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    { id: 'horaires-vendredi', priority: 50, keywords: ['vendredi'], threshold: 1,
      response: '🗓️ Le cabinet est ouvert <strong>le vendredi de 9h30 à 12h30 et de 15h à 19h</strong>.',
      chips: ['Prendre RDV', 'Tous les horaires'],
    },
    { id: 'horaires-weekend', priority: 50, keywords: ['samedi', 'dimanche', 'weekend'], threshold: 1,
      response: '🔴 Le cabinet est <strong>fermé le samedi et le dimanche</strong>. Pour une urgence, contactez <a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank" rel="noopener">Vet-Urgentys</a> au <a href="tel:0561112131">05 61 11 21 31</a>.',
      chips: ['Urgences', 'Tous les horaires'],
    },
    { id: 'horaires', priority: 50,
      keywords: ['horaire', 'ouvert', 'ouverture', 'ferme', 'heure ouverture', 'quand ouvrez', 'planning cabinet', 'agenda cabinet'],
      threshold: 1,
      response: () => `🗓️ <strong>Horaires du cabinet :</strong><br><br>
        <strong>Lun / Mer / Ven</strong> : 9h30–12h30 et 15h–19h<br>
        <strong>Mar / Jeu</strong> : Visites à domicile uniquement<br>
        <strong>Sam / Dim</strong> : Fermé`,
      chips: ['Prendre RDV', 'Adresse', 'Urgences'],
    },
    { id: 'adresse', priority: 50,
      keywords: ['adresse', 'situe', 'trouver cabinet', 'localisation', 'gps', 'itineraire', 'saint-paul', 'coquelicots', '31530', 'parking', 'comment venir'],
      threshold: 1,
      response: '📍 <strong>3 impasse des Coquelicots, Saint-Paul-sur-Save (31530)</strong><br><br>Grand parking gratuit sur place. Nous sommes facilement accessibles depuis Toulouse.',
      chips: ['Horaires', 'Téléphone', 'Prendre RDV'],
    },
    { id: 'telephone', priority: 50,
      keywords: ['numero telephone', 'appeler cabinet', 'joindre cabinet', 'numero veterinaire', 'telephone cabinet'],
      threshold: 1,
      response: '📞 <strong><a href="tel:0561492799">05 61 49 27 99</a></strong><br><br>Lun / Mer / Ven : 9h30–12h30 et 15h–19h',
      chips: ['Horaires', 'Prendre RDV'],
    },
    { id: 'email', priority: 50, keywords: ['email', 'mail', 'adresse email', 'courriel'], threshold: 1,
      response: '✉️ <strong><a href="mailto:mpayriere.vet@gmail.com">mpayriere.vet@gmail.com</a></strong>',
      chips: ['Téléphone', 'Prendre RDV'],
    },
    { id: 'feries', priority: 50,
      keywords: ['jour ferie', 'jours feries', 'noel', 'paques', 'ascension', 'toussaint', 'ferie'],
      threshold: 1,
      response: '📅 Le cabinet est généralement <strong>fermé les jours fériés</strong>. En cas de doute, appelez-nous.<br><br>En urgence → <a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank"><strong>Vet-Urgentys</strong></a> : <a href="tel:0561112131">05 61 11 21 31</a>',
      chips: ['Urgences', 'Horaires'],
    },

    /* ════ CONSEIL & INFO (priority 40) ════ */
    { id: 'alimentation', priority: 40,
      keywords: ['nourrir', 'nourriture', 'croquette', 'alimentation', 'nutrition', 'que donner manger', 'regime alimentaire', 'que manger', 'comment nourrir', 'quoi manger'],
      threshold: 1,
      response: '🥗 <strong>Alimentation de votre animal :</strong><br><br>• Choisissez une alimentation <strong>adaptée à l\'espèce, l\'âge et la taille</strong><br>• <strong>Chaton/Chiot</strong> : croquettes labellisées "junior" — 3 à 4 repas/jour jusqu\'à 6 mois<br>• <strong>Adulte</strong> : 2 repas/jour, quantités selon le poids cible<br>• <strong>Senior</strong> : alimentation allégée en phosphore, plus digeste<br>• Eau fraîche disponible <strong>en permanence</strong><br><br>Le Dr PAYRIERE vous conseille un programme nutritionnel lors de la consultation.',
      chips: ['Prendre RDV'],
    },
    { id: 'adoption', priority: 40,
      keywords: ['adopter', 'adoption', 'viens d adopter', 'nouveau compagnon', 'vient d adopter', 'je viens d', 'premier animal', 'nouveau animal'],
      threshold: 1,
      response: '🐾 <strong>Félicitations pour votre adoption !</strong><br><br>Voici les premières étapes :<br><br>1️⃣ <strong>Bilan de santé</strong> dans les 48h — vérifier l\'état général, les parasites, et le carnet de vaccination<br>2️⃣ <strong>Identification</strong> — puce électronique obligatoire<br>3️⃣ <strong>Primo-vaccination</strong> si pas encore faite<br>4️⃣ <strong>Programme antiparasitaire</strong> adapté<br>5️⃣ <strong>Conseil alimentation</strong> selon l\'espèce et l\'âge<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a> pour prendre RDV dès l\'adoption !',
      chips: ['Prendre RDV', 'Vaccination', 'Identification'],
    },
    { id: 'domicile', priority: 40,
      keywords: ['visite domicile', 'venir chez moi', 'deplacement veterinaire', 'veterinaire maison', 'consultation domicile'],
      threshold: 1,
      response: '🏠 Le Dr PAYRIERE effectue des <strong>visites à domicile le mardi et le jeudi</strong>.<br><br>Idéal pour les animaux stressés par le transport ou les animaux âgés.<br><br>📞 Appelez pour organiser une visite : <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV', 'Horaires'],
    },
    { id: 'passeport', priority: 40,
      keywords: ['passeport animal', 'voyage etranger animal', 'emmener animal voyage', 'certificat voyage', 'europe animal'],
      threshold: 1,
      response: '✈️ Pour voyager avec votre animal en Europe, il vous faut :<br><br>• Un <strong>passeport européen</strong> (délivré par le vétérinaire)<br>• Une <strong>identification</strong> à jour (puce électronique)<br>• Les <strong>vaccinations requises</strong> selon la destination<br><br>Prenez RDV au moins 3–4 semaines avant le départ !<br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV', 'Identification'],
    },
    { id: 'admin-perdu', priority: 40,
      keywords: ['animal perdu', 'chien perdu', 'chat perdu', 'animal disparu', 'retrouver animal fugue'],
      threshold: 1,
      response: '😿 <strong>Animal perdu — que faire ?</strong><br><br>1️⃣ Déclarez-le sur <strong>I-CAD</strong> (fichier national des animaux identifiés)<br>2️⃣ Alertez la mairie, le refuge et la fourrière locaux<br>3️⃣ Publiez sur les réseaux locaux et groupes Facebook<br>4️⃣ Venez chez nous — nous pouvons lire sa puce si vous retrouvez un animal<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Adresse', 'Horaires'],
    },
    { id: 'admin-trouve', priority: 40,
      keywords: ['animal trouve', 'trouver animal', 'j ai trouve un chien', 'j ai trouve un chat', 'animal abandonne'],
      threshold: 1,
      response: '🐾 <strong>Animal trouvé — que faire ?</strong><br><br>1️⃣ Venez au cabinet — nous lisons la <strong>puce électronique gratuitement</strong> pour retrouver le propriétaire<br>2️⃣ Signalez-le à la mairie et la fourrière<br>3️⃣ Publiez sur les réseaux locaux<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Adresse', 'Horaires'],
    },
    { id: 'admin-certificat', priority: 40,
      keywords: ['certificat de sante', 'attestation veterinaire', 'certificat bonne sante', 'document adoption'],
      threshold: 1,
      response: '📋 Nous délivrons les <strong>certificats de bonne santé</strong> lors d\'une consultation (requis pour vente, adoption, concours, voyage).<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV'],
    },

    /* ════ COMMERCIAL & GÉNÉRAL (priority 30) ════ */
    { id: 'tarif', priority: 30,
      keywords: ['tarif', 'prix consultation', 'combien coute', 'cout veterinaire', 'cher'],
      threshold: 1,
      response: '💰 Les tarifs varient selon la consultation et l\'acte réalisé. Appelez-nous pour un renseignement :<br><br>📞 <strong><a href="tel:0561492799">05 61 49 27 99</a></strong>',
      chips: ['Prendre RDV', 'Horaires'],
    },
    { id: 'paiement', priority: 30,
      keywords: ['paiement', 'comment payer', 'carte bancaire', 'cheque paiement', 'espece paiement', 'moyen paiement'],
      threshold: 1,
      response: '💳 Nous acceptons :<br><br>• Carte bancaire (CB)<br>• Espèces<br>• Chèques',
      chips: ['Prendre RDV'],
    },
    { id: 'assurance', priority: 30,
      keywords: ['assurance animale', 'mutuelle animale', 'remboursement assurance', 'santevet', 'assurance chien', 'assurance chat'],
      threshold: 1,
      response: '🐾 Nous fournissons des <strong>factures détaillées</strong> que vous pouvez transmettre à votre assurance animale. Rapprochez-vous de votre assureur pour les conditions de remboursement.',
      chips: ['Prendre RDV'],
    },
    { id: 'devis', priority: 30,
      keywords: ['devis', 'estimation prix', 'cout operation', 'prix sterilisation', 'avant de venir'],
      threshold: 1,
      response: '💰 Nous pouvons vous donner une <strong>estimation</strong> lors d\'une consultation ou par téléphone :<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Téléphone', 'Prendre RDV'],
    },
    { id: 'boutique', priority: 30,
      keywords: ['boutique chronovet', 'point relais', 'commander produit', 'chronovet', 'produit veterinaire ligne'],
      threshold: 1,
      response: '🛒 Le cabinet est <strong>point relais ChronoVet officiel</strong> !<br><br>Commandez vos produits vétérinaires sur <a href="https://www.chronovet.fr" target="_blank">chronovet.fr</a> et récupérez-les au cabinet — <strong>sans frais de livraison</strong>.',
      chips: ['Horaires', 'Adresse'],
    },
    { id: 'services', priority: 30,
      keywords: ['quels services', 'que proposez vous', 'prestations cabinet', 'specialites cabinet', 'offre veterinaire'],
      threshold: 1,
      response: '🏥 <strong>Nos services :</strong><br><br>🩺 Consultations & bilans de santé<br>💉 Vaccinations<br>🔬 Analyses & échographie<br>🏥 Chirurgie (stérilisation, extractions…)<br>🦷 Dentisterie & détartrage<br>🌿 Phytothérapie, acupuncture, ostéopathie<br>🏠 Visites à domicile (mar/jeu)',
      chips: ['Prendre RDV', 'Espèces acceptées'],
    },
    { id: 'docteur', priority: 30,
      keywords: ['docteur payriere', 'qui est le veterinaire', 'experience du veterinaire', 'formation veterinaire', 'parcours veterinaire'],
      threshold: 1,
      response: '👩‍⚕️ Le <strong>Dr PAYRIERE</strong> est vétérinaire depuis plus de <strong>30 ans</strong>.<br><br>Elle conjugue médecine conventionnelle et approches naturelles (ostéopathie, acupuncture, phytothérapie) pour offrir des soins complets et bienveillants.',
      chips: ['Services', 'Prendre RDV'],
    },
    { id: 'avis', priority: 30,
      keywords: ['avis clients', 'temoignage veterinaire', 'recommande veterinaire', 'note cabinet', 'google avis'],
      threshold: 1,
      response: '⭐⭐⭐⭐⭐ Nos clients nous font confiance !<br><br><em>« Très pro, attentionnée et réactive »</em> — Léa L.<br><em>« Vous pouvez y aller les yeux fermés »</em> — Christopher B.<br><em>« Une veto en or et passionnée »</em> — Florence D.',
      chips: ['Prendre RDV'],
    },

    /* ════ TYPES D'ANIMAUX — priority 10 (seulement si rien d'autre ne matche) ════ */
    { id: 'especes', priority: 10,
      keywords: ['especes acceptees', 'quels animaux', 'animaux acceptes', 'vous soignez quoi', 'vous prenez quels animaux'],
      threshold: 1,
      response: '🐾 Nous accueillons tous vos compagnons :<br><br>🐶 Chiens &nbsp;🐱 Chats &nbsp;🐰 Lapins<br>🐹 Rongeurs &nbsp;🦜 Oiseaux &nbsp;🐍 NAC<br><br>Aucun animal n\'est trop petit pour être bien soigné !',
      chips: ['Services', 'Prendre RDV'],
    },
    { id: 'chien', priority: 10,
      keywords: ['chien', 'chienne', 'toutou', 'canin', 'chiot', 'mon chien'],
      threshold: 1,
      response: '🐶 Nous prenons en charge les chiens pour toutes les consultations : vaccinations, chirurgie, dentisterie, bilans de santé et bien plus !<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Vaccination', 'Stérilisation', 'Prendre RDV'],
    },
    { id: 'chat-animal', priority: 10,
      keywords: ['chat', 'chatte', 'felin', 'chaton', 'mon chat', 'chatons'],
      threshold: 1,
      response: '🐱 Nous accueillons les chats pour toutes les consultations. Le Dr PAYRIERE a une approche douce, idéale pour les chats craintifs ou stressés !<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Vaccination', 'Stérilisation', 'Prendre RDV'],
    },
    { id: 'lapin', priority: 10,
      keywords: ['lapin', 'lapine', 'lapereau', 'mon lapin'],
      threshold: 1,
      response: '🐰 Le Dr PAYRIERE est expérimentée avec les lapins : suivi régulier, vaccination myxomatose/VHD, stérilisation et soins dentaires (la dentition est un point clé chez le lapin).',
      chips: ['Prendre RDV'],
    },
    { id: 'rongeur', priority: 10,
      keywords: ['rongeur', 'hamster', 'cobaye', 'gerbille', 'rat animal', 'furet', 'mon rongeur'],
      threshold: 1,
      response: '🐹 Nous prenons en charge les rongeurs et petits mammifères : hamsters, cobayes, gerbilles, rats… ainsi que les furets.',
      chips: ['Prendre RDV'],
    },
    { id: 'nac', priority: 10,
      keywords: ['nac', 'nouveaux animaux de compagnie', 'animaux exotiques', 'oiseau animal', 'reptile', 'perroquet', 'tortue', 'serpent', 'chinchilla', 'veterinaire nac', 'specialiste nac'],
      threshold: 1,
      response: '🦜 Le Dr PAYRIERE soigne également les <strong>NAC</strong> : oiseaux, reptiles, chinchillas et autres espèces exotiques.<br><br>Appelez-nous pour confirmer selon l\'espèce :<br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV', 'Téléphone'],
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

  function matchScore(rule, fullText) {
    if (!rule.keywords.length) return -1;
    return rule.keywords.filter(kw => fullText.includes(kw)).length;
  }

  function findBestRule(input) {
    const fullText = normalize(input);
    let best = null, bestScore = -Infinity;
    RULES.forEach(rule => {
      const hits = matchScore(rule, fullText);
      if (hits >= rule.threshold) {
        const score = hits * (rule.priority || 1);
        if (score > bestScore) { best = rule; bestScore = score; }
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
