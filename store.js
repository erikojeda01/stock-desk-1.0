/* 
  StockDesk Store
  Handles LocalStorage interactions and Global State
*/

const STORE_KEY = 'stockdesk_data';

// Default state if nothing in localStorage
const defaultState = {
  trades: [],
  journalEntries: [],
  settings: {
    userName: 'Trader'
  }
};

class Store {
  constructor() {
    this.state = this.loadData();
    this.listeners = [];
  }

  loadData() {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Ensure properties exist
        return {
          trades: parsed.trades || [],
          journalEntries: parsed.journalEntries || [],
          settings: parsed.settings || defaultState.settings
        };
      } catch (e) {
        console.error("Failed to parse store data", e);
        return defaultState;
      }
    }
    return defaultState;
  }

  saveData() {
    localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    this.notify();
  }

  // --- Methods ---

  addTrade(trade) {
    // Generate UUID
    trade.id = crypto.randomUUID();
    trade.createdAt = new Date().toISOString();
    
    // Parse numbers
    const entry = parseFloat(trade.entry);
    const exit = parseFloat(trade.exit);
    const shares = parseFloat(trade.shares);
    
    // Calculate P&L
    let pnl = 0;
    if (trade.type === 'buy') {
      pnl = (exit - entry) * shares;
    } else {
      // Short
      pnl = (entry - exit) * shares;
    }
    trade.pnl = Number(pnl.toFixed(2));
    
    // Calculate R/R if Stop Loss is provided
    let rr = null;
    if (trade.sl && parseFloat(trade.sl) > 0) {
      const slPrice = parseFloat(trade.sl);
      let risk, reward;
      if (trade.type === 'buy') {
        risk = entry - slPrice;
        reward = exit - entry;
      } else {
        risk = slPrice - entry;
        reward = entry - exit;
      }
      if (risk > 0) {
        rr = Number((reward / risk).toFixed(2));
      }
    }
    trade.rr = rr;

    this.state.trades.push(trade);
    
    // Sort trades descending by date
    this.state.trades.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.saveData();
  }

  addJournalEntry(entry) {
    entry.id = crypto.randomUUID();
    entry.createdAt = new Date().toISOString();
    
    // Only one journal entry per day, overwrite if exists
    const existingIndex = this.state.journalEntries.findIndex(e => e.date === entry.date);
    if (existingIndex >= 0) {
      // Keep ID, overwrite rest
      entry.id = this.state.journalEntries[existingIndex].id;
      this.state.journalEntries[existingIndex] = entry;
    } else {
      this.state.journalEntries.push(entry);
    }
    
    this.saveData();
  }

  getTrades() {
    return this.state.trades;
  }

  getJournalEntries() {
    return this.state.journalEntries;
  }
  
  getJournalEntryForDate(dateString) {
      return this.state.journalEntries.find(e => e.date === dateString);
  }

  // Subscription logic to re-render views automatically when data changes
  subscribe(callback) {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(callback => callback(this.state));
  }
}

// Global instance
window.appStore = new Store();
