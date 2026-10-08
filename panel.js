document.getElementById('analyze-btn').addEventListener('click', async () => {
  const summaryText = document.getElementById('summary-text');
  const resultContainer = document.getElementById('result-container');
  
  resultContainer.classList.remove('hidden');
  summaryText.textContent = "Scanning page for charts and graphs...";

  // Query active tab to communicate with content.js
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: "analyze_chart" }, (response) => {
      if (chrome.runtime.lastError) {
        summaryText.textContent = "Error: Please refresh the webpage and try again.";
        return;
      }
      
      if (response && response.summary) {
        summaryText.textContent = response.summary;
      } else {
        summaryText.textContent = "No charts detected on this page.";
      }
    });
  }
});
