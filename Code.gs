var CALENDAR_ID = 'primary';
var VET_EMAIL   = 'mpayriere.vet@gmail.com';
var CABINET     = 'Cabinet Veterinaire Dr PAYRIERE';
var TEL_CABINET = '05 61 49 27 99';
var ADR_CABINET = '3 impasse des Coquelicots, Saint-Paul-sur-Save (31530)';

/* ── Point d entree ── */
function doGet(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    if (p.action === 'slots') return getAvailableSlots();
    return createRDV(p);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

/* ════ LECTURE DES CRÉNEAUX DISPONIBLES ════ */
function getAvailableSlots() {
  try {
    var cal   = CalendarApp.getCalendarById(CALENDAR_ID);
    var now   = new Date();
    var ahead = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    /* Récupère tous les évènements existants sur les 28 prochains jours */
    var events = cal.getEvents(now, ahead);
    var busy = events.map(function(ev) {
      return { s: ev.getStartTime().getTime(), e: ev.getEndTime().getTime() };
    });

    var openDays = [1, 3, 5]; /* Lundi=1, Mercredi=3, Vendredi=5 */
    var allTimes = [
      '09:30','10:00','10:30','11:00','11:30','12:00',
      '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30'
    ];

    var result = [];
    var d      = new Date(now);
    var count  = 0;
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);

    while (count < 15) {
      if (openDays.indexOf(d.getDay()) !== -1) {
        var freeSlots = [];
        allTimes.forEach(function(t) {
          var parts = t.split(':');
          var start = new Date(d.getTime());
          start.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
          var end   = new Date(start.getTime() + 30 * 60000);
          if (start.getTime() <= now.getTime()) return;
          var taken = busy.some(function(b) {
            return start.getTime() < b.e && end.getTime() > b.s;
          });
          if (!taken) freeSlots.push(t);
        });
        if (freeSlots.length > 0) {
          result.push({
            iso:   Utilities.formatDate(d, 'Europe/Paris', 'yyyy-MM-dd'),
            slots: freeSlots
          });
          count++;
        }
      }
      d.setDate(d.getDate() + 1);
    }

    return jsonResponse({ status: 'ok', days: result });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

/* ════ CRÉATION D UN RDV ════ */
function createRDV(p) {
  var name   = p.name   || 'Inconnu';
  var phone  = p.phone  || 'Non renseigne';
  var email  = p.email  || '';
  var date   = p.date   || 'A confirmer';
  var animal = p.animal || 'Non precise';
  var motive = p.motive || 'Non precise';
  var type   = p.type   || '';

  /* Parsage de la date — format ISO prioritaire (vient du slot picker) */
  var eventStart;
  if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
    eventStart = new Date(date);
  } else {
    eventStart = parseDate(date) || getNextWorkday();
    var isMatin = date.toLowerCase().indexOf('matin') !== -1;
    eventStart.setHours(isMatin ? 10 : 16, 0, 0, 0);
  }
  var eventEnd = new Date(eventStart.getTime() + 30 * 60000);

  var title = 'RDV - ' + animal + ' - ' + name;
  var desc  = [
    type ? '--- ' + type + ' ---' : '',
    'Proprietaire : ' + name,
    'Telephone    : ' + phone,
    'Email        : ' + (email || 'Non renseigne'),
    'Animal       : ' + animal,
    'Motif        : ' + motive,
    'Creneau      : ' + date,
    '',
    '-- Demande recue via le site internet --'
  ].filter(Boolean).join('\n');

  CalendarApp.getCalendarById(CALENDAR_ID).createEvent(title, eventStart, eventEnd, {
    description: desc,
    guestsCanSeeGuests: false
  });

  /* Email au Dr PAYRIERE */
  GmailApp.sendEmail(
    VET_EMAIL,
    (type ? '[' + type + '] ' : '') + 'Nouveau RDV - ' + name + ' - ' + animal,
    'Bonjour,\n\nNouveau RDV via le site internet.\n\n' + desc + '\n\nBonne journee !'
  );

  /* Email de confirmation au client */
  if (email && email.indexOf('@') !== -1) {
    GmailApp.sendEmail(
      email,
      'Votre demande de RDV - ' + CABINET,
      'Bonjour ' + name + ',\n\n'
      + 'Votre demande de rendez-vous a bien ete recue.\n\n'
      + 'Animal  : ' + animal + '\n'
      + 'Motif   : ' + motive + '\n'
      + 'Creneau : ' + date   + '\n\n'
      + 'Le Dr PAYRIERE vous contactera au ' + phone + ' pour confirmer.\n\n'
      + CABINET + '\n' + ADR_CABINET + '\n' + TEL_CABINET + '\n'
      + 'https://kewinherissard-oss.github.io/cabinet-payriere/'
    );
  }

  return jsonResponse({ status: 'ok' });
}

/* ── Helpers ── */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseDate(str) {
  if (!str) return null;
  var s      = str.toLowerCase();
  var dayMap = { lundi: 1, mercredi: 3, vendredi: 5 };
  for (var k in dayMap) {
    if (s.indexOf(k) !== -1) {
      var target = dayMap[k];
      var now    = new Date();
      var diff   = ((target - now.getDay() + 7) % 7) || 7;
      var d      = new Date(now);
      d.setDate(now.getDate() + diff);
      return d;
    }
  }
  return null;
}

function getNextWorkday() {
  var d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}
