// Render calculator form
function renderCalculatorForm() {
  const section = document.getElementById('calculator-section');
  section.innerHTML = `
    <form id="calc-form" autocomplete="off">
      <div class="form-group">
        <label for="principal">Principal Amount (₱)</label>
        <input type="number" id="principal" name="principal" min="0" step="100" required />
      </div>
      <div class="form-group">
        <label for="rate">Annual Interest Rate (%)</label>
        <input type="number" id="rate" name="rate" min="0" step="0.01" required />
      </div>
      <div class="form-group">
        <label for="time">Time Period (Years)</label>
        <input type="number" id="time" name="time" min="1" step="1" required />
      </div>
      <div class="form-group">
        <label for="frequency">Compounding Frequency</label>
        <select id="frequency" name="frequency" required>
          <option value="annually">Annually</option>
          <option value="semi-annually">Semi-Annually</option>
          <option value="quarterly">Quarterly</option>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="daily">Daily</option>
          <option value="continuously">Continuously</option>
        </select>
      </div>
      <div class="form-group form-row">
        <input type="checkbox" id="include-date" name="include-date" />
        <label for="include-date" style="margin-left: 0.5em;">Include Start Date</label>
      </div>
      <div class="form-group" id="start-date-group" style="display:none;">
        <label for="start-date">Start Date</label>
        <input type="date" id="start-date" name="start-date" />
      </div>
      <div class="form-actions">
        <button type="submit">Calculate</button>
        <button type="button" id="reset-btn">Reset</button>
      </div>
      <div id="form-error" class="form-error"></div>
    </form>
  `;

  // Show/hide start date
  const includeDate = document.getElementById('include-date');
  const startDateGroup = document.getElementById('start-date-group');
  includeDate.addEventListener('change', function() {
    startDateGroup.style.display = this.checked ? '' : 'none';
  });

  // Reset button
  document.getElementById('reset-btn').addEventListener('click', function() {
    document.getElementById('calc-form').reset();
    startDateGroup.style.display = 'none';
    document.getElementById('form-error').textContent = '';
  });

  // Form submit handler (logic to be added later)
  document.getElementById('calc-form').addEventListener('submit', function(e) {
    e.preventDefault();
    document.getElementById('form-error').textContent = '';
    // Logic for calculation will be added in the next step
  });
}

// Add some basic styles for the form
document.addEventListener('DOMContentLoaded', function() {
  renderCalculatorForm();
  const style = document.createElement('style');
  style.textContent = `
    #calculator-section form {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .form-row {
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
    }
    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    }
    #calculator-section input, #calculator-section select {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 1rem;
    }
    #calculator-section button[type="submit"] {
      background: #0077ff;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 0.6rem 1.2rem;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    #calculator-section button[type="submit"]:hover {
      background: #005fcc;
    }
    #reset-btn {
      background: #eee;
      color: #333;
      border: none;
      border-radius: 6px;
      padding: 0.6rem 1.2rem;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    #reset-btn:hover {
      background: #ddd;
    }
    .form-error {
      color: #d32f2f;
      font-size: 0.98rem;
      min-height: 1.2em;
      margin-top: 0.2em;
    }
  `;
  document.head.appendChild(style);
});

// --- Calculation Logic ---
function getFrequencyNumber(frequency) {
  switch (frequency) {
    case 'annually': return 1;
    case 'semi-annually': return 2;
    case 'quarterly': return 4;
    case 'monthly': return 12;
    case 'weekly': return 52;
    case 'daily': return 365;
    default: return 1;
  }
}

function calculateCompoundInterest(params) {
  let { principal, rate, time, frequency } = params;
  let finalAmount, totalInterest, yearlyBreakdown = [];
  rate = rate / 100;
  if (frequency === 'continuously') {
    finalAmount = principal * Math.exp(rate * time);
  } else {
    const n = getFrequencyNumber(frequency);
    finalAmount = principal * Math.pow(1 + rate / n, n * time);
  }
  totalInterest = finalAmount - principal;

  // Yearly breakdown
  for (let year = 1; year <= time; year++) {
    let amount;
    if (frequency === 'continuously') {
      amount = principal * Math.exp(rate * year);
    } else {
      const n = getFrequencyNumber(frequency);
      amount = principal * Math.pow(1 + rate / n, n * year);
    }
    yearlyBreakdown.push({
      year,
      amount,
      interestEarned: amount - principal
    });
  }
  return { finalAmount, totalInterest, yearlyBreakdown };
}

