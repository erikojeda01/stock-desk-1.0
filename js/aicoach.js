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

async function handleChatSubmission() {
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

  // Real AI Logic Based on Store Data
  try {
    const responseText = await fetchFromAIParams(userText, window.appStore.state);
    const typingIndicator = document.getElementById('ai-typing');
    if (typingIndicator) typingIndicator.remove();
    addMessage(responseText, 'ai');
  } catch(e) {
    const typingIndicator = document.getElementById('ai-typing');
    if (typingIndicator) typingIndicator.remove();
    console.error(e);
    addMessage("Sorry, I couldn't reach the AI server right now. " + e.message, 'ai');
  }
}

function addMessage(text, sender) {
  const messagesEl = document.getElementById('chat-messages');
  const cssClass = sender === 'user' ? 'chat-user' : 'chat-ai';
  const prefix = sender === 'user' ? '' : '<strong>StockDesk AI</strong><br><br>';
  
  // Format bold text automatically
  const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

  messagesEl.insertAdjacentHTML('beforeend', `
    <div class="chat-bubble ${cssClass}">
      ${prefix}${formattedText}
    </div>
  `);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function summarizeTrades(trades) {
  if (trades.length === 0) return "No trades yet.";
  return trades.map(t => `${t.date} | ${t.symbol} | ${t.type} | Risk/Reward: ${t.rr || 'N/A'} | P&L: $${t.pnl}`).join('\n');
}

async function fetchFromAIParams(query, state) {
  const trades = state.trades;
  // Use optional chaining for import.meta.env just in case it's not available in raw builds
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_AI_API_KEY : null;

  if (!apiKey) {
    // Fallback to mock if no API key is set
    return generateMockAIResponse(query, state) + "<br><br>*(Note: This is a simulated response. Please set up VITE_AI_API_KEY in your .env or server environment to enable live AI responses)*";
  }
  
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
You are an expert stock trading coach analyzing a user's trading journal. 
Here is their logged trade history:
${summarizeTrades(trades)}

User Question: ${query}

Provide a concise, helpful, and insightful response based strictly on their data. Keep it under 150 words. Format important keywords using markdown **bold**.
`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('API Request failed: ' + response.statusText);
  }

  const data = await response.json();
  const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!aiText) throw new Error("No valid response from AI");

  return aiText;
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
      return `Your win rate is currently **${winRate}%**. This points to a potential issue with entry timing or stock selection. I suggest reviewing your most recent losses in the Journal and categorizing why they failed.`;
    } else {
      return `Your win rate is solid (**${winRate}%**), but analyzing your Risk/Reward might be the next step. Ensure your average losing trade is completely minimized by using strict Stop Losses.`;
    }
  }

  if (q.includes('pattern') || q.includes('trend')) {
    const buyWins = trades.filter(t => t.type === 'buy' && t.pnl > 0).length;
    const sellWins = trades.filter(t => t.type === 'sell' && t.pnl > 0).length;
    
    if (buyWins > sellWins) {
      return `I noticed you are highly profitable on your **LONG (Buy)** setups compared to your Short setups. You might want to stick to Long positions in this current market condition.`;
    } else if (sellWins > buyWins) {
      return `Interestingly, your **short selling** setups are performing better than your longs. Consider sizing up on your short setups when the market provides the opportunity.`;
    } else {
        return `Your longs and shorts are performing roughly the same. Maintaining balance is good, but check your Journal to see which setups you *feel* most confident executing.`;
    }
  }

  return `That's an interesting question. Based on the ${trades.length} trades I see spanning **$${totalPnl.toFixed(2)}** in net profit, my general advice is to maintain strict discipline. Always honor your stop loss and track your emotional state in the Journal!`;
}

// Initial Render Trigger via Event
window.addEventListener('viewChanged', (e) => {
  if (e.detail.view === 'aicoach') {
    renderAICoach(window.appStore.state);
  }
});
