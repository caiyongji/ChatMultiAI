# ChatMultiAI Toolbar and Features Implementation

This document provides a technical overview of the ChatMultiAI extension's implementation, focusing on the toolbar features, text area handling, and the communication between components.

## Table of Contents

- [Overview](#overview)
- [Toolbar Features](#toolbar-features)
  - [Auto-Send Mode](#auto-send-mode)
  - [Follow-up Mode](#follow-up-mode)
- [Text Area Implementation](#text-area-implementation)
- [Background Script and Tab Management](#background-script-and-tab-management)
- [Content Script and Message Handling](#content-script-and-message-handling)
- [Technical Challenges and Solutions](#technical-challenges-and-solutions)

## Overview

ChatMultiAI is a Chrome extension that allows users to send the same prompt to multiple AI providers simultaneously. The extension uses a side panel interface where users can select AI providers, configure models, and send messages.

The key components of the extension are:
- `sidepanel.tsx`: The main UI component
- `background.ts`: Manages tabs and handles message passing
- `ai-provider-content.ts`: Content script that interacts with AI provider websites

## Toolbar Features

The extension includes a toolbar above the text input area with two main features:

### Auto-Send Mode

**Implementation:**
```typescript
// State initialization with localStorage persistence
const [autoSend, setAutoSend] = useState(() => {
  const saved = localStorage.getItem('chatmultiai_auto_send')
  return saved ? JSON.parse(saved) : false
})

// Persistence handling
useEffect(() => {
  localStorage.setItem('chatmultiai_auto_send', JSON.stringify(autoSend))
}, [autoSend])
```

**UI Component:**
```tsx
<div className="flex items-center space-x-2">
  <label htmlFor="auto-send" className="text-sm text-muted-foreground">
    Auto-send
  </label>
  <Switch
    id="auto-send"
    checked={autoSend}
    onCheckedChange={setAutoSend}
    className="data-[state=checked]:bg-primary"
  />
</div>
```

**Functionality**: 
When enabled, messages will be automatically sent after being inserted in the AI provider's input field. When disabled, the message will only be inserted without being sent, allowing users to review or modify it before sending.

### Follow-up Mode

**Implementation:**
```typescript
// State initialization with localStorage persistence
const [followUpMode, setFollowUpMode] = useState(() => {
  const saved = localStorage.getItem('chatmultiai_follow_up_mode')
  return saved ? JSON.parse(saved) : false
})

// Persistence handling
useEffect(() => {
  localStorage.setItem('chatmultiai_follow_up_mode', JSON.stringify(followUpMode))
}, [followUpMode])
```

**UI Component:**
```tsx
<div className="flex items-center space-x-2">
  <label htmlFor="follow-up" className="text-sm text-muted-foreground">
    Follow-up Mode
  </label>
  <Switch
    id="follow-up"
    checked={followUpMode}
    onCheckedChange={setFollowUpMode}
    className="data-[state=checked]:bg-primary"
  />
</div>
```

**Functionality**: 
When enabled, the extension will find and reuse existing tabs for each AI provider instead of creating new ones. This allows for continuing conversations rather than starting new ones each time.

### Message Handling

When sending a prompt, both settings are included in the message to the background script:

```typescript
chrome.runtime.sendMessage({
  type: "OPEN_AI_PROVIDERS",
  urls: enabledProviders.map(provider => provider.url),
  prompt: prompt,
  autoSend: autoSend,
  followUpMode: followUpMode
}, (response) => {
  // Handle response
})
```

## Text Area Implementation

The text area component uses a combination of CSS and JavaScript to manage its height and behavior:

### Height Management

```typescript
// Auto-resize textarea when content changes
useEffect(() => {
  if (textareaRef.current) {
    // Reset height to auto to get the correct scrollHeight
    textareaRef.current.style.height = 'auto'

    if(prompt) {
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }
}, [prompt])
```

### CSS Classes

```tsx
<Textarea
  ref={textareaRef}
  placeholder="Type your prompt here..."
  className="min-h-[50px] max-h-[200px] resize-none mb-2 focus-visible:ring-primary overflow-y-auto overflow-x-hidden"
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  // Key event handlers...
/>
```

**Technical Note**: The initial scrollHeight value when the component mounts can be unusually large (around 520px), but once text is entered, it adjusts to match the actual content. The implementation conditionally applies height adjustment only when there is text content to avoid this issue.

## Background Script and Tab Management

The background script (`background.ts`) handles tab management and message passing between the side panel and content scripts:

### Active Tab Tracking

```typescript
// Store active AI provider tabs for follow-up mode
const activeProviderTabs = new Map<string, number>()
```

### Tab Finding

```typescript
// Find existing tab for a domain in follow-up mode
const findExistingTabForDomain = async (domain: string): Promise<number | null> => {
  // Check cached map first
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
  // ...
}
```

### Tab Creation vs. Reuse

```typescript
// If in follow-up mode, try to find existing tab for this domain
if (followUpMode) {
  tabId = await findExistingTabForDomain(domain)
}

if (tabId) {
  // Existing tab found, focus on it and send the prompt
  // ...
} else {
  // No existing tab, create a new one
  createNewTab(url, prompt, autoSend)
}
```

## Content Script and Message Handling

The content script (`ai-provider-content.ts`) interacts with AI provider websites:

### Processing Prevention Logic

A critical aspect is the `processed` flag that prevents duplicate processing on the same page:

```typescript
// Track if we've already processed this page
let processed = false

// Function to fill the input box with prompt text and send it
async function fillInputBox(prompt: string, autoSend: boolean = false, isFollowUp: boolean = false) {
  // If this is a follow-up, don't check processed flag
  // If not a follow-up and already processed, return
  if (!isFollowUp && processed) return
  
  // Mark as processed (will be reset after completion if this is a follow-up)
  processed = true
  
  // ... processing logic ...
  
  // Reset processed flag if this is a follow-up message
  if (isFollowUp) {
    processed = false
    console.log("ChatMultiAI: Reset processed flag for future follow-ups")
  }
}
```

### Message Handling

```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FILL_PROMPT" && message.prompt) {
    fillInputBox(message.prompt, message.autoSend, message.followUpMode)
    sendResponse({ success: true })
  }
  return true // Keep the message channel open for async response
})
```

## Technical Challenges and Solutions

### 1. Text Area Height Inconsistency

**Challenge**: The initial scrollHeight value is sometimes too large (520px), causing the text area to be oversized.

**Solution**: Conditional height adjustment only when there is content:

```typescript
if(prompt) {
  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
}
```

### 2. Multiple Message Processing

**Challenge**: The `processed` flag prevented sending multiple messages to the same tab in follow-up mode.

**Solution**: Added an `isFollowUp` parameter to the `fillInputBox` function that bypasses and resets the `processed` flag:

```typescript
if (!isFollowUp && processed) return
// ...
if (isFollowUp) {
  processed = false
}
```

### 3. Send Button Detection

**Challenge**: Different AI providers have different UI elements for their send buttons.

**Solution**: Custom selectors for each provider and error logging when buttons can't be found:

```typescript
// For example, for Claude:
const sendButton = await waitForElement("button[type='button'][aria-label='Send Message']")
if (sendButton instanceof HTMLButtonElement) {
  sendButton.click()
  // ...
} else {
  console.log("ChatMultiAI: Could not find or click send button for Claude")
}
```

---

This implementation enables a flexible user experience, allowing users to choose between creating new conversations or continuing existing ones, as well as controlling whether messages are sent automatically or require manual sending. 