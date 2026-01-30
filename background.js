// Background service worker for the extension
console.log('Market Insight background service worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Market Insight extension installed');
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze') {
    handleAnalysis(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

async function handleAnalysis(data) {
  // This function will coordinate the analysis
  // For now, just a placeholder
  return data;
}
