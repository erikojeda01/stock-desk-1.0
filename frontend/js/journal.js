/* Journal View Logic */

function renderJournal(state) {
  const container = document.getElementById('view-journal');
  const journals = state.journalEntries;

  // Render Layout
  let html = `
    <div class="journal-header" style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
      <h2>Trading Journal</h2>
      <button class="btn-primary" id="btn-new-journal"><i class="ph ph-plus"></i> New Entry</button>
    </div>
    <div class="journal-layout">
      <!-- Sidebar List -->
      <div class="journal-sidebar glass-panel" style="max-height: 600px; overflow-y: auto;">
        <h3 style="margin-bottom:1rem; font-size:1rem;">Past Entries</h3>
  `;

  if (journals.length === 0) {
    html += `<p class="text-tertiary" style="font-size:0.875rem;">No entries yet.</p>`;
  } else {
    // Sort descending
    const sorted = [...journals].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.forEach((j, i) => {
      let badgeClass = 'mood-neutral';
      if (j.mood === 'Bullish') badgeClass = 'mood-bullish';
      if (j.mood === 'Bearish') badgeClass = 'mood-bearish';

      html += `
        <div class="journal-entry-card ${i === 0 ? 'active' : ''}" data-id="${j.id}">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
            <span style="font-weight:600; font-size:0.875rem;">${j.date}</span>
            <span class="mood-badge ${badgeClass}">${j.mood}</span>
          </div>
          <p class="text-secondary" style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${j.reflection}</p>
        </div>
      `;
    });
  }

  html += `
      </div>
      <!-- Detail / Edit View -->
      <div class="journal-detail glass-panel" id="journal-detail-container">
        <!-- Injected via JS -->
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Bind New Entry
  document.getElementById('btn-new-journal').addEventListener('click', () => {
    renderJournalForm();
  });

  // Bind Selection
  const cards = container.querySelectorAll('.journal-entry-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const entry = journals.find(j => j.id === card.dataset.id);
      renderJournalDetail(entry);
    });
  });

  // Initial Detail Render
  if (journals.length > 0) {
    // sort to get latest
    const sorted = [...journals].sort((a, b) => new Date(b.date) - new Date(a.date));
    renderJournalDetail(sorted[0]);
  } else {
    renderJournalForm();
  }
}

function renderJournalForm(existingEntry = null) {
  const container = document.getElementById('journal-detail-container');
  const today = new Date().toISOString().split('T')[0];
  
  const dateVal = existingEntry ? existingEntry.date : today;
  const moodVal = existingEntry ? existingEntry.mood : 'Neutral';
  const reflectionVal = existingEntry ? existingEntry.reflection : '';

  container.innerHTML = `
    <h3 style="margin-bottom:1.5rem;">${existingEntry ? 'Edit Entry' : 'Log Daily Review'}</h3>
    <form id="journal-form">
      <div class="form-row">
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="journal-date" value="${dateVal}" required>
        </div>
        <div class="form-group">
          <label>Overall Mood/Bias</label>
          <select id="journal-mood">
            <option value="Bullish" ${moodVal === 'Bullish' ? 'selected' : ''}>Bullish</option>
            <option value="Bearish" ${moodVal === 'Bearish' ? 'selected' : ''}>Bearish</option>
            <option value="Neutral" ${moodVal === 'Neutral' ? 'selected' : ''}>Neutral</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Reflection (What worked? What didn't?)</label>
        <textarea id="journal-reflection" rows="10" required placeholder="Write your thoughts here...">${reflectionVal}</textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary">Save Entry</button>
      </div>
    </form>
  `;

  document.getElementById('journal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = 'Saving…';
    try {
      await window.appStore.addJournalEntry({
        date: document.getElementById('journal-date').value,
        mood: document.getElementById('journal-mood').value,
        reflection: document.getElementById('journal-reflection').value
      });
    } catch (err) {
      alert(err?.message || 'Failed to save entry');
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

function renderJournalDetail(entry) {
  const container = document.getElementById('journal-detail-container');
  
  let badgeClass = 'mood-neutral';
  if (entry.mood === 'Bullish') badgeClass = 'mood-bullish';
  if (entry.mood === 'Bearish') badgeClass = 'mood-bearish';

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem;">
      <div>
        <h3 style="font-size:1.5rem; margin-bottom:0.5rem;">Session: ${entry.date}</h3>
        <span class="mood-badge ${badgeClass}">${entry.mood}</span>
      </div>
      <button class="btn-secondary" id="btn-edit-journal"><i class="ph ph-pencil-simple"></i> Edit</button>
    </div>
    
    <div style="line-height:1.6; color:var(--text-secondary); white-space: pre-wrap;">${entry.reflection}</div>
  `;

  document.getElementById('btn-edit-journal').addEventListener('click', () => {
    renderJournalForm(entry);
  });
}

window.appStore.subscribe(state => {
  // Check if journal view is active to avoid unnecessary re-renders losing focus
  const journalView = document.getElementById('view-journal');
  if (journalView && journalView.classList.contains('active')) {
     renderJournal(state);
  }
});

window.addEventListener('viewChanged', (e) => {
  if (e.detail.view === 'journal') {
    renderJournal(window.appStore.state);
  }
});
