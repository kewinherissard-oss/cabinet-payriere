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
      response: 'Bonjour ! Moi c\'est Puce, l\'assistante virtuelle du cabinet du Dr PAYRIERE 😊 Je suis là pour répondre à toutes vos questions — n\'hésitez pas, il n\'y a pas de question bête !',
      chips: ['Horaires', 'Prendre RDV', 'Mon animal est malade', 'Urgences'],
    },
    { id: 'aurevoir', priority: 1,
      keywords: ['aurevoir', 'bonne journee', 'bonne soiree', 'ciao', 'bye', 'bientot', 'tchao'],
      threshold: 1,
      response: 'À bientôt ! 😊 Prenez bien soin de votre compagnon, et n\'hésitez pas à revenir si vous avez d\'autres questions.',
      chips: ['Prendre RDV', 'Horaires'],
    },
    { id: 'merci', priority: 1,
      keywords: ['merci', 'super', 'parfait', 'nickel', 'genial', 'top', 'impeccable', 'excellent'],
      threshold: 1,
      response: 'Avec plaisir, c\'est pour ça que je suis là ! 😊 Si vous avez d\'autres questions, n\'hésitez pas.',
      chips: ['Prendre RDV', 'Horaires', 'Adresse'],
    },

    /* ════ DANGER IMMÉDIAT (priority 100) ════ */
    { id: 'medicament-humain-danger', priority: 100,
      keywords: ['ibuprofene', 'ibuprofen', 'paracetamol', 'aspirine', 'doliprane', 'nurofen', 'antidouleur humain'],
      threshold: 1,
      response: '⚠️ Stop — surtout ne lui donnez rien ! L\'ibuprofène et le paracétamol sont <strong>extrêmement toxiques</strong> pour les chiens et les chats, même à très faible dose. Ce qui est anodin pour nous peut être mortel pour eux.<br><br>Si votre animal en a déjà ingéré, appelez <strong>immédiatement</strong> sans attendre les premiers symptômes :<br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br>ou <a href="tel:0561112131"><strong>Vet-Urgentys : 05 61 11 21 31</strong></a> (24h/24)',
      chips: ['Urgences'],
    },
    { id: 'urgence-avale', priority: 100,
      keywords: ['avale objet', 'ingere', 'corps etranger', 'intoxication', 'empoisonne', 'poison', 'toxique', 'mange quelque chose'],
      threshold: 1,
      response: 'C\'est une urgence, il ne faut vraiment pas attendre ! Appelez-nous tout de suite au <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a> — dites-nous ce qu\'il a avalé et en quelle quantité, c\'est important pour qu\'on puisse guider la prise en charge.<br><br>Si c\'est en dehors de nos horaires : <a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank"><strong>Vet-Urgentys</strong></a> au <a href="tel:0561112131"><strong>05 61 11 21 31</strong></a> — ils sont disponibles 24h/24. 🚨',
      chips: ['Urgences'],
    },

    /* ════ URGENCES (priority 90) ════ */
    { id: 'urgence', priority: 90,
      keywords: ['urgence', 'urgent', 'garde', 'accident', 'blesse', 'grave', 'secours', 'empoisonnement'],
      threshold: 1,
      response: 'D\'accord, en dehors de nos heures il faut contacter <a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank" rel="noopener"><strong>Vet-Urgentys</strong></a> directement au <a href="tel:0561112131"><strong>05 61 11 21 31</strong></a> — ils sont disponibles 24h/24 et 7j/7 pour les urgences. N\'attendez pas si votre animal souffre vraiment. 🚨',
      chips: ['Horaires du cabinet', 'Adresse'],
    },
    { id: 'urgence-soir', priority: 90,
      keywords: ['ce soir', 'tout de suite', 'immediatement', 'maintenant urgent', 'ce moment urgent'],
      threshold: 1,
      response: 'Si c\'est urgent là maintenant, ne perdez pas de temps — contactez <a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank"><strong>Vet-Urgentys</strong></a> au <a href="tel:0561112131"><strong>05 61 11 21 31</strong></a>, ils sont là 24h/24. Et si c\'est dans nos horaires, appelez-nous directement au <a href="tel:0561492799">05 61 49 27 99</a>.',
      chips: ['Horaires du cabinet'],
    },

    /* ════ SYMPTÔMES SPÉCIFIQUES (priority 80) ════ */
    { id: 'urinaire', priority: 80,
      keywords: ['urine', 'uriner', 'urinaire', 'pipi', 'miction', 'fait pipi', 'fait ses besoins', 'incontinence', 'pisser', 'se soulage', 'besoins partout', 'partout dans'],
      threshold: 1,
      response: 'Les problèmes urinaires chez les animaux, ça peut prendre plusieurs formes ! Si votre animal urine très souvent en petite quantité, c\'est souvent une infection ou des calculs — très courant chez le chat mâle notamment. S\'il urine partout soudainement alors que ce n\'est pas dans ses habitudes, ça peut aussi être du stress ou du marquage. Et s\'il boit et urine beaucoup, on pense au diabète ou aux reins.<br><br>Dans tous les cas, une petite visite + une analyse d\'urine et on y voit très clair ! Appelez-nous 😊<br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'vomissement', priority: 80,
      keywords: ['vomit', 'vomis', 'vomi', 'vomissem', 'gerbe', 'rend tout', 'rend son repas', 'nausee'],
      threshold: 1,
      response: 'Si ça arrive de temps en temps, c\'est souvent qu\'il a mangé trop vite ou avalé quelque chose qui lui a un peu irrité l\'estomac — pas forcément grave.<br><br>En revanche, si ça dure depuis plus de 24h, qu\'il vomit régulièrement ou qu\'il y a du sang, là il faut vraiment consulter sans attendre.<br><br>Appelez-nous pour qu\'on évalue ça ensemble 📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'diarrhee', priority: 80,
      keywords: ['diarrhee', 'selle molle', 'selles liquides', 'caca liquide', 'gastro', 'ventre ballonne', 'fait partout'],
      threshold: 1,
      response: 'Un épisode isolé de diarrhée, ça arrive — souvent un repas qui passe mal, un changement alimentaire ou un peu de stress. Donnez-lui de l\'eau fraîche et attendez quelques heures.<br><br>Mais si ça dure plus de 48h, s\'il y a du sang, ou s\'il est vraiment abattu en plus, là on consulte sans hésiter.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'mange-plus', priority: 80,
      keywords: ['mange plus', 'mange rien', 'ne mange', 'anorexie', 'refuse manger', 'perd appetit', 'appetit coupe', 'pas touche gamelle', 'mange pas'],
      threshold: 1,
      response: 'Un chat qui ne mange plus depuis 24h, un chien depuis 48h — c\'est le moment de nous appeler. Les animaux ne font pas grève de la faim pour rien, il y a toujours quelque chose derrière : douleur, stress intense, problème digestif...<br><br>Est-ce qu\'il boit toujours normalement ? C\'est un bon indicateur à surveiller aussi.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a> — on peut souvent vous donner un premier avis par téléphone.',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'boite', priority: 80,
      keywords: ['boite', 'boiter', 'boiterie', 'marche mal', 'patte bless', 'leve plus sa patte', 'se deplace mal', 'ne marche plus', 'sa patte'],
      threshold: 1,
      response: 'Ça peut être une petite entorse, une griffure, un corps étranger dans la patte... parfois ça passe tout seul en quelques heures. Vérifiez d\'abord s\'il n\'y a rien de visible entre les doigts.<br><br>Mais si ça ne s\'améliore pas en 24h, ou si la patte est enflée ou chaude — là on consulte, ça peut être une fracture ou une infection.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'agressivite', priority: 80,
      keywords: ['agressif', 'agressive', 'mord', 'grogne', 'attaque', 'mordre', 'agressivite', 'devient mechant', 'me mord', 'mord les enfants', 'fait peur'],
      threshold: 1,
      response: 'Un animal qui devient agressif sans raison apparente, c\'est souvent qu\'il a mal quelque part et qu\'il ne peut pas vous le dire autrement. Douleur dentaire, arthrose, infection... les animaux n\'ont que ça comme moyen d\'expression.<br><br>Avant de conclure à un problème de comportement, on vérifie toujours qu\'il n\'y a pas de cause physique. Une consultation suffit souvent à avoir la réponse.<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV'],
    },
    { id: 'poils', priority: 80,
      keywords: ['perd ses poils', 'chute de poils', 'alopecie', 'pelage abime', 'poils tombent', 'perd son poil', 'se leche excessivem', 'plein de poils', 'pelage terne', 'fait des plaques'],
      threshold: 1,
      response: 'Si votre animal perd ses poils de façon anormale, ça mérite qu\'on y regarde de plus près. Ça peut venir d\'une allergie, de parasites (gale, teigne, puces), d\'un déséquilibre hormonal ou même du stress chez les chats qui se lèchent trop.<br><br>La bonne nouvelle c\'est qu\'une fois qu\'on identifie la cause, ça se traite bien dans la plupart des cas ! Un examen clinique et quelques analyses suffisent souvent.<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV'],
    },
    { id: 'malade-general', priority: 80,
      keywords: ['malade', 'maladie', 'symptome', 'inquiet', 'quelque chose va pas', 'pas dans son assiette', 'abattu', 'fatigue', 'apathique', 'va pas bien', 'pas bien du tout', 'se sent pas', 'bizarre', 'tremble', 'convulsion', 'crise', 'saigne', 'grosseur', 'bosse', 'gonfle', 'yeux coulent', 'boit beaucoup', 'respire mal', 'aidez moi', 'que faire'],
      threshold: 1,
      response: 'Quand votre instinct vous dit que quelque chose ne va pas, faites-lui confiance. Vous connaissez votre animal mieux que personne, et les animaux sont passés maîtres dans l\'art de cacher leur douleur jusqu\'au bout.<br><br>Appelez-nous, on préfère toujours rassurer pour rien que passer à côté de quelque chose.<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a><br>Si c\'est en dehors de nos horaires → <a href="https://vet-urgentys.fr/?msclkid=b882e05941c4136114f88a44bdd14460" target="_blank"><strong>Vet-Urgentys</strong></a> : <a href="tel:0561112131">05 61 11 21 31</a>',
      chips: ['Prendre RDV', 'Urgences'],
    },
    { id: 'chaleur', priority: 80,
      keywords: ['chaleur', 'chaleurs', 'en chaleur', 'cycle', 'saignement', 'rut'],
      threshold: 1,
      response: 'Les chaleurs, c\'est stressant pour elles (et pour vous !). On peut la stériliser, mais en général on préfère attendre qu\'elle soit entre deux cycles — le risque hémorragique est plus faible.<br><br>Appelez-nous, le Dr PAYRIERE verra avec vous quel est le meilleur moment selon son état 😊<br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Stérilisation', 'Prendre RDV'],
    },

    /* ════ PROCÉDURES MÉDICALES (priority 70) ════ */
    { id: 'sterilisation', priority: 70,
      keywords: ['sterilisation', 'steriliser', 'castration', 'castrer', 'suprelorin', 'sterilise'],
      threshold: 1,
      response: 'Bonne question ! Pour les chats et chattes, on recommande la chirurgie dès 5-6 mois — ça évite les chaleurs, les fugues et certains cancers. Pour les chiens mâles, le Dr PAYRIERE préfère souvent l\'implant Suprelorin® plutôt que la castration chirurgicale — c\'est réversible et ça évite l\'anesthésie générale.<br><br>Chaque animal est différent, le mieux c\'est qu\'on en parle ensemble lors d\'une consultation 😊<br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
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
      response: 'Pour les vaccins, tout dépend de l\'âge et du mode de vie de votre animal, mais voici les grandes lignes :<br><br>🐶 Chiot : première injection à 6-8 semaines, rappel à 1 an puis tous les 1-3 ans<br>🐱 Chaton : à partir de 8-9 semaines, rappel annuel<br>🐰 Lapin : myxomatose + VHD, rappel annuel<br><br>On adapte toujours le programme à votre animal. Appelez-nous pour savoir où il en est 😊<br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
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
      keywords: ['puces', 'puce animal', 'se gratte', 'gratte beaucoup', 'demangeaison', 'anti-puces', 'antipuce', 'plein de puces', 'des puces'],
      threshold: 1,
      response: 'L\'erreur classique c\'est de traiter seulement l\'animal et d\'oublier l\'environnement — or les puces passent 95% de leur temps dans votre maison, pas sur lui !<br><br>Donc : traitez l\'animal avec un produit adapté ET pulvérisez la maison (canapé, tapis, litière, voiture). Sans ça, elles reviennent à coup sûr.<br><br>Appelez-nous pour qu\'on vous conseille le bon produit selon votre animal 📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV', 'Boutique ChronoVet'],
    },
    { id: 'antiparasitaire-tique', priority: 60,
      keywords: ['tique', 'tiques', 'enlever tique', 'retirer tique', 'une tique', 'pleine de tiques'],
      threshold: 1,
      response: '🕷️ <strong>Comment gérer une tique :</strong><br><br>• Utilisez un <strong>tire-tique</strong> (rotation douce, ne jamais arracher brutalement)<br>• Ne jamais brûler ni écraser la tique in situ<br>• Désinfectez la plaie<br>• Surveillez 2–3 semaines (rougeur, fièvre, abattement = consultez)<br><br>Si votre animal <strong>a avalé</strong> une tique, appelez-nous.',
      chips: ['Prendre RDV', 'Boutique ChronoVet'],
    },
    { id: 'antiparasitaire-freq', priority: 60,
      keywords: ['vermifuge', 'vermifuger', 'deparasiter', 'deparasitage', 'quand donner antiparasitaire', 'frequence antiparasitaire', 'programme antiparasitaire'],
      threshold: 1,
      response: 'En général pour un adulte, on vermifuge tous les 3 mois. Pour un chiot ou un chaton, c\'est tous les mois jusqu\'à 6 mois parce qu\'ils sont plus vulnérables.<br><br>Pour les puces et tiques, le rythme dépend du produit — certains tiennent 1 mois, d\'autres 3 mois. On peut vous établir un petit calendrier adapté si vous voulez, c\'est plus simple 😊<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
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
      keywords: ['nourri', 'croquette', 'alimentation', 'nutrition', 'regime alimentaire', 'donne quoi', 'donner quoi', 'je donne quoi', 'quoi manger', 'que donner', 'que manger', 'nouritu', 'comment nourrir', 'bien manger', 'bien nourrir', 'poids ideal', 'trop gros', 'trop maigre'],
      threshold: 1,
      response: 'L\'alimentation c\'est vraiment la base de la santé ! Pour un chiot ou un chaton, misez sur des croquettes "junior" — 3 à 4 petits repas par jour jusqu\'à 6 mois, puis on passe à 2 repas. Pour un adulte, adaptez les quantités à son poids et à son activité. Pour les seniors, il existe des gammes spéciales plus digestes et adaptées aux reins.<br><br>Évitez les restes de table et le lait de vache — les animaux ne le tolèrent pas bien. Et de l\'eau fraîche tout le temps, c\'est indispensable !<br><br>Si vous voulez des conseils plus précis selon votre animal, le Dr PAYRIERE peut établir un programme adapté 😊<br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Prendre RDV'],
    },
    { id: 'adoption', priority: 40,
      keywords: ['adopter', 'adoption', 'viens d adopter', 'nouveau compagnon', 'vient d adopter', 'je viens d', 'premier animal', 'nouveau animal'],
      threshold: 1,
      response: 'Oh, félicitations ! C\'est toujours un grand moment 🥰<br><br>Idéalement, on essaie de faire un premier bilan dans les 48h — pour vérifier que tout va bien, qu\'il n\'a pas de parasites, voir où il en est pour les vaccins. Si c\'est un chaton ou un chiot, on lance aussi le programme vaccinal et antiparasitaire.<br><br>On s\'occupe aussi de la puce électronique si ce n\'est pas encore fait — c\'est obligatoire.<br><br>Appelez-nous, on est là pour vous accompagner dès le départ 😊<br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
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
      keywords: ['perdu', 'disparu', 'fugue', 'retrouver', 'cherche mon', 'j ai perdu', 'ai perdu mon', 'plus rentrer', 'introuvable'],
      threshold: 1,
      response: 'Oh non, c\'est une situation vraiment stressante... Pas de panique, voici ce qu\'il faut faire rapidement :<br><br>Déclarez-le sur <strong>I-CAD</strong> (le fichier national) si il est pucé ou tatoué — c\'est le premier réflexe. Prévenez aussi la mairie, la fourrière et les refuges du secteur. Et postez une annonce avec sa photo sur les groupes locaux Facebook, ça marche souvent très bien.<br><br>Si quelqu\'un ramène un animal et vous ne savez pas si c\'est le vôtre, on peut lire la puce ici au cabinet. 📞 <a href="tel:0561492799">05 61 49 27 99</a>',
      chips: ['Adresse', 'Horaires'],
    },
    { id: 'admin-trouve', priority: 40,
      keywords: ['j ai trouve', 'trouve un chien', 'trouve un chat', 'trouve un animal', 'animal abandonne', 'dans la rue', 'ramasse un'],
      threshold: 1,
      response: 'C\'est bien de vouloir aider ! Amenez-le au cabinet, on lit la puce gratuitement et on peut retrouver le propriétaire directement. Si il n\'est pas pucé, signalez-le à la mairie et à la fourrière, et postez une annonce sur les groupes Facebook du coin.<br><br>En attendant, gardez-le au chaud et à l\'écart d\'autres animaux si vous en avez.<br><br>📞 <a href="tel:0561492799">05 61 49 27 99</a>',
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
      response: 'Les tarifs dépendent du type de consultation et de l\'acte réalisé — difficile de donner un chiffre précis sans connaître votre situation. Le mieux c\'est de nous appeler, on vous répondra directement 😊<br><br>📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
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
      response: 'Au cabinet on fait à peu près tout ce dont votre animal peut avoir besoin : consultations, vaccins, prises de sang et échographie, chirurgie (stérilisation, extractions dentaires...), détartrage, et aussi des approches plus naturelles comme la phytothérapie, l\'acupuncture et l\'ostéopathie animale.<br><br>Le Dr PAYRIERE se déplace aussi à domicile le mardi et le jeudi, pratique pour les animaux qui stressent en voiture 😊<br><br>Vous avez quelque chose de particulier en tête ?',
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
      response: 'Je n\'ai pas bien compris votre question. 🐾<br><br>Vous pouvez me parler de :<br>• Un <strong>symptôme</strong> (vomissements, diarrhée, boiterie…)<br>• Les <strong>horaires ou l\'adresse</strong> du cabinet<br>• Un <strong>rendez-vous</strong><br>• La <strong>vaccination</strong>, <strong>stérilisation</strong>, <strong>antiparasitaires</strong>…<br><br>Ou appelez-nous directement : 📞 <a href="tel:0561492799"><strong>05 61 49 27 99</strong></a>',
      chips: ['Horaires', 'Urgences', 'Prendre RDV', 'Mon animal est malade'],
    },
  ];

  /* ── Envoi RDV via Google Apps Script (email + Calendar) + ntfy.sh (push) ── */
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxbpM-4eLwtqComh3X8n22vxuuVMzNzdQ1sY2QTPsPcOgL2a2I_PhU5Bl29ttp9anM6/exec';
  const NTFY_TOPIC  = 'rdv-cabinet-payriere-31530';

  function sendWebhook(data) {
    const isNew = bookingType === 'new';
    const params = new URLSearchParams({
      type:         isNew ? 'NOUVEAU CLIENT' : 'CLIENT EXISTANT',
      name:         data.name         || '',
      phone:        data.phone        || '',
      email:        data.email        || '',
      address:      data.address      || '',
      date:         data.date         || '',
      animal:       data.animal       || '',
      animalAge:    data.animalAge    || '',
      animalSexe:   data.animalSexe   || '',
      animalSteril: data.animalSteril || '',
      antecedents:  data.antecedents  || '',
      motive:       data.motive       || '',
    });
    fetch(WEBHOOK_URL + '?' + params.toString(), { mode: 'no-cors' }).catch(() => {});

    const message = [
      (isNew ? '🆕 NOUVEAU CLIENT' : '🔄 Client existant'),
      'Nom          : ' + (data.name         || '?'),
      'Téléphone    : ' + (data.phone        || '?'),
      'Email        : ' + (data.email        || '?'),
      isNew ? 'Adresse      : ' + (data.address      || '?') : '',
      'Animal       : ' + (data.animal       || '?'),
      isNew ? 'Age/Race     : ' + (data.animalAge    || '?') : '',
      isNew ? 'Sexe         : ' + (data.animalSexe   || '?') : '',
      isNew ? 'Stérilisé    : ' + (data.animalSteril || '?') : '',
      isNew ? 'Antécédents  : ' + (data.antecedents  || '?') : '',
      'Créneau      : ' + (data.date         || '?'),
      'Motif        : ' + (data.motive       || '?'),
    ].filter(Boolean).join('\n');
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
  /* bookingType : '' | 'existing' | 'new' */
  let bookingType = '';

  function startBooking() {
    booking = true;
    bookingStep = 0;
    bookingType = '';
    bookingData = {};
    setChips(['✅ Oui, je suis déjà client', '🆕 Non, première visite']);
    setTimeout(() => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        appendMsg('bot', 'Super, je vais vous aider à préparer votre rendez-vous 😊<br><br>Êtes-vous <strong>déjà client</strong> chez nous ?');
        scrollBottom();
      }, 600);
    }, 200);
  }

  function handleBookingInput(text) {
    const t  = normalize(text);
    const chips_creneaux = ['Lundi matin', 'Lundi après-midi', 'Mercredi matin', 'Mercredi après-midi', 'Vendredi matin', 'Vendredi après-midi', 'Je ne sais pas encore'];
    const chips_animaux  = ['🐶 Chien', '🐱 Chat', '🐰 Lapin', '🐹 Rongeur', '🦜 Autre'];
    const chips_motifs   = ['Consultation générale', 'Vaccination', 'Chirurgie / Stérilisation', 'Suivi / Rappel', 'Autre'];
    const chips_sexe     = ['🔵 Mâle', '🔴 Femelle', 'Je ne sais pas'];
    const chips_steril   = ['✅ Oui', '❌ Non', 'Je ne sais pas'];

    if (t.match(/^(annuler|stop|quitter|non merci|abandonner)$/) && bookingStep !== 0) {
      resetBooking();
      setTimeout(() => {
        botReply('Pas de souci, j\'annule tout 😊 N\'hésitez pas à revenir quand vous voulez !');
        setChips(['Horaires', 'Prendre RDV', 'Urgences']);
      }, 300);
      return;
    }

    /* ═══ STEP 0 — Déjà client ? ═══ */
    if (bookingStep === 0) {
      const isExisting = t.match(/\b(oui|deja|deja client|je suis client|existant|connais)\b/);
      const isNew      = t.match(/\b(non|nouveau|nouvelle|premiere|premier|jamais|pas client|nouvelle visite)\b/);
      if (isExisting || text.includes('déjà') || text.includes('Oui')) {
        bookingType = 'existing';
        bookingStep = 1;
        setChips([]);
        botReply('Parfait, bienvenue ! 😊<br><br>Pour vous retrouver dans notre agenda, <strong>quel est votre nom ?</strong>');
      } else if (isNew || text.includes('Non') || text.includes('première') || text.includes('premier')) {
        bookingType = 'new';
        bookingStep = 1;
        setChips([]);
        botReply('Bienvenue chez nous ! On va préparer votre dossier pour que votre première visite se passe au mieux 🐾<br><br>On commence par vous — <strong>votre prénom et nom ?</strong>');
      } else {
        botReply('Désolée, je n\'ai pas bien compris 😊 Êtes-vous déjà venu consulter chez nous ?');
        setChips(['✅ Oui, je suis déjà client', '🆕 Non, première visite']);
      }
      return;
    }

    /* ═══ FLUX CLIENT EXISTANT ═══ */
    if (bookingType === 'existing') {

      if (bookingStep === 1) {
        if (text.trim().length < 2) { botReply('Merci d\'indiquer votre <strong>nom</strong> s\'il vous plaît 😊'); return; }
        bookingData.name = text.trim();
        bookingStep = 2;
        botReply(`Et votre <strong>numéro de téléphone</strong>, <strong>${escapeHtml(bookingData.name.split(' ')[0])}</strong> ?`);

      } else if (bookingStep === 2) {
        const clean = text.replace(/[\s.\-]/g, '');
        if (!/^[0-9+]{9,14}$/.test(clean)) { botReply('Ce numéro ne semble pas correct. Pouvez-vous le ressaisir ? (ex : 06 12 34 56 78)'); return; }
        bookingData.phone = text.trim();
        bookingStep = 3;
        setChips(chips_animaux);
        botReply('Quel animal souhaitez-vous amener ? <strong>Espèce et prénom</strong> de votre compagnon 🐾');

      } else if (bookingStep === 3) {
        if (text.trim().length < 2) { botReply('Merci de préciser l\'espèce et le prénom de votre animal (ex : "Mon chat Minou").'); return; }
        bookingData.animal = text.trim();
        bookingStep = 4;
        setChips(chips_creneaux);
        botReply('Quel <strong>créneau vous conviendrait</strong> ?<br><small>Cabinet ouvert Lun / Mer / Ven</small>');

      } else if (bookingStep === 4) {
        if (text.trim().length < 2) { botReply('Indiquez un créneau ou choisissez "Je ne sais pas encore".'); return; }
        bookingData.date = text.trim();
        bookingStep = 5;
        setChips(chips_motifs);
        botReply('Quel est le <strong>motif de la consultation</strong> ?');

      } else if (bookingStep === 5) {
        if (text.trim().length < 2) { botReply('Merci d\'indiquer le motif (ex : "Vaccination annuelle").'); return; }
        bookingData.motive = text.trim();
        bookingStep = 99;
        showRecap();
      }
      return;
    }

    /* ═══ FLUX NOUVEAU CLIENT (6 étapes max) ═══ */
    if (bookingType === 'new') {

      if (bookingStep === 1) {
        if (text.trim().length < 2) { botReply('Merci de saisir votre <strong>prénom et nom</strong> 😊'); return; }
        bookingData.name = text.trim();
        bookingStep = 2;
        botReply(`Enchanté(e) <strong>${escapeHtml(bookingData.name.split(' ')[0])}</strong> 😊 Votre <strong>numéro de téléphone</strong> ?`);

      } else if (bookingStep === 2) {
        const clean = text.replace(/[\s.\-]/g, '');
        if (!/^[0-9+]{9,14}$/.test(clean)) { botReply('Ce numéro ne semble pas correct. Réessayez (ex : 06 12 34 56 78).'); return; }
        bookingData.phone = text.trim();
        bookingStep = 3;
        botReply('Votre <strong>email</strong> pour recevoir la confirmation ? (tapez "passer" si vous préférez qu\'on vous rappelle)');

      } else if (bookingStep === 3) {
        const skip = normalize(text).match(/^(passer|skip|non|pas email|sans email)$/);
        if (!skip && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim())) {
          botReply('Cet email ne semble pas valide. Réessayez ou tapez <strong>"passer"</strong> pour continuer sans.');
          return;
        }
        bookingData.email = skip ? '' : text.trim();
        bookingStep = 4;
        setChips(chips_animaux);
        botReply('Et votre compagnon — <strong>quelle espèce et comment il s\'appelle ?</strong> 🐾');

      } else if (bookingStep === 4) {
        if (text.trim().length < 2) { botReply('Précisez l\'espèce et le prénom (ex : "Mon chat Minou").'); return; }
        bookingData.animal = text.trim();
        bookingStep = 5;
        setChips(chips_creneaux);
        botReply('Quel <strong>créneau vous conviendrait</strong> ? (cabinet ouvert Lun / Mer / Ven)');

      } else if (bookingStep === 5) {
        if (text.trim().length < 2) { botReply('Indiquez un créneau ou choisissez "Je ne sais pas encore".'); return; }
        bookingData.date = text.trim();
        bookingStep = 6;
        setChips(chips_motifs);
        botReply('Dernière question — quel est le <strong>motif de la consultation</strong> ?');

      } else if (bookingStep === 6) {
        if (text.trim().length < 2) { botReply('Indiquez le motif (ex : "Bilan de santé").'); return; }
        bookingData.motive = text.trim();
        bookingStep = 99;
        showRecap();
      }
      return;
    }
  }

  function buildMailto(data) {
    const isNew = bookingType === 'new';
    const subject = encodeURIComponent((isNew ? '🆕 NOUVEAU CLIENT — ' : '🔄 RDV — ') + (data.animal || '') + ' — ' + (data.name || ''));
    let body = 'Bonjour Dr PAYRIERE,\n\n';
    body += isNew ? 'NOUVEAU CLIENT — Demande de rendez-vous + fiche à créer\n\n' : 'Client existant — Demande de rendez-vous\n\n';
    body += '━━━ PROPRIÉTAIRE ━━━\n';
    body += 'Nom          : ' + (data.name    || '') + '\n';
    body += 'Téléphone    : ' + (data.phone   || '') + '\n';
    if (isNew) body += 'Email        : ' + (data.email   || '') + '\n';
    if (isNew) body += 'Adresse      : ' + (data.address || '') + '\n';
    body += '\n━━━ ANIMAL ━━━\n';
    body += 'Animal       : ' + (data.animal      || '') + '\n';
    if (isNew) body += 'Âge / Race   : ' + (data.animalAge  || '') + '\n';
    if (isNew) body += 'Sexe         : ' + (data.animalSexe || '') + '\n';
    if (isNew) body += 'Stérilisé(e) : ' + (data.animalSteril || '') + '\n';
    if (isNew) body += 'Antécédents  : ' + (data.antecedents || '') + '\n';
    body += '\n━━━ CONSULTATION ━━━\n';
    body += 'Créneau      : ' + (data.date   || '') + '\n';
    body += 'Motif        : ' + (data.motive || '') + '\n';
    body += '\nMerci de confirmer le rendez-vous.\n\nCordialement,\n' + (data.name || '');
    return 'mailto:mpayriere.vet@gmail.com?subject=' + encodeURIComponent(subject.replace(/%F0%9F.*?%20/g,'')) + '&body=' + encodeURIComponent(body);
  }

  function showRecap() {
    const data = bookingData;
    const isNew = bookingType === 'new';
    setChips([]);
    sendWebhook(data);
    showTyping();
    setTimeout(() => {
      hideTyping();
      let recap = 'Voilà, c\'est noté ! Voici le récapitulatif :<br><br>';
      recap += '👤 <strong>' + escapeHtml(data.name) + '</strong><br>';
      recap += '📞 ' + escapeHtml(data.phone) + '<br>';
      if (isNew && data.email)        recap += '✉️ ' + escapeHtml(data.email) + '<br>';
      if (isNew && data.address)      recap += '📍 ' + escapeHtml(data.address) + '<br>';
      recap += '🐾 ' + escapeHtml(data.animal) + '<br>';
      if (isNew && data.animalAge)    recap += '🎂 ' + escapeHtml(data.animalAge) + '<br>';
      if (isNew && data.animalSexe)   recap += '⚥ ' + escapeHtml(data.animalSexe) + '<br>';
      if (isNew && data.animalSteril) recap += '✂️ Stérilisé(e) : ' + escapeHtml(data.animalSteril) + '<br>';
      if (isNew && data.antecedents)  recap += '📋 ' + escapeHtml(data.antecedents) + '<br>';
      recap += '🗓️ ' + escapeHtml(data.date) + '<br>';
      recap += '💬 ' + escapeHtml(data.motive);
      appendMsg('bot', recap);
      scrollBottom();
    }, 700);

    setTimeout(() => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        const mailto = buildMailto(data);

        const confirmMsg = bookingType === 'new'
          ? '✅ <strong>Parfait, c\'est noté !</strong><br><br>Le Dr PAYRIERE va vous recontacter au <strong>' + escapeHtml(data.phone) + '</strong> pour confirmer votre créneau.<br><br>On complètera votre dossier directement lors de votre première visite 😊 À très vite !<br><br>Vous pouvez aussi nous envoyer un email :'
          : '✅ <strong>Demande envoyée !</strong><br><br>Le Dr PAYRIERE vous contactera au <strong>' + escapeHtml(data.phone) + '</strong> pour confirmer. À bientôt ! 😊<br><br>Ou appelez directement :';
        appendMsg('bot', confirmMsg);

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
    booking      = false;
    bookingStep  = 0;
    bookingType  = '';
    bookingData  = {};
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
      appendMsg('bot', `Bonjour ! Moi c'est Puce 🐾 Je suis l'assistante du <strong>Cabinet Dr PAYRIERE</strong> à Saint-Paul-sur-Save.<br><br>Posez-moi votre question, je fais de mon mieux pour vous aider — et si je ne sais pas, je vous oriente vers le bon numéro !`);
      setChips(['Horaires', 'Prendre RDV', 'Mon animal est malade', 'Urgences']);
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
