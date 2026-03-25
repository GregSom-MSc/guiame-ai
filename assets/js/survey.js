/* ============================================================
   survey.js — Guíame.ai · Star rating survey + footer badge
   Requires: Supabase project (free tier)
   ============================================================
      ============================================================ */

const SUPABASE_URL = 'https://rtbeinelcbnbaqwmoavp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O-UR8sgGojHFfAMHHg40Xg_DDEw9FB3';

/* ── Vote deduplication ──────────────────────────────────────
   We store a timestamp in localStorage after a successful vote.
   The user cannot vote again until VOTE_COOLDOWN_DAYS have passed.
   This covers ~95% of cases honestly. Someone who really wants
   to spam can clear localStorage — but that's edge-case abuse
   for a tour guide, not worth extra infrastructure.
   ──────────────────────────────────────────────────────────── */
const VOTE_KEY            = 'guiame_voted_at';
const VOTE_COOLDOWN_DAYS  = 30;

function hasVotedRecently() {
  try {
    const ts = localStorage.getItem(VOTE_KEY);
    if (!ts) return false;
    const daysSince = (Date.now() - parseInt(ts, 10)) / (1000 * 60 * 60 * 24);
    return daysSince < VOTE_COOLDOWN_DAYS;
  } catch (_) {
    return false; // private browsing / storage blocked — allow vote
  }
}

function markVoted() {
  try { localStorage.setItem(VOTE_KEY, String(Date.now())); } catch (_) {}
}

/* ── Internal state ── */
let selectedStars = 0;

const HINTS = [
  '',
  'No fue lo que esperaba',
  'Estuvo bien',
  'Buena experiencia',
  '¡Muy buena experiencia!',
  '¡Increíble! Lo recomendaré 🏴󠁧󠁢󠁳󠁣󠁴󠁿'
];

/* ── Star widget interaction ── */
const starBtns  = document.querySelectorAll('.s-star');
const hintEl    = document.getElementById('surveyHint');
const submitBtn = document.getElementById('surveySubmit');

/* Show already-voted state immediately if cooldown is active */
function showAlreadyVoted() {
  const widget = document.getElementById('surveyWidget');
  if (!widget) return;
  widget.classList.add('submitted');
  hintEl.textContent = '¡Ya nos diste tu opinión! Gracias 🙌';
  submitBtn.style.display = 'none';
  const thanks = document.getElementById('surveyThanks');
  thanks.textContent = '✓ Ya enviaste tu valoración. ¡Gracias por confiar en mí!';
  thanks.style.display = 'flex';
  starBtns.forEach(b => b.disabled = true);
}

if (hasVotedRecently()) showAlreadyVoted();

starBtns.forEach(btn => {
  const val = +btn.dataset.val;

  btn.addEventListener('mouseenter', () => paintStars(val, false));
  btn.addEventListener('mouseleave', () => paintStars(selectedStars, false));

  btn.addEventListener('click', () => {
    selectedStars = val;
    paintStars(selectedStars, true);
    hintEl.textContent = HINTS[selectedStars];
    submitBtn.disabled = false;
    submitBtn.classList.add('ready');
    if (window.clarity) clarity('event', 'survey_star_selected', { stars: selectedStars });
  });

  /* Touch devices — touchstart feels snappier than click */
  btn.addEventListener('touchstart', () => {
    selectedStars = val;
    paintStars(selectedStars, true);
    hintEl.textContent = HINTS[selectedStars];
    submitBtn.disabled = false;
    submitBtn.classList.add('ready');
  }, { passive: true });
});

function paintStars(upTo, isSelected) {
  starBtns.forEach(b => {
    const v = +b.dataset.val;
    b.classList.toggle('s-star--filled',   v <= upTo);
    b.classList.toggle('s-star--selected', isSelected && v <= upTo);
  });
  if (!isSelected && upTo === 0) {
    hintEl.textContent = 'Toca una estrella para valorar';
  }
}

/* ── Submit rating to Supabase ── */
async function submitRating() {
  if (!selectedStars) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ratings`, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify({ stars: selectedStars })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    /* Lock this device for VOTE_COOLDOWN_DAYS */
    markVoted();

    /* Show thank-you state */
    document.getElementById('surveyWidget').classList.add('submitted');
    document.getElementById('surveyThanks').style.display = 'flex';
    submitBtn.style.display = 'none';

    if (window.clarity) clarity('event', 'survey_submitted', { stars: selectedStars });

    /* Refresh badge immediately with new data */
    await loadBadge();

  } catch (err) {
    console.error('Survey error:', err);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Reintentar';
  }
}

/* ── Load aggregate rating → footer badge + Schema.org ── */
async function loadBadge() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ratings?select=stars`,
      {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.length) {
      document.getElementById('qbScore').textContent = 'Sé el primero en valorar';
      return;
    }

    const avg   = data.reduce((s, r) => s + r.stars, 0) / data.length;
    const count = data.length;
    const avgStr = avg.toFixed(1);

    /* Render star icons in badge */
    renderBadgeStars(avg);

    document.getElementById('qbScore').textContent = `${avgStr} / 5`;
    document.getElementById('qbCount').textContent = `(${count.toLocaleString()} opini${count === 1 ? 'ón' : 'ones'})`;

    /* Update Schema.org aggregateRating dynamically */
    const schema = document.getElementById('schema-jsonld');
    if (schema) {
      try {
        const json = JSON.parse(schema.textContent);
        json.aggregateRating.ratingValue = avgStr;
        json.aggregateRating.reviewCount = String(count);
        schema.textContent = JSON.stringify(json, null, 2);
      } catch (_) {}
    }

  } catch (err) {
    console.warn('Badge load error:', err);
    document.getElementById('qbScore').textContent = '—';
  }
}

function renderBadgeStars(avg) {
  const el = document.getElementById('qbStars');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(avg);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.classList.add('qb-star-icon');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    path.setAttribute('fill', filled ? '#FF9500' : 'rgba(255,255,255,0.2)');
    svg.appendChild(path);
    el.appendChild(svg);
  }
}

/* ── Init on page load ── */
loadBadge();
