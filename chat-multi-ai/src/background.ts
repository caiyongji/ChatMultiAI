chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installation reason:', details.reason);
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
}); 