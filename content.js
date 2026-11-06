// content.js
let isSelecting = false;
let overlayDiv = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_selection") {
    enableElementPicker(sendResponse);
    return true; // Keep message channel open for async response
  }
});

function enableElementPicker(sendResponse) {
  if (isSelecting) return;
  isSelecting = true;

  // Create a visual indicator banner at the top of the page
  overlayDiv = document.createElement('div');
  overlayDiv.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; background: #2563eb; color: white;
    text-align: center; padding: 10px; font-family: sans-serif; font-size: 14px;
    z-index: 999999; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer;
  `;
  overlayDiv.textContent = "ReaderA: Click any chart, graph, or image on the page to select it (Click here or press ESC to cancel).";
  document.body.appendChild(overlayDiv);

  let highlightedElement = null;

  function onMouseOver(e) {
    if (e.target === overlayDiv) return;
    highlightedElement = e.target;
    highlightedElement.style.outline = "3px solid #2563eb";
    highlightedElement.style.cursor = "crosshair";
  }

  function onMouseOut(e) {
    if (e.target && e.target !== overlayDiv) {
      e.target.style.outline = "";
      e.target.style.cursor = "";
    }
  }

  function cleanup() {
    isSelecting = false;
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('mouseout', onMouseOut, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    if (overlayDiv) overlayDiv.remove();
    if (highlightedElement) {
      highlightedElement.style.outline = "";
      highlightedElement.style.cursor = "";
    }
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.target === overlayDiv) {
      cleanup();
      sendResponse({ success: false, error: "Selection cancelled by user." });
      return;
    }

    const target = highlightedElement;
    cleanup();

    // Extract asset based on type
    extractElementData(target, sendResponse);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      cleanup();
      sendResponse({ success: false, error: "Selection cancelled." });
    }
  }

  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
}

function extractElementData(element, sendResponse) {
  try {
    if (element.tagName === 'CANVAS') {
      const dataUrl = element.toDataURL("image/png");
      sendResponse({ success: true, image: dataUrl });
    } else if (element.tagName === 'IMG') {
      // If cross-origin restrictions apply, draw img to canvas to convert to base64
      convertImgToBase64(element, (base64Data) => {
        if (base64Data) {
          sendResponse({ success: true, image: base64Data });
        } else {
          sendResponse({ success: true, image: element.src });
        }
      });
    } else if (element.tagName === 'SVG' || element.closest('svg')) {
      const svgElement = element.tagName === 'SVG' ? element : element.closest('svg');
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const encodedSvg = `data:image/svg+xml;base64,${b64EncodeUnicode(svgString)}`;
      sendResponse({ success: true, image: encodedSvg });
    } else {
      // Fallback: If user clicked a container element enclosing a chart/image
      const innerImg = element.querySelector('img');
      const innerCanvas = element.querySelector('canvas');
      const innerSvg = element.querySelector('svg');

      if (innerCanvas) {
        sendResponse({ success: true, image: innerCanvas.toDataURL("image/png") });
      } else if (innerImg) {
        sendResponse({ success: true, image: innerImg.src });
      } else if (innerSvg) {
        const svgString = new XMLSerializer().serializeToString(innerSvg);
        sendResponse({ success: true, image: `data:image/svg+xml;base64,${b64EncodeUnicode(svgString)}` });
      } else {
        sendResponse({ success: false, error: "Selected element does not contain a recognizable chart, image, or canvas." });
      }
    }
  } catch (e) {
    sendResponse({ success: false, error: "Unable to extract image data due to security constraints." });
  }
}

function convertImgToBase64(img, callback) {
  const imageObj = new Image();
  imageObj.crossOrigin = 'Anonymous';
  imageObj.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = imageObj.naturalWidth || imageObj.width;
    canvas.height = imageObj.naturalHeight || imageObj.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageObj, 0, 0);
    try {
      callback(canvas.toDataURL('image/png'));
    } catch (err) {
      callback(null);
    }
  };
  imageObj.onerror = () => callback(null);
  imageObj.src = img.src;
}

function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(toSolidBytes, hex) {
    return String.fromCharCode('0x' + hex);
  }));
}
