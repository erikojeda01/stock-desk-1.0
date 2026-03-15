/* 
  Dashboard logic
*/

let dashboardChartInstance = null;

function renderDashboard(state) {
  const container = document.getElementById('view-dashboard');
  const trades = state.trades;

  // Calculate Stats
  let totalPnl = 0;
  let wins = 0;
  let losses = 0;
  let totalRisk = 0;
  let totalReward = 0;
  let rrCount = 0;

  trades.forEach(t => {
    totalPnl += t.pnl;
    if (t.pnl > 0) wins++;
    else if (t.pnl < 0) losses++;

    if (t.rr) {
      totalRisk += 1; // Normalized to 1 Risk
      totalReward += t.rr;
      rrCount++;
    }
  });

  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : 0;
  const avgRR = rrCount > 0 ? (totalReward / rrCount).toFixed(2) : '0.00';

  const pnlClass = totalPnl >= 0 ? 'text-success' : 'text-danger';
  const pnlPrefix = totalPnl >= 0 ? '+' : '';

  // Render HTML structure
  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="stat-card glass-panel">
        <div class="stat-title">Total P&L</div>
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

  // Render Chart
  renderChart(trades);
}

function renderChart(trades) {
  const ctx = document.getElementById('equityChart');
  if (!ctx) return;

  // Prepare data: cumulative sum over time (ascending)
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningTotal = 0;
  const labels = [];
  const data = [];

  sortedTrades.forEach(t => {
    runningTotal += t.pnl;
    labels.push(t.date);
    data.push(runningTotal);
  });

  if (dashboardChartInstance) {
    dashboardChartInstance.destroy();
  }

  dashboardChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cumulative P&L',
        data: data,
        borderColor: '#6B46C1', // Primary color
        backgroundColor: 'rgba(107, 70, 193, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#21D4FD'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94A3B8' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94A3B8' }
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
