// Store the current prompt to share with newly opened tabs
let currentPrompt = ""
// 存储每个标签页ID和对应的域名
const tabDomains = new Map<number, string>()

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
        // 跟踪每个新标签页及其URL域名
        if (tab.id) {
          const domain = new URL(url).hostname
          tabDomains.set(tab.id, domain)
          console.log(`Tab ${tab.id} created for ${url} (${domain})`)
        }
      })
    })
    
    // Set a timeout to clear the prompt after all tabs have been processed
    // This ensures we don't auto-fill if the user reopens these sites later
    setTimeout(() => {
      currentPrompt = ""
      console.log("Cleared prompt from background script memory")
    }, 30000) // Clear after 30 seconds, giving tabs time to load
    
    sendResponse({ success: true })
  }
  
  // Handle notification that a prompt has been sent successfully
  if (message.type === "PROMPT_SENT") {
    // 接收到消息后，清除这个标签页的记录
    if (sender.tab && sender.tab.id) {
      tabDomains.delete(sender.tab.id)
      console.log(`Received prompt sent notification for tab ${sender.tab.id}, removed from tracking`)
    }
    sendResponse({ success: true })
  }
  
  return true // Keep the message channel open for async response
})

// Listen for tab updates (when a tab is loaded)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab is fully loaded and we have a prompt to send
  if (changeInfo.status === 'complete' && currentPrompt && tab.url) {
    // 检查这个标签页是否是我们正在跟踪的
    const isDomainTracked = tabDomains.has(tabId)
    
    if (isDomainTracked) {
      console.log(`Tab ${tabId} is ready to receive prompt`)
      
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

// Listen for tab close events to clean up our tracking
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabDomains.has(tabId)) {
    tabDomains.delete(tabId)
    console.log(`Tab ${tabId} was closed, removed from tracking`)
  }
}) 