chrome.runtime.onInstalled.addListener(() => {
  console.log("[Google Maps Lead Scraper] Extension installed/updated."), chrome.sidePanel && chrome.sidePanel.setPanelBehavior && chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: !0 }).catch((e) => {
    console.warn("Failed to set side panel behavior:", e);
  });
});
chrome.runtime.onMessage.addListener((e, n, r) => {
  if (e.target === "content-script")
    return chrome.tabs.query({ active: !0, currentWindow: !0 }, (t) => {
      const a = t[0];
      a && a.id ? chrome.tabs.sendMessage(a.id, e.payload, (o) => {
        r(o);
      }) : r({ error: "No active Google Maps tab found." });
    }), !0;
});
