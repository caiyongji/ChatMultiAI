import type { PlasmoCSConfig } from "plasmo"

// Configuration for the content script
export const config: PlasmoCSConfig = {
  // Match all AI provider URLs - we'll handle specific targeting in the code
  matches: [
    "https://chatgpt.com/*",
    "https://grok.com/*",
    "https://chat.deepseek.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*"
  ],
  // Run as soon as DOM is ready
  run_at: "document_end"
}

// Track if we've already processed this page
let processed = false

// Wait for the DOM to be fully loaded and interactive
function waitForPageLoad() {
  return new Promise<void>((resolve) => {
    if (document.readyState === "complete") {
      resolve()
    } else {
      window.addEventListener("load", () => resolve())
    }
  })
}

// Wait for a specific element to appear in the DOM
function waitForElement(selector: string, timeout = 10000): Promise<Element | null> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector))
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect()
        resolve(document.querySelector(selector))
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Set timeout to avoid waiting indefinitely
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}

// Function to fill the input box with prompt text and send it
async function fillInputBox(prompt: string, autoSend: boolean = false, isFollowUp: boolean = false) {
  // If this is a follow-up, don't check processed flag
  // If not a follow-up and already processed, return
  if (!isFollowUp && processed) return
  
  // Mark as processed (will be reset after completion if this is a follow-up)
  processed = true

  console.log("ChatMultiAI: Attempting to fill input box with prompt:", prompt, "autoSend:", autoSend, "isFollowUp:", isFollowUp)

  try {
    // Different handling based on current domain
    const domain = window.location.hostname
    let promptWasSent = false

    if (domain.includes("chatgpt.com")) {
      // ChatGPT input selector
      const inputBox = await waitForElement("div[id='prompt-textarea']")
      if (inputBox) {
        // For contenteditable div
        if (inputBox.getAttribute("contenteditable") === "true") {
          inputBox.textContent = prompt
          inputBox.dispatchEvent(new Event("input", { bubbles: true }))
          console.log("ChatMultiAI: Successfully filled ChatGPT input")
          
          // Auto-submit only if autoSend is true
          if (autoSend) {
            const sendButton = await waitForElement("button[data-testid='send-button']")
            if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
              sendButton.click()
              console.log("ChatMultiAI: Auto-sent prompt to ChatGPT")
              promptWasSent = true
            } else {
              console.log("ChatMultiAI: Could not find or click send button for ChatGPT")
            }
          }
        } else {
          // Fallback to find textarea
          const textarea = await waitForElement("div[data-testid='text-input-area'] textarea")
          if (textarea instanceof HTMLTextAreaElement) {
            textarea.value = prompt
            textarea.dispatchEvent(new Event("input", { bubbles: true }))
            console.log("ChatMultiAI: Successfully filled ChatGPT input (textarea)")
            
            // Auto-submit only if autoSend is true
            if (autoSend) {
              const sendButton = await waitForElement("button[data-testid='send-button']")
              if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
                sendButton.click()
                console.log("ChatMultiAI: Auto-sent prompt to ChatGPT")
                promptWasSent = true
              } else {
                console.log("ChatMultiAI: Could not find or click send button for ChatGPT (textarea)")
              }
            }
          }
        }
      }
    } 
    else if (domain.includes("grok.com")) {
      // Grok input selector
      const textarea = await waitForElement("textarea.w-full.bg-transparent.focus\\:outline-none.text-primary")
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.value = prompt
        textarea.style.height = "auto" // Reset height
        textarea.dispatchEvent(new Event("input", { bubbles: true }))
        // Trigger resize if needed
        textarea.dispatchEvent(new Event("change", { bubbles: true }))
        console.log("ChatMultiAI: Successfully filled Grok input")
        
        // Auto-submit only if autoSend is true
        if (autoSend) {
          const sendButton = await waitForElement("button[type='submit']")
          if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
            sendButton.click()
            console.log("ChatMultiAI: Auto-sent prompt to Grok")
            promptWasSent = true
          } else {
            console.log("ChatMultiAI: Could not find or click send button for Grok")
          }
        }
      }
    }
    else if (domain.includes("gemini.google.com")) {
      // Gemini input selector
      const contentEditableDiv = await waitForElement("div.ql-editor[contenteditable='true']")
      if (contentEditableDiv) {
        // Clear existing content
        contentEditableDiv.innerHTML = ""
        
        // Create a paragraph element
        const paragraph = document.createElement("p")
        paragraph.textContent = prompt
        
        // Append the paragraph to the contenteditable div
        contentEditableDiv.appendChild(paragraph)
        
        // Trigger input event
        contentEditableDiv.dispatchEvent(new Event("input", { bubbles: true }))
        console.log("ChatMultiAI: Successfully filled Gemini input")
        
        // Auto-submit only if autoSend is true
        if (autoSend) {
          const sendButton = await waitForElement("button.send-button")
          if (sendButton instanceof HTMLButtonElement) {
            sendButton.click()
            console.log("ChatMultiAI: Auto-sent prompt to Gemini")
            promptWasSent = true
          } else {
            console.log("ChatMultiAI: Could not find or click send button for Gemini")
          }
        }
      }
    }
    else if (domain.includes("chat.deepseek.com")) {
      // DeepSeek input selector
      const textarea = await waitForElement("textarea#chat-input")
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.value = prompt
        textarea.dispatchEvent(new Event("input", { bubbles: true }))
        console.log("ChatMultiAI: Successfully filled DeepSeek input")
        
        // Auto-submit only if autoSend is true
        if (autoSend) {
          const sendButton = await waitForElement("div[role='button'][aria-disabled='false']")
          if (sendButton instanceof HTMLElement) {
            sendButton.click()
            console.log("ChatMultiAI: Auto-sent prompt to DeepSeek")
            promptWasSent = true
          } else {
            console.log("ChatMultiAI: Could not find or click send button for DeepSeek")
          }
        }
      }
    }
    else if (domain.includes("claude.ai")) {
      // Claude input selector
      const contentEditableDiv = await waitForElement("div.ProseMirror[contenteditable='true']")
      if (contentEditableDiv) {
        // Clear existing content
        contentEditableDiv.innerHTML = ""
        
        // Create a paragraph element
        const paragraph = document.createElement("p")
        paragraph.textContent = prompt
        
        // Append the paragraph to the contenteditable div
        contentEditableDiv.appendChild(paragraph)
        
        // Trigger input event
        contentEditableDiv.dispatchEvent(new Event("input", { bubbles: true }))
        console.log("ChatMultiAI: Successfully filled Claude input")
        
        // Auto-submit only if autoSend is true
        if (autoSend) {
          const sendButton = await waitForElement("button[type='button'][aria-label='Send Message']")
          if (sendButton instanceof HTMLButtonElement) {
            sendButton.click()
            console.log("ChatMultiAI: Auto-sent prompt to Claude")
            promptWasSent = true
          } else {
            console.log("ChatMultiAI: Could not find or click send button for Claude")
          }
        }
      }
    }


    // Notify background script that the prompt was sent (if autoSend is true)
    if (promptWasSent) {
      chrome.runtime.sendMessage({
        type: "PROMPT_SENT"
      }).catch(err => {
        console.log("Failed to notify background script that prompt was sent:", err)
      })
    }
    
    // Reset processed flag if this is a follow-up message
    // This allows the page to process future follow-up messages
    if (isFollowUp) {
      processed = false
      console.log("ChatMultiAI: Reset processed flag for future follow-ups")
    }
  } catch (error) {
    console.error("ChatMultiAI: Error filling input box:", error)
    // Reset processed flag on error to allow retry
    if (isFollowUp) {
      processed = false
    }
  }
}

// Main execution
async function main() {
  await waitForPageLoad()
  
  // Listen for messages from the sidepanel via the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FILL_PROMPT" && message.prompt) {
      console.log("ChatMultiAI: Received FILL_PROMPT message:", message.prompt, "autoSend:", message.autoSend, "followUpMode:", message.followUpMode)
      fillInputBox(message.prompt, message.autoSend, message.followUpMode)
      sendResponse({ success: true })
    }
    return true // Keep the message channel open for async response
  })
}

main() 