// Store the current prompt to share with newly opened tabs
let currentPrompt = ""

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installation reason:', details.reason);
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

// Listen for messages from sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle storing the prompt for newly opened tabs
  if (message.type === "STORE_PROMPT") {
    currentPrompt = message.prompt
    sendResponse({ success: true })
  }

  // Handle opening multiple tabs with the prompt
  if (message.type === "OPEN_AI_PROVIDERS") {
    const urls = message.urls || []
    const prompt = message.prompt || ""
    
    // Store prompt in local variable for new tabs
    currentPrompt = prompt
    
    // Open each URL in a new tab
    urls.forEach((url: string) => {
      chrome.tabs.create({ url }, (tab) => {
        // We'll handle sending the prompt to the tab after it's fully loaded
        console.log(`Tab ${tab.id} created for ${url}`)
      })
    })
    
    sendResponse({ success: true })
  }
  
  return true // Keep the message channel open for async response
})

// Listen for tab updates (when a tab is loaded)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab is fully loaded and we have a prompt to send
  if (changeInfo.status === 'complete' && currentPrompt && tab.url) {
    // Check if the tab URL matches any of our AI providers
    const isAIProvider = 
      tab.url.includes('chatgpt.com') || 
      tab.url.includes('grok.com') || 
      tab.url.includes('chat.deepseek.com') || 
      tab.url.includes('claude.ai') ||
      tab.url.includes('gemini.google.com')
    
    if (isAIProvider) {
      // Send the prompt to the content script
      chrome.tabs.sendMessage(tabId, {
        type: "FILL_PROMPT",
        prompt: currentPrompt
      }).catch(err => {
        console.log(`Message couldn't be delivered to tab ${tabId} yet, content script may not be ready`)
      })
    }
  }
}) 