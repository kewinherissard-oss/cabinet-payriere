/* ══════════════════════════════════════════════
   Google Apps Script — Cabinet Dr PAYRIERE
   Webhook de prise de rendez-vous automatique

   DÉPLOIEMENT (une seule fois) :
   1. Aller sur https://script.google.com
      (connecté avec mpayriere@gmail.com)
   2. Nouveau projet → coller ce fichier entier
   3. Déployer → Nouveau déploiement
      - Type : Application Web
      - Exécuter en tant que : Moi
      - Accès : Tout le monde
   4. Copier l'URL du déploiement
   5. Dans chatbot.js, remplacer REMPLACER_PAR_URL_APPS_SCRIPT
      par l'URL copiée
   ══════════════════════════════════════════════ */

const CALENDAR_ID = 'primary';
const VET_EMAIL   = 'mpayriere@gmail.com';
const CABINET     = 'Cabinet Vétérinaire Dr PAYRIERE';
const TEL_CABINET = '05 61 49 27 99';
const ADR_CABINET = '3 impasse des Coquelicots, Saint-Paul-sur-Save (31530)';

function doGet(e) {
  try {
    const p = e.parameter;

    const name   = p.name   || 'Inconnu';
    const phone  = p.phone  || 'Non renseigné';
    const email  = p.email  || '';
    const date   = p.date   || 'À confirmer';
    const animal = p.animal || 'Non précisé';
    const motive = p.motive || 'Non précisé';

    /* ── 1. Créer l'événement Google Calendar ── */
    const title = '🐾 RDV - ' + animal + ' - ' + name;
    const desc  = [
      'Propriétaire : ' + name,
      'Téléphone    : ' + phone,
      'Email        : ' + (email || 'Non renseigné'),
      'Animal       : ' + animal,
      'Motif        : ' + motive,
      'Créneau      : ' + date,
      '',
      '— Demande reçue via le site internet —',
    ].join('\n');

    const eventDate = parseDate(date) || getNextWorkday();
    const isMatin   = date.toLowerCase().indexOf('matin') !== -1;
    eventDate.setHours(isMatin ? 10 : 16, 0, 0, 0);
    const endDate = new Date(eventDate.getTime() + 30 * 60000);

    CalendarApp.getCalendarById(CALENDAR_ID).createEvent(title, eventDate, endDate, {
      description:        desc,
      guestsCanSeeGuests: false,
    });

    /* ── 2. Email de notification au cabinet ── */
    GmailApp.sendEmail(
      VET_EMAIL,
      '📅 Nouvelle demande de RDV — ' + name + ' — ' + animal,
      [
        'Bonjour,',
        '',
        'Nouvelle demande de rendez-vous reçue via le site internet.',
        '',
        'Propriétaire : ' + name,
        'Téléphone    : ' + phone,
        'Email        : ' + (email || 'Non renseigné'),
        'Animal       : ' + animal,
        'Motif        : ' + motive,
        'Créneau      : ' + date,
        '',
        '✅ Un événement a été créé automatiquement dans votre Google Calendar.',
        '',
        'Bonne journée !',
      ].join('\n')
    );

    /* ── 3. Email de confirmation au client ── */
    if (email && email.indexOf('@') !== -1) {
      GmailApp.sendEmail(
        email,
        '✅ Demande de RDV reçue — ' + CABINET,
        [
          'Bonjour ' + name + ',',
          '',
          'Nous avons bien reçu votre demande de rendez-vous.',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          'Animal       : ' + animal,
          'Motif        : ' + motive,
          'Créneau      : ' + date,
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          'Le Dr PAYRIERE vous contactera au ' + phone + ' pour confirmer votre créneau.',
          '',
          '---',
          CABINET,
          ADR_CABINET,
          '📞 ' + TEL_CABINET,
          '🌐 https://kewinherissard-oss.github.io/cabinet-payriere/',
        ].join('\n')
      );
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ── Parseur de créneau ── */
function parseDate(str) {
  if (!str || str === 'Je ne sais pas encore' || str === 'À confirmer') return null;
  const norm   = str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  const dayMap = { lundi: 1, mercredi: 3, vendredi: 5 };
  const dayKey = Object.keys(dayMap).find(d => norm.indexOf(d) !== -1);
  if (!dayKey) return null;
  const target = dayMap[dayKey];
  const now    = new Date();
  const diff   = ((target - now.getDay() + 7) % 7) || 7;
  const d      = new Date(now);
  d.setDate(now.getDate() + diff);
  return d;
}

/* ── Prochain jour ouvré (fallback) ── */
function getNextWorkday() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}
