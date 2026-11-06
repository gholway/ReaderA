// panel.js
import { initializeLocalModel, processChartWithAI } from './Logic.js';

const selectBtn = document.getElementById('select-btn');
const summaryText = document.getElementById('summary-text');
const resultContainer = document.getElementById('result-container');
const statusBox = document.getElementById('status-box');

window.addEventListener('DOMContentLoaded', async () => {
  try {
    statusBox.textContent = "Loading local AI model (this may take a minute on first run)...";
    await initializeLocalModel((progressText) => {
      statusBox.textContent = progressText;
    });
    statusBox.textContent = "Local AI model ready!";
    statusBox.style.color = "#059669";
    selectBtn.disabled = false;
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
        const aiSummary = await processChartWithAI(response.image);
        summaryText.textContent = aiSummary;
      } catch (aiError) {
        summaryText.textContent = `AI Error: ${aiError.message}`;
      }
    });

  } catch (err) {
    summaryText.textContent = `Error: ${err.message}`;
  }
});
