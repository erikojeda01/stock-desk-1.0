/* 
  StockDesk Main App Logic
  Handles Navigation and Global UI interactions 
*/
import { inject } from '@vercel/analytics';
inject();


document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const pageViews = document.querySelectorAll('.page-view');
  const pageTitle = document.getElementById('page-title');

  function switchView(targetId) {
    // Hide all views
    pageViews.forEach(view => {
      view.classList.remove('active');
    });
    
    // Show target view
    const targetView = document.getElementById(`view-${targetId}`);
    if (targetView) targetView.classList.add('active');

    // Update nav active state
    navItems.forEach(item => {
      if (item.dataset.target === targetId) {
        item.classList.add('active');
        // Update Title
        pageTitle.textContent = item.querySelector('span').textContent;
      } else {
        item.classList.remove('active');
      }
    });

    // Dispatch custom event so individual view scripts can re-render if needed
    window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: targetId } }));
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.dataset.target;
      switchView(target);
    });
  });

  // Modal Logic
  const addTradeBtn = document.getElementById('btn-add-trade');
  const modalOverlay = document.getElementById('add-trade-modal');
  const closeBtns = document.querySelectorAll('.close-modal');
  const addTradeForm = document.getElementById('add-trade-form');

  addTradeBtn.addEventListener('click', () => {
    modalOverlay.classList.add('active');
    // Set default date to today
    document.getElementById('trade-date').valueAsDate = new Date();
  });

  function closeModal() {
    modalOverlay.classList.remove('active');
    addTradeForm.reset();
  }

  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
  
  // Close modal on click outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Form Submit
  addTradeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tradeData = {
      symbol: document.getElementById('trade-symbol').value.toUpperCase(),
      type: document.getElementById('trade-type').value,
      date: document.getElementById('trade-date').value,
      shares: document.getElementById('trade-shares').value,
      entry: document.getElementById('trade-entry').value,
      exit: document.getElementById('trade-exit').value,
      sl: document.getElementById('trade-sl').value || null,
      tp: document.getElementById('trade-tp').value || null
    };

    const submitBtn = addTradeForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      await window.appStore.addTrade(tradeData);
      closeModal();
    } catch (err) {
      alert(err?.message || 'Failed to save trade');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Trade';
    }
  });

  // Logout button injected in topbar
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    userProfile.style.cursor = 'pointer';
    userProfile.title = 'Click to sign out';
    userProfile.addEventListener('click', () => {
      if (confirm('Sign out?')) window.appStore.logout();
    });
  }

  // Init
  switchView('dashboard');
});
