// Store the current prompt to share with newly opened tabs
let currentPrompt = ""
// Store each tab ID and its corresponding domain
const tabDomains = new Map<number, string>()
// Store active AI provider tabs for follow-up mode
const activeProviderTabs = new Map<string, number>()

// Helper function to extract domain from URL
const getDomainFromUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname
    // Extract base domain for matching
    if (hostname.includes('chatgpt.com')) return 'chatgpt.com'
    if (hostname.includes('grok.com')) return 'grok.com'
    if (hostname.includes('chat.deepseek.com')) return 'chat.deepseek.com'
    if (hostname.includes('claude.ai')) return 'claude.ai'
    if (hostname.includes('gemini.google.com')) return 'gemini.google.com'
    return hostname
  } catch (e) {
    console.error("Invalid URL:", url)
    return ""
  }
}

// Helper function to find existing tab for a domain
const findExistingTabForDomain = async (domain: string): Promise<number | null> => {
  // First check our cached map
  if (activeProviderTabs.has(domain)) {
    const tabId = activeProviderTabs.get(domain)
    
    // Verify tab still exists
    try {
      if (tabId) {
        const tab = await chrome.tabs.get(tabId)
        if (tab && !tab.discarded) {
          return tabId
        }
      }
    } catch (e) {
      // Tab doesn't exist anymore
      activeProviderTabs.delete(domain)
    }
  }
  
  // Fallback to searching all tabs
  try {
    const tabs = await chrome.tabs.query({})
    for (const tab of tabs) {
      if (tab.url && tab.id && getDomainFromUrl(tab.url) === domain) {
        // Cache this tab for future use
        activeProviderTabs.set(domain, tab.id)
        return tab.id
      }
    }
  } catch (e) {
    console.error("Error searching tabs:", e)
  }
  
  return null
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installation reason:', details.reason);
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

// Listen for messages from sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle opening multiple tabs with the prompt
  if (message.type === "OPEN_AI_PROVIDERS") {
    const { urls, prompt, autoSend, followUpMode } = message
    console.log("Opening AI providers with prompt:", prompt, "autoSend:", autoSend, "followUpMode:", followUpMode)
    
    // Store prompt in local variable for new tabs
    currentPrompt = prompt
    
    // For each URL
    Promise.all(urls.map(async (url: string) => {
      const domain = getDomainFromUrl(url)
      let tabId: number | null = null
      
      // If in follow-up mode, try to find existing tab for this domain
      if (followUpMode) {
        tabId = await findExistingTabForDomain(domain)
      }
      
      if (tabId) {
        // Existing tab found, focus on it and send the prompt
        try {
          await chrome.tabs.update(tabId, { active: true })
          
          // Send message to content script with prompt and autoSend setting
          chrome.tabs.sendMessage(tabId, {
            type: "FILL_PROMPT",
            prompt,
            autoSend
          }).catch((err) => {
            console.error(`Failed to send message to tab ${tabId}:`, err)
          })
          
          console.log(`Using existing tab ${tabId} for ${domain}`)
        } catch (e) {
          console.error(`Error focusing tab ${tabId}:`, e)
          // If there was an error, fall back to creating a new tab
          createNewTab(url, prompt, autoSend)
        }
      } else {
        // No existing tab, create a new one
        createNewTab(url, prompt, autoSend)
      }
    }))
    
    // Set a timeout to clear the prompt after all tabs have been processed
    setTimeout(() => {
      currentPrompt = ""
      console.log("Cleared prompt from background script memory")
    }, 30000) // Clear after 30 seconds, giving tabs time to load
    
    sendResponse({ success: true })
  }
  
  // Handle notification that a prompt has been sent successfully
  if (message.type === "PROMPT_SENT") {
    // When we receive this message, update our tracking
    if (sender.tab && sender.tab.id && sender.tab.url) {
      const domain = getDomainFromUrl(sender.tab.url)
      if (domain) {
        // Add/update to active providers
        activeProviderTabs.set(domain, sender.tab.id)
        console.log(`Updated active tab for ${domain}: ${sender.tab.id}`)
      }
    }
    sendResponse({ success: true })
  }
  
  return true // Keep the message channel open for async response
})

// Helper function to create a new tab
function createNewTab(url: string, prompt: string, autoSend: boolean) {
  chrome.tabs.create({ url }, (tab) => {
    if (tab.id) {
      const domain = getDomainFromUrl(url)
      if (domain) {
        // Add to active providers
        activeProviderTabs.set(domain, tab.id)
        console.log(`Created new tab ${tab.id} for ${domain}`)
      }
      
      // Wait for the page to load before sending the message
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, updatedTab) {
        if (tabId === tab.id && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener)
          // Send message to content script with prompt and autoSend setting
          chrome.tabs.sendMessage(tabId, {
            type: "FILL_PROMPT",
            prompt,
            autoSend
          }).catch((err) => {
            console.error("Failed to send message to content script:", err)
          })
        }
      })
    }
  })
}

// Listen for tab close events to clean up our tracking
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Remove from active provider tabs
  for (const [domain, id] of activeProviderTabs.entries()) {
    if (id === tabId) {
      activeProviderTabs.delete(domain)
      console.log(`Tab ${tabId} for ${domain} was closed, removed from tracking`)
    }
  }
}) 