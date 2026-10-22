// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyze_chart") {
    // Look for canvas, svg, or chart images
    const canvas = document.querySelector('canvas');
    const img = document.querySelector('img[alt*="chart"], img[alt*="graph"], img[src*="chart"]');
    const svg = document.querySelector('svg');

    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        sendResponse({ success: true, image: dataUrl });
      } catch (e) {
        sendResponse({ success: false, error: "Unable to read canvas data due to security restrictions." });
      }
    } else if (img) {
      // For standard images, convert to base64 via fetch/canvas or pass src if accessible
      sendResponse({ success: true, image: img.src });
    } else if (svg) {
      // Serialize SVG to data URL
      const svgString = new XMLSerializer().serializeToString(svg);
      const encodedSvg = `data:image/svg+xml;base64,${b-64EncodeUnicode(svgString)}`;
      sendResponse({ success: true, image: encodedSvg });
    } else {
      sendResponse({ success: false, error: "No clear chart element (canvas, svg, or image) found on this page." });
    }
  }
  return true;
});

// Helper for safe base64 encoding of unicode strings (like SVG text)
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(toSolidBytes, hex) {
    return String.fromCharCode('0x' + hex);
  }));
}
