/* 
  StockDesk CSV Import Logic 
  Includes automatic column mapping similar to TradeZella's import organizer.
*/

document.addEventListener('DOMContentLoaded', () => {
  const modalOuter = document.getElementById('import-trades-modal');
  const btnOpenImport = document.getElementById('btn-open-import');
  const btnCloseImport = document.getElementById('close-import-modal');
  const btnCancelImport = document.getElementById('btn-cancel-import');
  const dropZone = document.getElementById('csv-drop-zone');
  const fileInput = document.getElementById('csv-file-input');
  
  const step1 = document.getElementById('import-step-1');
  const step2 = document.getElementById('import-step-2');
  const mappingForm = document.getElementById('import-mapping-form');
  const mappingContainer = document.getElementById('mapping-container');

  let parsedRawData = [];
  let detectedHeaders = [];

  // Required StockDesk Fields
  const requiredFields = [
    { key: 'symbol', label: 'Symbol (e.g. AAPL)', keywords: ['symbol', 'ticker', 'instrument'] },
    { key: 'type', label: 'Type (Buy/Sell)', keywords: ['type', 'side', 'action'] },
    { key: 'date', label: 'Entry Date', keywords: ['date', 'time', 'opened', 'execution'] },
    { key: 'shares', label: 'Shares / Qty', keywords: ['qty', 'quantity', 'shares', 'size'] },
    { key: 'entry', label: 'Entry Price', keywords: ['entry', 'price', 'avg price', 'buy price'] },
    { key: 'exit', label: 'Exit Price', keywords: ['exit', 'close price', 'sell price'] }
  ];

  /* Modal Toggles */
  function openImportModal() {
    modalOuter.classList.add('active');
    resetImportState();
  }

  function closeImportModal() {
    modalOuter.classList.remove('active');
    resetImportState();
  }

  function resetImportState() {
    step1.style.display = 'block';
    step2.style.display = 'none';
    fileInput.value = '';
    parsedRawData = [];
    detectedHeaders = [];
    mappingContainer.innerHTML = '';
  }

  btnOpenImport.addEventListener('click', openImportModal);
  btnCloseImport.addEventListener('click', closeImportModal);
  btnCancelImport.addEventListener('click', closeImportModal);

  // Close when clicking outside
  modalOuter.addEventListener('click', (e) => {
    if (e.target === modalOuter) closeImportModal();
  });

  /* Drag & Drop Logic */
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary)';
    dropZone.style.background = 'rgba(107, 70, 193, 0.1)';
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgba(255,255,255,0.2)';
    dropZone.style.background = 'transparent';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgba(255,255,255,0.2)';
    dropZone.style.background = 'transparent';
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  /* File Processing */
  function handleFileSelected(file) {
    if (!file.name.endsWith('.csv')) {
      alert("Please upload a valid CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      processCSV(text);
    };
    reader.readAsText(file);
  }

  function processCSV(csvText) {
    // Basic CSV Parser handling quotes
    const lines = parseCSVString(csvText);
    if (lines.length < 2) {
      alert("Invalid CSV or empty file.");
      return;
    }

    detectedHeaders = lines[0].map(h => h.trim());
    
    // Convert remaining lines to array of objects mapped by header
    parsedRawData = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].length === 1 && lines[i][0] === '') continue; // Skip empty
      const rowObj = {};
      lines[i].forEach((val, idx) => {
        if (detectedHeaders[idx]) {
          rowObj[detectedHeaders[idx]] = val.trim();
        }
      });
      parsedRawData.push(rowObj);
    }

    // Move to step 2: Mapping
    step1.style.display = 'none';
    step2.style.display = 'block';
    buildMappingUI();
  }

  /* Auto-Mapper & UI Builder */
  function buildMappingUI() {
    mappingContainer.innerHTML = '';

    requiredFields.forEach(field => {
      // Try to auto-detect the best matching column
      let bestMatch = '';
      const lowerKeywords = field.keywords.map(k => k.toLowerCase());
      
      for (let header of detectedHeaders) {
        const lowerHeader = header.toLowerCase();
        // Exact match preferred, then includes, then keyword includes
        if (lowerKeywords.includes(lowerHeader) || 
            lowerKeywords.some(kw => lowerHeader.includes(kw))) {
          bestMatch = header;
          break;
        }
      }

      // Build Select HTML
      let optionsHTML = `<option value="">-- Ignore / Not Provided --</option>`;
      detectedHeaders.forEach(header => {
        const isSelected = header === bestMatch ? 'selected' : '';
        optionsHTML += `<option value="${header}" ${isSelected}>${header}</option>`;
      });

      const fieldHTML = `
        <div class="mapping-row" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="flex: 1; font-weight: 500; color: var(--text-primary);">${field.label}</div>
          <div style="flex: 1;">
            <select class="mapping-select" data-field="${field.key}" style="width: 100%; background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.5rem; border-radius: 4px; outline: none;">
              ${optionsHTML}
            </select>
          </div>
        </div>
      `;
      mappingContainer.insertAdjacentHTML('beforeend', fieldHTML);
    });
  }

  /* Final Import Action */
  mappingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('btn-confirm-import');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Importing…';

    // Gather final mappings
    const mappings = {};
    const selects = mappingContainer.querySelectorAll('.mapping-select');
    selects.forEach(select => {
      mappings[select.dataset.field] = select.value;
    });

    const trades = [];

    parsedRawData.forEach(row => {
      const mappedSymbol = row[mappings.symbol];
      const mappedDate = row[mappings.date];
      if (!mappedSymbol || !mappedDate) return;

      let rawType = row[mappings.type] ? row[mappings.type].toLowerCase() : 'buy';
      let cleanType = rawType.includes('sell') || rawType.includes('short') ? 'sell' : 'buy';

      const cleanShares = parseFloat((row[mappings.shares] || "1").replace(/[^0-9.-]+/g,""));
      const cleanEntry = parseFloat((row[mappings.entry] || "0").replace(/[^0-9.-]+/g,""));
      const cleanExit = parseFloat((row[mappings.exit] || "0").replace(/[^0-9.-]+/g,""));

      let cleanDate = new Date().toISOString().split('T')[0];
      const parsedDate = new Date(mappedDate);
      if (!isNaN(parsedDate)) {
        cleanDate = parsedDate.toISOString().split('T')[0];
      }

      trades.push({
        symbol: mappedSymbol.toUpperCase(),
        type: cleanType,
        date: cleanDate,
        shares: isNaN(cleanShares) ? 1 : cleanShares,
        entry: isNaN(cleanEntry) ? 0 : cleanEntry,
        exit: isNaN(cleanExit) ? 0 : cleanExit,
        sl: null,
        tp: null,
      });
    });

    try {
      await window.appStore.addTradesBulk(trades);
      alert(`Successfully imported ${trades.length} trades!`);
      closeImportModal();
    } catch (err) {
      alert(err?.message || 'Import failed');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Simple CSV parser handling standard comma delimited with quotes
  function parseCSVString(str) {
    const result = [];
    let curRow = [];
    let curVal = "";
    let inQuotes = false;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < str.length && str[i + 1] === '"') {
                    curVal += '"';
                    i++; 
                } else {
                    inQuotes = false;
                }
            } else {
                curVal += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                curRow.push(curVal);
                curVal = "";
            } else if (char === '\r') {
               // ignore \r
            } else if (char === '\n') {
                curRow.push(curVal);
                result.push(curRow);
                curRow = [];
                curVal = "";
            } else {
                curVal += char;
            }
        }
    }
    curRow.push(curVal);
    result.push(curRow);
    return result;
  }

});
