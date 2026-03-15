/* AI Coach View Logic */

function renderAICoach(state) {
  const container = document.getElementById('view-aicoach');
  
  if (!container.innerHTML.includes('chat-container')) {
    container.innerHTML = `
      <div class="glass-panel chat-container">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-bubble chat-ai">
            <strong>StockDesk AI Coach</strong><br><br>
            Hello! I am your AI trading coach. I have access to your logged trades. Ask me to review your performance, spot patterns, or give advice on risk management!
          </div>
        </div>
        <form class="chat-input-area" id="ai-chat-form">
          <input type="text" id="ai-chat-input" placeholder="Ask the coach... e.g., 'What is my biggest weakness right now?'" required autocomplete="off">
          <button type="submit" class="btn-primary"><i class="ph ph-paper-plane-right"></i> Send</button>
        </form>
      </div>
    `;

    document.getElementById('ai-chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      handleChatSubmission();
    });
  }
}

function handleChatSubmission() {
  const inputEl = document.getElementById('ai-chat-input');
  const messagesEl = document.getElementById('chat-messages');
  const userText = inputEl.value.trim();
  
  if (!userText) return;

  // Add User Message
  addMessage(userText, 'user');
  inputEl.value = '';

  // Simulate AI Thinking
  messagesEl.insertAdjacentHTML('beforeend', `
    <div class="chat-bubble chat-ai" id="ai-typing">
      <em>Analyzing your trade data...</em>
    </div>
  `);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Mock AI Logic Based on Store Data
  setTimeout(() => {
    document.getElementById('ai-typing').remove();
    const response = generateMockAIResponse(userText, window.appStore.state);
    addMessage(response, 'ai');
  }, 1500);
}

function addMessage(text, sender) {
  const messagesEl = document.getElementById('chat-messages');
  const cssClass = sender === 'user' ? 'chat-user' : 'chat-ai';
  const prefix = sender === 'user' ? '' : '<strong>StockDesk AI</strong><br><br>';
  
  messagesEl.insertAdjacentHTML('beforeend', `
    <div class="chat-bubble ${cssClass}">
      ${prefix}${text}
    </div>
  `);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function generateMockAIResponse(query, state) {
  const q = query.toLowerCase();
  const trades = state.trades;

  if (trades.length === 0) {
    return "I don't see any trades logged yet. Let's log some trades in the **Trades** tab so I can give you personalized feedback!";
  }

  let totalPnl = 0;
  let wins = 0;
  let losses = 0;
  trades.forEach(t => {
    totalPnl += t.pnl;
    if (t.pnl > 0) wins++;
    else if (t.pnl < 0) losses++;
  });
  const winRate = ((wins / trades.length) * 100).toFixed(1);

  if (q.includes('performance') || q.includes('doing') || q.includes('summary')) {
    return `Looking at your data, you have taken ${trades.length} trades with a win rate of **${winRate}%**. Your total P&L is **$${totalPnl.toFixed(2)}**. Keep focusing on your edge!`;
  }

  if (q.includes('weakness') || q.includes('mistake') || q.includes('improve')) {
    if (winRate < 50) {
      return `Your win rate is currently ${winRate}%. This points to a potential issue with entry timing or stock selection. I suggest reviewing your most recent losses in the Journal and categorizing why they failed.`;
    } else {
      return `Your win rate is solid (${winRate}%), but analyzing your Risk/Reward might be the next step. Ensure your average losing trade is completely minimized by using strict Stop Losses.`;
    }
  }

  if (q.includes('pattern') || q.includes('trend')) {
    const buyWins = trades.filter(t => t.type === 'buy' && t.pnl > 0).length;
    const sellWins = trades.filter(t => t.type === 'sell' && t.pnl > 0).length;
    
    if (buyWins > sellWins) {
      return `I noticed you are highly profitable on your LONG (Buy) setups compared to your Short setups. You might want to stick to Long positions in this current market condition.`;
    } else if (sellWins > buyWins) {
      return `Interestingly, your short selling setups are performing better than your longs. Consider sizing up on your short setups when the market provides the opportunity.`;
    } else {
        return `Your longs and shorts are performing roughly the same. Maintaining balance is good, but check your Journal to see which setups you *feel* most confident executing.`;
    }
  }

  return `That's an interesting question. Based on the ${trades.length} trades I see spanning $${totalPnl.toFixed(2)} in net profit, my general advice is to maintain strict discipline. Always honor your stop loss and track your emotional state in the Journal!`;
}

// Initial Render Trigger via Event
window.addEventListener('viewChanged', (e) => {
  if (e.detail.view === 'aicoach') {
    renderAICoach(window.appStore.state);
  }
});
