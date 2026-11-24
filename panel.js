// panel.js
import { initializeLocalModel, processChartWithAI, compareAnalyses } from './Logic.js';

const selectBtn = document.getElementById('select-btn');
const summaryText = document.getElementById('summary-text');
const resultContainer = document.getElementById('result-container');
const statusBox = document.getElementById('status-box');
const prioritySelect = document.getElementById('priority-select');

const memoryCountEl = document.getElementById('memory-count');
const memoryListEl = document.getElementById('memory-list');
const clearMemoryBtn = document.getElementById('clear-memory-btn');
const compareBtn = document.getElementById('compare-btn');
const comparisonContainer = document.getElementById('comparison-container');
const comparisonText = document.getElementById('comparison-text');

// Temporary in-memory store for the active side-panel session
let memoryBank = [];
let selectedForCompare = [];
let inputCounter = 0;
let isModelReady = false;

window.addEventListener('DOMContentLoaded', async () => {
  try {
    statusBox.textContent = "Loading local AI model (this may take a minute on first run)...";
    await initializeLocalModel((progressText) => {
      statusBox.textContent = progressText;
    });
    statusBox.textContent = "Local AI model ready!";
    statusBox.style.color = "#059669";
    isModelReady = true;
    selectBtn.disabled = false;
    updateCompareButtonState();
  } catch (err) {
    statusBox.textContent = `Failed to load model: ${err.message}`;
    statusBox.style.color = "#dc2626";
  }
});

selectBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      summaryText.textContent = "Error: No active tab found.";
      return;
    }

    const selectedPriority = prioritySelect ? prioritySelect.value : "executive";

    resultContainer.classList.remove('hidden');
    summaryText.textContent = "Click a chart, graph, or image on the webpage...";

    chrome.tabs.sendMessage(tab.id, { action: "start_selection" }, async (response) => {
      if (chrome.runtime.lastError) {
        summaryText.textContent = "Error: Please refresh the webpage and try again.";
        return;
      }

      if (!response || !response.success) {
        summaryText.textContent = response?.error || "Selection cancelled or failed.";
        return;
      }

      summaryText.textContent = "Graphic selected! Analyzing with local AI model...";

      try {
        const aiSummary = await processChartWithAI(response.image, selectedPriority);
        summaryText.textContent = aiSummary;

        // Save result to temporary session memory
        inputCounter += 1;
        const entry = {
          id: `mem_${Date.now()}_${inputCounter}`,
          label: `Input #${inputCounter}`,
          image: response.image,
          priority: selectedPriority,
          summary: aiSummary,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        memoryBank.unshift(entry);

        // Auto-select the two newest items if fewer than two are selected
        if (selectedForCompare.length < 2) {
          selectedForCompare.push(entry.id);
        } else {
          selectedForCompare = [entry.id, selectedForCompare[0]];
        }

        renderMemoryBank();
      } catch (aiError) {
        summaryText.textContent = `AI Error: ${aiError.message}`;
      }
    });
  } catch (err) {
    summaryText.textContent = `Error: ${err.message}`;
  }
});

clearMemoryBtn.addEventListener('click', () => {
  memoryBank = [];
  selectedForCompare = [];
  comparisonContainer.classList.add('hidden');
  comparisonText.textContent = "";
  renderMemoryBank();
});

compareBtn.addEventListener('click', async () => {
  if (selectedForCompare.length !== 2 || !isModelReady) return;

  const [idA, idB] = selectedForCompare;
  const itemA = memoryBank.find((item) => item.id === idA);
  const itemB = memoryBank.find((item) => item.id === idB);

  if (!itemA || !itemB) return;

  comparisonContainer.classList.remove('hidden');
  comparisonText.textContent = `Comparing ${itemA.label} and ${itemB.label} with local AI...`;
  compareBtn.disabled = true;

  try {
    const result = await compareAnalyses(itemA, itemB);
    comparisonText.textContent = result;
  } catch (err) {
    comparisonText.textContent = `Comparison Error: ${err.message}`;
  } finally {
    updateCompareButtonState();
  }
});

function toggleCompareSelection(id, checked) {
  if (checked) {
    if (selectedForCompare.includes(id)) return;
    if (selectedForCompare.length >= 2) {
      // Replace oldest selection so the user can smoothly pick a new pair
      selectedForCompare.shift();
    }
    selectedForCompare.push(id);
  } else {
    selectedForCompare = selectedForCompare.filter((itemId) => itemId !== id);
  }
  renderMemoryBank();
}

function deleteMemoryItem(id) {
  memoryBank = memoryBank.filter((item) => item.id !== id);
  selectedForCompare = selectedForCompare.filter((itemId) => itemId !== id);
  renderMemoryBank();
}

function updateCompareButtonState() {
  compareBtn.disabled = !(isModelReady && selectedForCompare.length === 2);
}

function renderMemoryBank() {
  memoryCountEl.textContent = String(memoryBank.length);
  updateCompareButtonState();

  if (memoryBank.length === 0) {
    memoryListEl.innerHTML = `<p class="empty-memory">No charts stored in temporary memory yet.</p>`;
    return;
  }

  memoryListEl.innerHTML = "";

  for (const item of memoryBank) {
    const isChecked = selectedForCompare.includes(item.id);

    const card = document.createElement('div');
    card.className = `memory-item${isChecked ? ' selected' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isChecked;
    checkbox.title = 'Select for comparison';
    checkbox.addEventListener('change', (e) => toggleCompareSelection(item.id, e.target.checked));

    const thumb = document.createElement('img');
    thumb.src = item.image;
    thumb.alt = item.label;
    thumb.className = 'memory-thumb';

    const info = document.createElement('div');
    info.className = 'memory-info';
    info.addEventListener('click', () => {
      resultContainer.classList.remove('hidden');
      summaryText.textContent = `[${item.label} • ${item.priority} • ${item.timestamp}]\n\n${item.summary}`;
    });

    const titleRow = document.createElement('div');
    titleRow.className = 'memory-title';
    titleRow.textContent = `${item.label} (${item.priority})`;

    const metaRow = document.createElement('div');
    metaRow.className = 'memory-meta';
    metaRow.textContent = `${item.timestamp} • ${item.summary.slice(0, 65)}${item.summary.length > 65 ? '...' : ''}`;

    info.appendChild(titleRow);
    info.appendChild(metaRow);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'icon-btn';
    delBtn.textContent = '×';
    delBtn.title = 'Remove from memory';
    delBtn.addEventListener('click', () => deleteMemoryItem(item.id));

    card.appendChild(checkbox);
    card.appendChild(thumb);
    card.appendChild(info);
    card.appendChild(delBtn);

    memoryListEl.appendChild(card);
  }
}
