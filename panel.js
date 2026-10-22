// panel.js
document.getElementById('analyze-btn').addEventListener('click', async () => {
  const summaryText = document.getElementById('summary-text');
  const resultContainer = document.getElementById('result-container');
  
  resultContainer.classList.remove('hidden');
  summaryText.textContent = "Scanning page for charts and graphs...";

  try {
    // 1. Load config
    const configResponse = await fetch(chrome.runtime.getURL('config.json'));
    const config = await configResponse.json();

    // 2. Query active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      summaryText.textContent = "Error: No active tab found.";
      return;
    }

    // 3. Request chart image from content script
    chrome.tabs.sendMessage(tab.id, { action: "analyze_chart" }, async (response) => {
      if (chrome.runtime.lastError) {
        summaryText.textContent = "Error: Please refresh the webpage and try again.";
        return;
      }
      
      if (!response || !response.success) {
        summaryText.textContent = response?.error || "No charts detected on this page.";
        return;
      }

      summaryText.textContent = "Chart detected! Processing with AI model...";

      try {
        // 4. Send image data to Logic.js AI function
        const aiSummary = await processChartWithAI(response.image, config);
        summaryText.textContent = aiSummary;
      } catch (aiError) {
        summaryText.textContent = `AI Error: ${aiError.message}`;
      }
    });

  } catch (err) {
    summaryText.textContent = `Initialization Error: ${err.message}`;
  }
});
