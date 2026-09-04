// Background Service Worker for Google Maps Lead Scraper

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Google Maps Lead Scraper] Extension installed/updated.');

  // Set side panel to automatically open when user clicks the extension action icon
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('Failed to set side panel behavior:', err);
    });
  }
});

// Relay messages or handle background events if needed
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // If a message needs tab routing from side panel to active tab
  if (message.target === 'content-script') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, message.payload, (response) => {
          sendResponse(response);
        });
      } else {
        sendResponse({ error: 'No active Google Maps tab found.' });
      }
    });
    return true; // Keep message channel open for async response
  }
});
