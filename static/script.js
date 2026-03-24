// ── Slider live update ──
const hydSlider = document.getElementById('hydration');
const hydVal    = document.getElementById('hydration-val');
const hydHint   = document.getElementById('hydration-hint');
const sttSlider = document.getElementById('starter_pct');
const sttVal    = document.getElementById('starter-val');

const hydrationHints = {
  55: 'stiff dough', 60: 'dense crumb', 65: 'tight crumb',
  70: 'classic country loaf', 75: 'moderately open crumb',
  80: 'open, chewy crumb', 85: 'very open crumb',
  90: 'extremely wet — advanced', 95: 'ciabatta territory', 100: 'liquid levain'
};

function getHint(v) {
  const keys = Object.keys(hydrationHints).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) { if (k <= v) closest = k; }
  return hydrationHints[closest];
}

hydSlider.addEventListener('input', () => {
  hydVal.textContent = hydSlider.value + '%';
  hydHint.textContent = getHint(parseInt(hydSlider.value));
});

sttSlider.addEventListener('input', () => {
  sttVal.textContent = sttSlider.value + '%';
});

// ── Scale toggle ──
document.getElementById('scale-toggle').addEventListener('change', function () {
  const fields = document.querySelectorAll('.scale-fields');
  fields.forEach(f => f.classList.toggle('active', this.checked));
  document.getElementById('flour').closest('.field').style.opacity = this.checked ? '0.45' : '1';
  document.getElementById('flour').disabled = this.checked;
});

// ── Calculate ──
async function calculate() {
  const btn    = document.getElementById('calc-btn');
  const errBox = document.getElementById('error-box');
  errBox.style.display = 'none';

  btn.innerHTML = '<span class="spinner"></span>Calculating…';
  btn.disabled  = true;

  const useScale = document.getElementById('scale-toggle').checked;
  const payload  = {
    flour:       parseFloat(document.getElementById('flour').value) || 500,
    hydration:   parseFloat(document.getElementById('hydration').value),
    starter_pct: parseFloat(document.getElementById('starter_pct').value),
    loaf_count:  useScale ? parseInt(document.getElementById('loaf_count').value) : 1,
    loaf_size:   useScale ? parseFloat(document.getElementById('loaf_size').value) : 0,
  };

  try {
    const res  = await fetch('/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) { showError(data.error || 'Calculation failed.'); return; }

    // Populate results
    document.getElementById('r-total').textContent    = data.total_dough;
    document.getElementById('r-flour').textContent    = data.flour;
    document.getElementById('r-water').textContent    = data.water;
    document.getElementById('r-starter').textContent  = data.starter;
    document.getElementById('r-salt').textContent     = data.salt;
    document.getElementById('r-per-loaf').textContent = data.per_loaf;

    document.getElementById('r-starter-flour').textContent    = data.starter_flour + 'g';
    document.getElementById('r-starter-water').textContent    = data.starter_water + 'g';
    document.getElementById('r-actual-hydration').textContent = data.actual_hydration + '%';

    document.getElementById('bp-water').textContent   = data.bp_water + '%';
    document.getElementById('bp-starter').textContent = data.bp_starter + '%';

    const loafItem = document.getElementById('r-loaf-item');
    loafItem.querySelector('.result-label').textContent =
      data.loaves > 1 ? `Per Loaf (÷${data.loaves})` : 'Per Loaf';

    // Show results with animation
    const resultsCard = document.getElementById('results');
    resultsCard.style.display    = 'block';
    resultsCard.style.animation  = 'none';
    resultsCard.offsetHeight;                          // force reflow
    resultsCard.style.animation  = 'fadeUp 0.5s ease both';
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (e) {
    showError('Network error. Is the Flask server running?');
  } finally {
    btn.innerHTML = 'Calculate Recipe';
    btn.disabled  = false;
  }
}

function showError(msg) {
  const box = document.getElementById('error-box');
  box.textContent  = '⚠ ' + msg;
  box.style.display = 'block';
}

// Auto-calculate on load
window.addEventListener('load', calculate);