function formatCurrency(num) {
  return '₱' + num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function getFormula(params) {
  const { frequency } = params;
  if (frequency === 'continuously') {
    return 'A = P × e^(rt)';
  }
  return 'A = P(1 + r/n)^(nt)';
}

// --- Results Display ---
function renderResults(params, result) {
  const section = document.getElementById('results-section');
  if (!params || !result) {
    section.innerHTML = '';
    return;
  }
  section.innerHTML = `
    <div class="results-tabs">
      <button class="tab-btn active" data-tab="summary">Summary</button>
      <button class="tab-btn" data-tab="breakdown">Year by Year</button>
      <button class="tab-btn" data-tab="formula">Formula</button>
    </div>
    <div class="tab-content" id="tab-summary">
      <div class="summary-grid">
        <div><span>Principal Amount</span><strong>${formatCurrency(params.principal)}</strong></div>
        <div><span>Final Amount</span><strong>${formatCurrency(result.finalAmount)}</strong></div>
        <div><span>Total Interest Earned</span><strong>${formatCurrency(result.totalInterest)}</strong></div>
        <div><span>Interest to Principal Ratio</span><strong>${((result.totalInterest / params.principal) * 100).toFixed(2)}%</strong></div>
      </div>
    </div>
    <div class="tab-content" id="tab-breakdown" style="display:none;">
      <div class="breakdown-table-wrap">
        <table class="breakdown-table">
          <thead><tr><th>Year</th><th>Balance</th><th>Interest Earned</th></tr></thead>
          <tbody>
            ${result.yearlyBreakdown.map(row => `
              <tr><td>${row.year}</td><td>${formatCurrency(row.amount)}</td><td>${formatCurrency(row.interestEarned)}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="tab-content" id="tab-formula" style="display:none;">
      <div class="formula-block">
        <div><strong>Formula Used:</strong></div>
        <div class="formula">${getFormula(params)}</div>
        <div style="margin-top:1em;">
          <div>A = Final amount</div>
          <div>P = Principal (${formatCurrency(params.principal)})</div>
          <div>r = Annual interest rate (${params.rate}%)</div>
          <div>t = Time period (${params.time} years)</div>
          ${params.frequency !== 'continuously' ? '<div>n = Number of times compounded per year</div>' : ''}
        </div>
      </div>
    </div>
  `;
  // Tab switching
  section.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = function() {
      section.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      section.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
      btn.classList.add('active');
      section.querySelector(`#tab-${btn.dataset.tab}`).style.display = '';
    };
  });
}

// --- History Section ---
function getHistory() {
  return JSON.parse(localStorage.getItem('calcHistory') || '[]');
}
function saveToHistory(entry) {
  let history = getHistory();
  history.unshift(entry);
  if (history.length > 20) history = history.slice(0, 20);
  localStorage.setItem('calcHistory', JSON.stringify(history));
}
function deleteHistoryItem(idx) {
  let history = getHistory();
  history.splice(idx, 1);
  localStorage.setItem('calcHistory', JSON.stringify(history));
}
function clearHistory() {
  localStorage.removeItem('calcHistory');
}
function renderHistory(onSelect) {
  const section = document.getElementById('history-section');
  const history = getHistory();
  if (!history.length) {
    section.innerHTML = '<div class="history-empty">No calculation history yet.</div>';
    return;
  }
  section.innerHTML = `
    <div class="history-header">
      <span>Calculation History</span>
      <button id="clear-history">Clear All</button>
    </div>
    <ul class="history-list">
      ${history.map((item, idx) => `
        <li>
          <div class="history-main" data-idx="${idx}">
            <span><strong>${formatCurrency(item.principal)}</strong> for ${item.time} yrs @ ${item.rate}% (${item.frequency})</span>
            <span class="history-final">Final: ${formatCurrency(item.finalAmount)}</span>
          </div>
          <button class="delete-history" data-idx="${idx}" title="Delete">🗑️</button>
        </li>
      `).join('')}
    </ul>
  `;
  // Select from history
  section.querySelectorAll('.history-main').forEach(div => {
    div.onclick = () => {
      const idx = +div.dataset.idx;
      onSelect(history[idx]);
    };
  });
  // Delete item
  section.querySelectorAll('.delete-history').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteHistoryItem(+btn.dataset.idx);
      renderHistory(onSelect);
    };
  });
  // Clear all
  section.querySelector('#clear-history').onclick = () => {
    if (confirm('Clear all history?')) {
      clearHistory();
      renderHistory(onSelect);
    }
  };
}

