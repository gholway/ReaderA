chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyze_chart") {
    // Placeholder logic: Look for canvas, svg, or chart elements on the page
    const charts = document.querySelectorAll('canvas, svg, img[alt*="chart"], img[alt*="graph"]');
    
    if (charts.length > 0) {
      // In later stages, you will capture image data here and send it to Logic.js / AI API
      sendResponse({ summary: `Found ${charts.length} potential chart(s) on this page. Ready for AI processing!` });
    } else {
      sendResponse({ summary: "No charts or graphs found in the current view." });
    }
  }
  return true;
});
