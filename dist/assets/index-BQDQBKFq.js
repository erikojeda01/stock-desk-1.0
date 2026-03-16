var e=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var t=e((()=>{var e=`stockdesk_data`,t={trades:[],journalEntries:[],settings:{userName:`Trader`}},n=class{constructor(){this.state=this.loadData(),this.listeners=[]}loadData(){let n=localStorage.getItem(e);if(n)try{let e=JSON.parse(n);return{trades:e.trades||[],journalEntries:e.journalEntries||[],settings:e.settings||t.settings}}catch(e){return console.error(`Failed to parse store data`,e),t}return t}saveData(){localStorage.setItem(e,JSON.stringify(this.state)),this.notify()}addTrade(e){e.id=crypto.randomUUID(),e.createdAt=new Date().toISOString();let t=parseFloat(e.entry),n=parseFloat(e.exit),r=parseFloat(e.shares),i=0;i=e.type===`buy`?(n-t)*r:(t-n)*r,e.pnl=Number(i.toFixed(2));let a=null;if(e.sl&&parseFloat(e.sl)>0){let r=parseFloat(e.sl),i,o;e.type===`buy`?(i=t-r,o=n-t):(i=r-t,o=t-n),i>0&&(a=Number((o/i).toFixed(2)))}e.rr=a,this.state.trades.push(e),this.state.trades.sort((e,t)=>new Date(t.date)-new Date(e.date)),this.saveData()}addJournalEntry(e){e.id=crypto.randomUUID(),e.createdAt=new Date().toISOString();let t=this.state.journalEntries.findIndex(t=>t.date===e.date);t>=0?(e.id=this.state.journalEntries[t].id,this.state.journalEntries[t]=e):this.state.journalEntries.push(e),this.saveData()}getTrades(){return this.state.trades}getJournalEntries(){return this.state.journalEntries}getJournalEntryForDate(e){return this.state.journalEntries.find(t=>t.date===e)}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}};window.appStore=new n})),n=e((()=>{document.addEventListener(`DOMContentLoaded`,()=>{let e=document.querySelectorAll(`.nav-item`),t=document.querySelectorAll(`.page-view`),n=document.getElementById(`page-title`);function r(r){t.forEach(e=>{e.classList.remove(`active`)});let i=document.getElementById(`view-${r}`);i&&i.classList.add(`active`),e.forEach(e=>{e.dataset.target===r?(e.classList.add(`active`),n.textContent=e.querySelector(`span`).textContent):e.classList.remove(`active`)}),window.dispatchEvent(new CustomEvent(`viewChanged`,{detail:{view:r}}))}e.forEach(e=>{e.addEventListener(`click`,t=>{t.preventDefault();let n=e.dataset.target;r(n)})});let i=document.getElementById(`btn-add-trade`),a=document.getElementById(`add-trade-modal`),o=document.querySelectorAll(`.close-modal`),s=document.getElementById(`add-trade-form`);i.addEventListener(`click`,()=>{a.classList.add(`active`),document.getElementById(`trade-date`).valueAsDate=new Date});function c(){a.classList.remove(`active`),s.reset()}o.forEach(e=>e.addEventListener(`click`,c)),a.addEventListener(`click`,e=>{e.target===a&&c()}),s.addEventListener(`submit`,e=>{e.preventDefault();let t={symbol:document.getElementById(`trade-symbol`).value.toUpperCase(),type:document.getElementById(`trade-type`).value,date:document.getElementById(`trade-date`).value,shares:document.getElementById(`trade-shares`).value,entry:document.getElementById(`trade-entry`).value,exit:document.getElementById(`trade-exit`).value,sl:document.getElementById(`trade-sl`).value||null,tp:document.getElementById(`trade-tp`).value||null};window.appStore.addTrade(t),c()}),r(`dashboard`)})})),r=e((()=>{var e=null;function t(e){let t=document.getElementById(`view-dashboard`),r=e.trades,i=0,a=0,o=0,s=0,c=0,l=0;r.forEach(e=>{i+=e.pnl,e.pnl>0?a++:e.pnl<0&&o++,e.rr&&(s+=1,c+=e.rr,l++)});let u=r.length>0?(a/r.length*100).toFixed(1):0,d=l>0?(c/l).toFixed(2):`0.00`;t.innerHTML=`
    <div class="dashboard-grid">
      <div class="stat-card glass-panel">
        <div class="stat-title">Total P&L</div>
        <div class="stat-value ${i>=0?`text-success`:`text-danger`}">${i>=0?`+`:``}$${i.toFixed(2)}</div>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-title">Win Rate</div>
        <div class="stat-value">${u}%</div>
        <div class="stat-subtitle">${a} W / ${o} L</div>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-title">Avg Risk/Reward</div>
        <div class="stat-value">1 : ${d}</div>
      </div>
    </div>
    
    <div class="chart-container glass-panel">
      <h3>Cumulative Equity Curve</h3>
      <canvas id="equityChart"></canvas>
    </div>
  `,n(r)}function n(t){let n=document.getElementById(`equityChart`);if(!n)return;let r=[...t].sort((e,t)=>new Date(e.date)-new Date(t.date)),i=0,a=[],o=[];r.forEach(e=>{i+=e.pnl,a.push(e.date),o.push(i)}),e&&e.destroy(),e=new Chart(n,{type:`line`,data:{labels:a,datasets:[{label:`Cumulative P&L`,data:o,borderColor:`#6B46C1`,backgroundColor:`rgba(107, 70, 193, 0.2)`,borderWidth:2,fill:!0,tension:.4,pointBackgroundColor:`#21D4FD`}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{grid:{color:`rgba(255, 255, 255, 0.05)`},ticks:{color:`#94A3B8`}},y:{grid:{color:`rgba(255, 255, 255, 0.05)`},ticks:{color:`#94A3B8`}}}}})}window.appStore.subscribe(e=>{t(e)}),document.addEventListener(`DOMContentLoaded`,()=>{t(window.appStore.state)})})),i=e((()=>{function e(e){let t=document.getElementById(`view-trades`),n=e.trades,r=`
    <div class="trades-header">
      <h2>Trade History</h2>
      <p class="text-secondary">${n.length} trades logged</p>
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
  `;n.length===0?r+=`<tr><td colspan="8" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No trades logged yet. Click 'New Trade' to start.</td></tr>`:n.forEach(e=>{let t=e.type===`buy`?`bg-success text-success`:`bg-danger text-danger`,n=e.pnl>=0?`text-success`:`text-danger`,i=e.rr?`1:${e.rr}`:`-`;r+=`
        <tr>
          <td>${e.date}</td>
          <td><strong>${e.symbol}</strong></td>
          <td><span class="badge ${t}">${e.type.toUpperCase()}</span></td>
          <td>${e.shares}</td>
          <td>$${e.entry}</td>
          <td>$${e.exit}</td>
          <td>${i}</td>
          <td class="${n}"><strong>$${e.pnl}</strong></td>
        </tr>
      `}),r+=`
        </tbody>
      </table>
    </div>
  `,t.innerHTML=r}window.appStore.subscribe(t=>{e(t)}),document.addEventListener(`DOMContentLoaded`,()=>{e(window.appStore.state)})})),a=e((()=>{var e=new Date;function t(n){let r=document.getElementById(`view-calendar`),i=n.trades,a=n.journalEntries,o=e.getFullYear(),s=e.getMonth(),c=e.toLocaleString(`default`,{month:`long`}),l={};i.forEach(e=>{let t=e.date.split(`T`)[0];l[t]||(l[t]=0),l[t]+=e.pnl});let u={};a.forEach(e=>{let t=e.date.split(`T`)[0];u[t]=!0});let d=new Date(o,s,1).getDay(),f=new Date(o,s+1,0).getDate(),p=`
    <div class="calendar-header">
      <h2>Calendar Overview</h2>
      <div class="calendar-nav">
        <button id="btn-prev-month"><i class="ph ph-caret-left"></i></button>
        <span style="display:inline-block; width: 150px; text-align:center; font-weight:600;">${c} ${o}</span>
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
  `;for(let e=0;e<d;e++)p+=`<div class="calendar-day empty"></div>`;for(let e=1;e<=f;e++){let t=`${o}-${String(s+1).padStart(2,`0`)}-${String(e).padStart(2,`0`)}`,n=l[t]||0,r=u[t],i=``,a=``;n>0?(i=`day-success`,a=`+${n.toFixed(2)}`):n<0&&(i=`day-danger`,a=n.toFixed(2)),p+=`
      <div class="calendar-day ${i}">
        ${r?`<div class="journal-dot" title="Journal logged"></div>`:``}
        <span class="date">${e}</span>
        ${n===0?``:`<div class="day-pnl ${n>0?`text-success`:`text-danger`}">$${a}</div>`}
      </div>
    `}p+=`</div>`,r.innerHTML=p,document.getElementById(`btn-prev-month`).addEventListener(`click`,()=>{e.setMonth(e.getMonth()-1),t(window.appStore.state)}),document.getElementById(`btn-next-month`).addEventListener(`click`,()=>{e.setMonth(e.getMonth()+1),t(window.appStore.state)})}window.appStore.subscribe(e=>{t(e)}),document.addEventListener(`DOMContentLoaded`,()=>{t(window.appStore.state)})})),o=e((()=>{function e(e){let r=document.getElementById(`view-journal`),i=e.journalEntries,a=`
    <div class="journal-header" style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
      <h2>Trading Journal</h2>
      <button class="btn-primary" id="btn-new-journal"><i class="ph ph-plus"></i> New Entry</button>
    </div>
    <div class="journal-layout">
      <!-- Sidebar List -->
      <div class="journal-sidebar glass-panel" style="max-height: 600px; overflow-y: auto;">
        <h3 style="margin-bottom:1rem; font-size:1rem;">Past Entries</h3>
  `;i.length===0?a+=`<p class="text-tertiary" style="font-size:0.875rem;">No entries yet.</p>`:[...i].sort((e,t)=>new Date(t.date)-new Date(e.date)).forEach((e,t)=>{let n=`mood-neutral`;e.mood===`Bullish`&&(n=`mood-bullish`),e.mood===`Bearish`&&(n=`mood-bearish`),a+=`
        <div class="journal-entry-card ${t===0?`active`:``}" data-id="${e.id}">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
            <span style="font-weight:600; font-size:0.875rem;">${e.date}</span>
            <span class="mood-badge ${n}">${e.mood}</span>
          </div>
          <p class="text-secondary" style="font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.reflection}</p>
        </div>
      `}),a+=`
      </div>
      <!-- Detail / Edit View -->
      <div class="journal-detail glass-panel" id="journal-detail-container">
        <!-- Injected via JS -->
      </div>
    </div>
  `,r.innerHTML=a,document.getElementById(`btn-new-journal`).addEventListener(`click`,()=>{t()});let o=r.querySelectorAll(`.journal-entry-card`);o.forEach(e=>{e.addEventListener(`click`,()=>{o.forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),n(i.find(t=>t.id===e.dataset.id))})}),i.length>0?n([...i].sort((e,t)=>new Date(t.date)-new Date(e.date))[0]):t()}function t(e=null){let t=document.getElementById(`journal-detail-container`),n=new Date().toISOString().split(`T`)[0],r=e?e.date:n,i=e?e.mood:`Neutral`,a=e?e.reflection:``;t.innerHTML=`
    <h3 style="margin-bottom:1.5rem;">${e?`Edit Entry`:`Log Daily Review`}</h3>
    <form id="journal-form">
      <div class="form-row">
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="journal-date" value="${r}" required>
        </div>
        <div class="form-group">
          <label>Overall Mood/Bias</label>
          <select id="journal-mood">
            <option value="Bullish" ${i===`Bullish`?`selected`:``}>Bullish</option>
            <option value="Bearish" ${i===`Bearish`?`selected`:``}>Bearish</option>
            <option value="Neutral" ${i===`Neutral`?`selected`:``}>Neutral</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Reflection (What worked? What didn't?)</label>
        <textarea id="journal-reflection" rows="10" required placeholder="Write your thoughts here...">${a}</textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary">Save Entry</button>
      </div>
    </form>
  `,document.getElementById(`journal-form`).addEventListener(`submit`,e=>{e.preventDefault(),window.appStore.addJournalEntry({date:document.getElementById(`journal-date`).value,mood:document.getElementById(`journal-mood`).value,reflection:document.getElementById(`journal-reflection`).value})})}function n(e){let n=document.getElementById(`journal-detail-container`),r=`mood-neutral`;e.mood===`Bullish`&&(r=`mood-bullish`),e.mood===`Bearish`&&(r=`mood-bearish`),n.innerHTML=`
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem;">
      <div>
        <h3 style="font-size:1.5rem; margin-bottom:0.5rem;">Session: ${e.date}</h3>
        <span class="mood-badge ${r}">${e.mood}</span>
      </div>
      <button class="btn-secondary" id="btn-edit-journal"><i class="ph ph-pencil-simple"></i> Edit</button>
    </div>
    
    <div style="line-height:1.6; color:var(--text-secondary); white-space: pre-wrap;">${e.reflection}</div>
  `,document.getElementById(`btn-edit-journal`).addEventListener(`click`,()=>{t(e)})}window.appStore.subscribe(t=>{let n=document.getElementById(`view-journal`);n&&n.classList.contains(`active`)&&e(t)}),window.addEventListener(`viewChanged`,t=>{t.detail.view===`journal`&&e(window.appStore.state)})})),s=e((()=>{function e(e){let n=document.getElementById(`view-aicoach`);n.innerHTML.includes(`chat-container`)||(n.innerHTML=`
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
    `,document.getElementById(`ai-chat-form`).addEventListener(`submit`,e=>{e.preventDefault(),t()}))}function t(){let e=document.getElementById(`ai-chat-input`),t=document.getElementById(`chat-messages`),i=e.value.trim();i&&(n(i,`user`),e.value=``,t.insertAdjacentHTML(`beforeend`,`
    <div class="chat-bubble chat-ai" id="ai-typing">
      <em>Analyzing your trade data...</em>
    </div>
  `),t.scrollTop=t.scrollHeight,setTimeout(()=>{document.getElementById(`ai-typing`).remove(),n(r(i,window.appStore.state),`ai`)},1500))}function n(e,t){let n=document.getElementById(`chat-messages`),r=t===`user`?`chat-user`:`chat-ai`,i=t===`user`?``:`<strong>StockDesk AI</strong><br><br>`;n.insertAdjacentHTML(`beforeend`,`
    <div class="chat-bubble ${r}">
      ${i}${e}
    </div>
  `),n.scrollTop=n.scrollHeight}function r(e,t){let n=e.toLowerCase(),r=t.trades;if(r.length===0)return`I don't see any trades logged yet. Let's log some trades in the **Trades** tab so I can give you personalized feedback!`;let i=0,a=0,o=0;r.forEach(e=>{i+=e.pnl,e.pnl>0?a++:e.pnl<0&&o++});let s=(a/r.length*100).toFixed(1);if(n.includes(`performance`)||n.includes(`doing`)||n.includes(`summary`))return`Looking at your data, you have taken ${r.length} trades with a win rate of **${s}%**. Your total P&L is **$${i.toFixed(2)}**. Keep focusing on your edge!`;if(n.includes(`weakness`)||n.includes(`mistake`)||n.includes(`improve`))return s<50?`Your win rate is currently ${s}%. This points to a potential issue with entry timing or stock selection. I suggest reviewing your most recent losses in the Journal and categorizing why they failed.`:`Your win rate is solid (${s}%), but analyzing your Risk/Reward might be the next step. Ensure your average losing trade is completely minimized by using strict Stop Losses.`;if(n.includes(`pattern`)||n.includes(`trend`)){let e=r.filter(e=>e.type===`buy`&&e.pnl>0).length,t=r.filter(e=>e.type===`sell`&&e.pnl>0).length;return e>t?`I noticed you are highly profitable on your LONG (Buy) setups compared to your Short setups. You might want to stick to Long positions in this current market condition.`:t>e?`Interestingly, your short selling setups are performing better than your longs. Consider sizing up on your short setups when the market provides the opportunity.`:`Your longs and shorts are performing roughly the same. Maintaining balance is good, but check your Journal to see which setups you *feel* most confident executing.`}return`That's an interesting question. Based on the ${r.length} trades I see spanning $${i.toFixed(2)} in net profit, my general advice is to maintain strict discipline. Always honor your stop loss and track your emotional state in the Journal!`}window.addEventListener(`viewChanged`,t=>{t.detail.view===`aicoach`&&e(window.appStore.state)})})),c=e((()=>{document.addEventListener(`DOMContentLoaded`,()=>{let e=document.getElementById(`import-trades-modal`),t=document.getElementById(`btn-open-import`),n=document.getElementById(`close-import-modal`),r=document.getElementById(`btn-cancel-import`),i=document.getElementById(`csv-drop-zone`),a=document.getElementById(`csv-file-input`),o=document.getElementById(`import-step-1`),s=document.getElementById(`import-step-2`),c=document.getElementById(`import-mapping-form`),l=document.getElementById(`mapping-container`),u=[],d=[],f=[{key:`symbol`,label:`Symbol (e.g. AAPL)`,keywords:[`symbol`,`ticker`,`instrument`]},{key:`type`,label:`Type (Buy/Sell)`,keywords:[`type`,`side`,`action`]},{key:`date`,label:`Entry Date`,keywords:[`date`,`time`,`opened`,`execution`]},{key:`shares`,label:`Shares / Qty`,keywords:[`qty`,`quantity`,`shares`,`size`]},{key:`entry`,label:`Entry Price`,keywords:[`entry`,`price`,`avg price`,`buy price`]},{key:`exit`,label:`Exit Price`,keywords:[`exit`,`close price`,`sell price`]}];function p(){e.classList.add(`active`),h()}function m(){e.classList.remove(`active`),h()}function h(){o.style.display=`block`,s.style.display=`none`,a.value=``,u=[],d=[],l.innerHTML=``}t.addEventListener(`click`,p),n.addEventListener(`click`,m),r.addEventListener(`click`,m),e.addEventListener(`click`,t=>{t.target===e&&m()}),i.addEventListener(`click`,()=>a.click()),i.addEventListener(`dragover`,e=>{e.preventDefault(),i.style.borderColor=`var(--primary)`,i.style.background=`rgba(107, 70, 193, 0.1)`}),i.addEventListener(`dragleave`,e=>{e.preventDefault(),i.style.borderColor=`rgba(255,255,255,0.2)`,i.style.background=`transparent`}),i.addEventListener(`drop`,e=>{e.preventDefault(),i.style.borderColor=`rgba(255,255,255,0.2)`,i.style.background=`transparent`,e.dataTransfer.files&&e.dataTransfer.files.length>0&&g(e.dataTransfer.files[0])}),a.addEventListener(`change`,e=>{e.target.files&&e.target.files.length>0&&g(e.target.files[0])});function g(e){if(!e.name.endsWith(`.csv`)){alert(`Please upload a valid CSV file.`);return}let t=new FileReader;t.onload=function(e){let t=e.target.result;_(t)},t.readAsText(e)}function _(e){let t=y(e);if(t.length<2){alert(`Invalid CSV or empty file.`);return}d=t[0].map(e=>e.trim()),u=[];for(let e=1;e<t.length;e++){if(t[e].length===1&&t[e][0]===``)continue;let n={};t[e].forEach((e,t)=>{d[t]&&(n[d[t]]=e.trim())}),u.push(n)}o.style.display=`none`,s.style.display=`block`,v()}function v(){l.innerHTML=``,f.forEach(e=>{let t=``,n=e.keywords.map(e=>e.toLowerCase());for(let e of d){let r=e.toLowerCase();if(n.includes(r)||n.some(e=>r.includes(e))){t=e;break}}let r=`<option value="">-- Ignore / Not Provided --</option>`;d.forEach(e=>{r+=`<option value="${e}" ${e===t?`selected`:``}>${e}</option>`});let i=`
        <div class="mapping-row" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="flex: 1; font-weight: 500; color: var(--text-primary);">${e.label}</div>
          <div style="flex: 1;">
            <select class="mapping-select" data-field="${e.key}" style="width: 100%; background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.5rem; border-radius: 4px; outline: none;">
              ${r}
            </select>
          </div>
        </div>
      `;l.insertAdjacentHTML(`beforeend`,i)})}c.addEventListener(`submit`,e=>{e.preventDefault();let t={};l.querySelectorAll(`.mapping-select`).forEach(e=>{t[e.dataset.field]=e.value});let n=0;u.forEach(e=>{let r=e[t.symbol],i=e[t.date];if(!r||!i)return;let a=e[t.type]?e[t.type].toLowerCase():`buy`,o=a.includes(`sell`)||a.includes(`short`)?`sell`:`buy`,s=parseFloat((e[t.shares]||`1`).replace(/[^0-9.-]+/g,``)),c=parseFloat((e[t.entry]||`0`).replace(/[^0-9.-]+/g,``)),l=parseFloat((e[t.exit]||`0`).replace(/[^0-9.-]+/g,``)),u=new Date().toISOString().split(`T`)[0],d=new Date(i);isNaN(d)||(u=d.toISOString().split(`T`)[0]);let f={symbol:r.toUpperCase(),type:o,date:u,shares:isNaN(s)?1:s,entry:isNaN(c)?0:c,exit:isNaN(l)?0:l,sl:null,tp:null};window.appStore.addTrade(f),n++}),alert(`Successfully imported ${n} trades!`),m()});function y(e){let t=[],n=[],r=``,i=!1;for(let a=0;a<e.length;a++){let o=e[a];i?o===`"`?a+1<e.length&&e[a+1]===`"`?(r+=`"`,a++):i=!1:r+=o:o===`"`?i=!0:o===`,`?(n.push(r),r=``):o===`\r`||(o===`
`?(n.push(r),t.push(n),n=[],r=``):r+=o)}return n.push(r),t.push(n),t}})}));t(),n(),r(),i(),a(),o(),s(),c();