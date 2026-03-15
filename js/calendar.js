/* Calendar View Logic */

let currentMonth = new Date();

function renderCalendar(state) {
  const container = document.getElementById('view-calendar');
  const trades = state.trades;
  const journals = state.journalEntries;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  // Calculate daily P&L Map
  const dailyPnL = {};
  trades.forEach(t => {
    // Ignore time for grouping
    const dateStr = t.date.split('T')[0];
    if (!dailyPnL[dateStr]) dailyPnL[dateStr] = 0;
    dailyPnL[dateStr] += t.pnl;
  });

  // Journals map
  const journalMap = {};
  journals.forEach(j => {
    const dateStr = j.date.split('T')[0];
    journalMap[dateStr] = true;
  });

  // Calendar calculations
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `
    <div class="calendar-header">
      <h2>Calendar Overview</h2>
      <div class="calendar-nav">
        <button id="btn-prev-month"><i class="ph ph-caret-left"></i></button>
        <span style="display:inline-block; width: 150px; text-align:center; font-weight:600;">${monthName} ${year}</span>
        <button id="btn-next-month"><i class="ph ph-caret-right"></i></button>
      </div>
    </div>
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
  `;

  // Empty slots
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const pnl = dailyPnL[dateStr] || 0;
    const hasJournal = journalMap[dateStr];
    
    let dayClass = '';
    let pnlDisplay = '';
    
    if (pnl > 0) {
      dayClass = 'day-success';
      pnlDisplay = `+${pnl.toFixed(2)}`;
    } else if (pnl < 0) {
      dayClass = 'day-danger';
      pnlDisplay = pnl.toFixed(2);
    }

    const dotHtml = hasJournal ? `<div class="journal-dot" title="Journal logged"></div>` : '';

    html += `
      <div class="calendar-day ${dayClass}">
        ${dotHtml}
        <span class="date">${d}</span>
        ${pnl !== 0 ? `<div class="day-pnl ${pnl > 0 ? 'text-success' : 'text-danger'}">$${pnlDisplay}</div>` : ''}
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;

  // Bind Events
  document.getElementById('btn-prev-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar(window.appStore.state);
  });
  document.getElementById('btn-next-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar(window.appStore.state);
  });
}

window.appStore.subscribe(state => {
  renderCalendar(state);
});

document.addEventListener('DOMContentLoaded', () => {
  renderCalendar(window.appStore.state);
});
