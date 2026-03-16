/* 
  Dashboard logic
*/

let dashboardChartInstance = null;
let selectedSymbols = new Set();
let knownSymbols = new Set();

// Generate distinct colors based on string hash for consistent coloring
function getColorForSymbol(symbol, alpha = 1) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsla(${hue}, 70%, 60%, ${alpha})`;
}

function renderDashboard(state) {
  const container = document.getElementById('view-dashboard');
  if (!container) return;
  const trades = state.trades;

  const uniqueSymbols = [...new Set(trades.map(t => (t.symbol ? t.symbol.toUpperCase() : 'UNKNOWN')))].sort();
  
  uniqueSymbols.forEach(sym => {
    if (!knownSymbols.has(sym)) {
      knownSymbols.add(sym);
      selectedSymbols.add(sym);
    }
  });

  const filteredTrades = trades.filter(t => selectedSymbols.has(t.symbol ? t.symbol.toUpperCase() : 'UNKNOWN'));

  // Calculate Stats
  let totalPnl = 0;
  let wins = 0;
  let losses = 0;
  let totalRisk = 0;
  let totalReward = 0;
  let rrCount = 0;

  filteredTrades.forEach(t => {
    totalPnl += t.pnl;
    if (t.pnl > 0) wins++;
    else if (t.pnl < 0) losses++;

    if (t.rr) {
      totalRisk += 1; // Normalized to 1 Risk
      totalReward += t.rr;
      rrCount++;
    }
  });

  const winRate = filteredTrades.length > 0 ? ((wins / filteredTrades.length) * 100).toFixed(1) : 0;
  const avgRR = rrCount > 0 ? (totalReward / rrCount).toFixed(2) : '0.00';

  const pnlClass = totalPnl >= 0 ? 'text-success' : 'text-danger';
  const pnlPrefix = totalPnl >= 0 ? '+' : '';

  const filterHtml = uniqueSymbols.length > 0 ? `
    <div class="symbol-filters">
      ${uniqueSymbols.map(sym => `
        <label class="symbol-filter-label ${selectedSymbols.has(sym) ? 'selected' : ''}" data-symbol="${sym}">
          <input type="checkbox" value="${sym}" class="symbol-checkbox" style="display:none;">
          ${sym}
        </label>
      `).join('')}
    </div>
  ` : '';

  // Render HTML structure
  container.innerHTML = `
    ${filterHtml}
    <div class="dashboard-grid">
      <div class="stat-card glass-panel">
        <div class="stat-title">Filtered P&L</div>
        <div class="stat-value ${pnlClass}">${pnlPrefix}$${totalPnl.toFixed(2)}</div>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-title">Win Rate</div>
        <div class="stat-value">${winRate}%</div>
        <div class="stat-subtitle">${wins} W / ${losses} L</div>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-title">Avg Risk/Reward</div>
        <div class="stat-value">1 : ${avgRR}</div>
      </div>
    </div>
    
    <div class="chart-container glass-panel">
      <h3>Cumulative Equity Curve</h3>
      <canvas id="equityChart"></canvas>
    </div>
  `;

  // Attach event listeners to checkboxes
  const labels = container.querySelectorAll('.symbol-filter-label');
  labels.forEach(label => {
    label.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent double triggering with the hidden checkbox
      const sym = label.getAttribute('data-symbol');
      if (selectedSymbols.has(sym)) {
        selectedSymbols.delete(sym);
      } else {
        selectedSymbols.add(sym);
      }
      renderDashboard(window.appStore.state);
    });
  });

  // Render Chart
  renderChart(trades);
}

function renderChart(trades) {
  const ctx = document.getElementById('equityChart');
  if (!ctx || trades.length === 0) return;

  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const uniqueDates = [...new Set(sortedTrades.map(t => t.date))];

  const datasets = [];

  selectedSymbols.forEach(sym => {
    const data = [];
    let cumulativePnl = 0;
    
    uniqueDates.forEach(date => {
      const tradesOnDate = sortedTrades.filter(t => t.date === date && (t.symbol ? t.symbol.toUpperCase() : 'UNKNOWN') === sym);
      tradesOnDate.forEach(t => {
        cumulativePnl += t.pnl;
      });
      data.push(cumulativePnl);
    });

    const color = getColorForSymbol(sym);
    const bgColor = getColorForSymbol(sym, 0.2);

    datasets.push({
      label: sym,
      data: data,
      borderColor: color,
      backgroundColor: bgColor,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: color
    });
  });

  if (dashboardChartInstance) {
    dashboardChartInstance.destroy();
  }

  dashboardChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: uniqueDates,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { 
          display: true,
          labels: { color: '#ffffff' }
        },
        tooltip: {
          backgroundColor: 'rgba(10, 10, 12, 0.9)',
          titleColor: '#A1A1AA',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#A1A1AA' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#A1A1AA' }
        }
      }
    }
  });
}

// Subscribe to store updates
window.appStore.subscribe(state => {
  // Only re-render if dashboard is visible or we just want to keep DOM fresh
  // For simplicity, we re-render every time there's an update.
  renderDashboard(state);
});

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard(window.appStore.state);
});
