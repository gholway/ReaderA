// panel.js
import { initializeLocalModel, processChartWithAI } from './Logic.js';

const analyzeBtn = document.getElementById('analyze-btn');
const summaryText = document.getElementById('summary-text');
const resultContainer = document.getElementById('result-container');
const statusBox = document.getElementById('status-box');

// Initialize local model on panel load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    statusBox.textContent = "Loading local AI model (this may take a minute on first run)...";
    await initializeLocalModel((progressText) => {
      statusBox.textContent = progressText;
    });
    statusBox.textContent = "Local AI model ready!";
    statusBox.style.color = "#059669";
    analyzeBtn.disabled = false;
  } catch (err) {
    statusBox.textContent = `Failed to load model: ${err.message}`;
    statusBox.style.color = "#dc2626";
  }
});

analyzeBtn.addEventListener('click', async () => {
  resultContainer.classList.remove('hidden');
  summaryText.textContent = "Scanning page for charts and graphs...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      summaryText.textContent = "Error: No active tab found.";
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "analyze_chart" }, async (response) => {
      if (chrome.runtime.lastError) {
        summaryText.textContent = "Error: Please refresh the webpage and try again.";
        return;
      }
      
      if (!response || !response.success) {
        summaryText.textContent = response?.error || "No charts detected on this page.";
        return;
      }

      summaryText.textContent = "Chart detected! Analyzing with local AI model...";

      try {
        const aiSummary = await processChartWithAI(response.image);
        summaryText.textContent = aiSummary;
      } catch (aiError) {
        summaryText.textContent = `AI Error: ${aiError.message}`;
      }
    });

  } catch (err) {
    summaryText.textContent = `Initialization Error: ${err.message}`;
  }
});
