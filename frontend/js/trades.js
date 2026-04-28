/* 
  Trades view logic
*/

function renderTrades(state) {
  const container = document.getElementById('view-trades');
  const trades = state.trades;

  let html = `
    <div class="trades-header">
      <h2>Trade History</h2>
      <p class="text-secondary">${trades.length} trades logged</p>
    </div>
    <div class="table-container glass-panel">
      <table class="trades-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>Type</th>
            <th>Shares</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>R/R</th>
            <th>P&L</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (trades.length === 0) {
    html += `<tr><td colspan="8" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No trades logged yet. Click 'New Trade' to start.</td></tr>`;
  } else {
    trades.forEach(t => {
      const typeClass = t.type === 'buy' ? 'bg-success text-success' : 'bg-danger text-danger';
      const pnlClass = t.pnl >= 0 ? 'text-success' : 'text-danger';
      const rrText = t.rr ? `1:${t.rr}` : '-';

      html += `
        <tr>
          <td>${t.date}</td>
          <td><strong>${t.symbol}</strong></td>
          <td><span class="badge ${typeClass}">${t.type.toUpperCase()}</span></td>
          <td>${t.shares}</td>
          <td>$${t.entry}</td>
          <td>$${t.exit}</td>
          <td>${rrText}</td>
          <td class="${pnlClass}"><strong>$${t.pnl}</strong></td>
        </tr>
      `;
    });
  }

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

// Subscribe
window.appStore.subscribe(state => {
  renderTrades(state);
});

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderTrades(window.appStore.state);
});