// --- Integrate with Form ---
document.addEventListener('DOMContentLoaded', function() {
  renderCalculatorForm();
  let lastParams = null;
  let lastResult = null;

  function handleCalculation(params) {
    const result = calculateCompoundInterest(params);
    renderResults(params, result);
    // Save to history
    saveToHistory({ ...params, ...result });
    renderHistory(historySelectHandler);
    lastParams = params;
    lastResult = result;
  }

  function historySelectHandler(item) {
    // Repopulate form
    document.getElementById('principal').value = item.principal;
    document.getElementById('rate').value = item.rate;
    document.getElementById('time').value = item.time;
    document.getElementById('frequency').value = item.frequency;
    if (item.startDate) {
      document.getElementById('include-date').checked = true;
      document.getElementById('start-date-group').style.display = '';
      document.getElementById('start-date').value = item.startDate;
    } else {
      document.getElementById('include-date').checked = false;
      document.getElementById('start-date-group').style.display = 'none';
      document.getElementById('start-date').value = '';
    }
    // Recalculate
    handleCalculation({
      principal: +item.principal,
      rate: +item.rate,
      time: +item.time,
      frequency: item.frequency,
      startDate: item.startDate || null
    });
  }

  // Attach form submit logic
  document.getElementById('calc-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const principal = +document.getElementById('principal').value;
    const rate = +document.getElementById('rate').value;
    const time = +document.getElementById('time').value;
    const frequency = document.getElementById('frequency').value;
    const includeDate = document.getElementById('include-date').checked;
    const startDate = includeDate ? document.getElementById('start-date').value : null;
    // Validation
    if (principal <= 0) {
      document.getElementById('form-error').textContent = 'Principal must be greater than 0.';
      return;
    }
    if (rate <= 0) {
      document.getElementById('form-error').textContent = 'Interest rate must be greater than 0.';
      return;
    }
    if (time <= 0 || !Number.isInteger(time)) {
      document.getElementById('form-error').textContent = 'Time period must be a positive integer.';
      return;
    }
    document.getElementById('form-error').textContent = '';
    handleCalculation({ principal, rate, time, frequency, startDate });
  });

  // Initial render
  renderResults(null, null);
  renderHistory(historySelectHandler);
});

// --- Extra styles for results and history ---
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    .results-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .tab-btn { background: #eee; border: none; border-radius: 6px 6px 0 0; padding: 0.5rem 1.2rem; cursor: pointer; font-size: 1rem; }
    .tab-btn.active { background: #0077ff; color: #fff; }
    .tab-content { background: #f9f9f9; border-radius: 0 0 10px 10px; padding: 1rem; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
    .summary-grid div { background: #fff; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 0.3em; }
    .summary-grid span { color: #888; font-size: 0.98em; }
    .summary-grid strong { font-size: 1.2em; }
    .breakdown-table-wrap { overflow-x: auto; }
    .breakdown-table { width: 100%; border-collapse: collapse; margin-top: 0.5em; }
    .breakdown-table th, .breakdown-table td { padding: 0.5em 0.7em; border-bottom: 1px solid #eee; text-align: right; }
    .breakdown-table th { background: #f0f4fa; color: #333; }
    .breakdown-table td:first-child, .breakdown-table th:first-child { text-align: left; }
    .formula-block { font-size: 1.1em; }
    .formula { font-family: monospace; font-size: 1.2em; margin: 0.7em 0; }
    .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7em; }
    .history-header button { background: #eee; border: none; border-radius: 6px; padding: 0.4em 1em; cursor: pointer; }
    .history-header button:hover { background: #d32f2f; color: #fff; }
    .history-list { list-style: none; padding: 0; margin: 0; }
    .history-list li { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; margin-bottom: 0.5em; box-shadow: 0 1px 4px rgba(0,0,0,0.03); padding: 0.7em 1em; }
    .history-main { cursor: pointer; display: flex; flex-direction: column; gap: 0.2em; }
    .history-final { color: #0077ff; font-weight: bold; font-size: 1em; }
    .delete-history { background: none; border: none; color: #d32f2f; font-size: 1.2em; cursor: pointer; }
    .delete-history:hover { color: #fff; background: #d32f2f; border-radius: 50%; }
    .history-empty { color: #888; text-align: center; padding: 1.5em 0; }
    @media (max-width: 600px) { .summary-grid { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
});
