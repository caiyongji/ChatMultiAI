# ChatMultiAI - Technical Implementation Guide

## Project Overview

ChatMultiAI is a Chrome extension that allows users to send the same prompt to multiple AI platforms simultaneously. It uses a sidebar interface to manage providers, configure preferences, and send prompts. When the user sends a prompt, the extension opens each selected AI provider in a new tab and automatically fills the input fields with the user's prompt text.

## Architecture

The extension is built using the following technologies:
- **Plasmo Framework**: For Chrome extension development
- **React**: For UI components
- **TypeScript**: For type-safe code
- **Tailwind CSS**: For styling
- **ShadCN UI**: For reusable UI components

The extension consists of four primary components:
1. **Sidepanel UI**: The main user interface where providers are selected and prompts are entered
2. **Background Service**: Handles communication between the sidepanel and content scripts
3. **Content Scripts**: Execute in the context of AI provider websites to fill input fields
4. **Theme Management**: Provides light/dark/system theme support

## Key Components

### 1. Sidepanel UI (`sidepanel.tsx`)

The sidepanel interface allows users to:
- Toggle which AI providers are active
- Select specific models for each provider
- Enter prompts
- Send prompts to all active providers
- Toggle between light, dark, and system themes

```typescript
// Provider interface
interface AIProvider {
  id: string
  name: string
  enabled: boolean
  url: string
  icon: React.ReactNode
  models: string[]
  selected: string
}
```

Currently supported AI providers:
- ChatGPT
- Grok
- DeepSeek
- Claude
- Gemini

The send prompt functionality works by storing the prompt in localStorage and sending a message to the background script:

```typescript
// Send prompt to AI providers
const handleSendPrompt = () => {
  if (!prompt.trim()) return
  
  const enabledProviders = providers.filter((provider) => provider.enabled)
  
  if (enabledProviders.length === 0) return
  
  // Store the prompt in localStorage for content script to access
  localStorage.setItem("chatmultiai_prompt", prompt)
  
  // Send message to background script with URLs and prompt
  chrome.runtime.sendMessage({
    type: "OPEN_AI_PROVIDERS",
    urls: enabledProviders.map(provider => provider.url),
    prompt: prompt
  }, (response) => {
    // Handle response...
  })
}
```

### 2. Background Service (`background.ts`)

The background script serves as a communication bridge:

1. Stores the current prompt in memory
2. Receives messages from the sidepanel
3. Opens tabs for each enabled AI provider
4. Monitors tab loading status
5. Sends the prompt to content scripts when tabs are fully loaded

```typescript
// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && currentPrompt && tab.url) {
    const isAIProvider = 
      tab.url.includes('chatgpt.com') || 
      tab.url.includes('grok.com') || 
      tab.url.includes('chat.deepseek.com') || 
      tab.url.includes('claude.ai') ||
      tab.url.includes('gemini.google.com')
    
    if (isAIProvider) {
      chrome.tabs.sendMessage(tabId, {
        type: "FILL_PROMPT",
        prompt: currentPrompt
      }).catch(err => {
        console.log(`Message couldn't be delivered to tab ${tabId} yet...`)
      })
    }
  }
})
```

### 3. Content Script (`contents/ai-provider-content.ts`)

The content script runs in the context of each AI provider website and:
1. Identifies the appropriate input field
2. Fills it with the user's prompt
3. Handles domain-specific implementation details

```typescript
async function fillInputBox(prompt: string) {
  // Different handling based on domain
  const domain = window.location.hostname

  if (domain.includes("chatgpt.com")) {
    const inputBox = await waitForElement("div[data-testid='text-input-area'] textarea")
    if (inputBox instanceof HTMLTextAreaElement) {
      inputBox.value = prompt
      inputBox.dispatchEvent(new Event("input", { bubbles: true }))
    }
  } 
  else if (domain.includes("grok.com")) {
    // TODO: Grok specific implementation
  }
  // Other providers...
}
```

The content script uses a `MutationObserver` to wait for input elements to appear, as many modern AI interfaces load elements dynamically.

### 4. Theme Management

The extension supports light, dark, and system themes using a simple toggle button. The current implementation:

1. Uses the DOM to directly manage theme classes
2. Stores theme preference in localStorage
3. Monitors system theme changes
4. Cycles through themes (light → dark → system) on button click

```typescript
// Apply theme setting
const applyTheme = (newTheme: Theme) => {
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (newTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (newTheme === 'system') {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Apply appropriate theme...
  }
};
```

## Communication Flow

1. **User Interaction**: User enters a prompt and clicks "Send to AI providers"
2. **Sidepanel → Background**: Sends message with prompt and selected provider URLs
3. **Background Script**: Opens tabs for each provider and stores prompt
4. **Tab Loading**: Background monitors when tabs are fully loaded
5. **Background → Content Script**: Sends the prompt to the content script
6. **Content Script**: Identifies the input field and fills it with the prompt

## Extension Permissions

The extension requires the following permissions:
- `sidePanel`: To create the sidebar UI
- `storage`: For storing preferences
- `tabs`: To open and communicate with tabs
- `scripting`: To inject and execute scripts in target pages

Host permissions are limited to the AI providers' domains:
```json
"host_permissions": [
  "https://chatgpt.com/*",
  "https://grok.com/*",
  "https://chat.deepseek.com/*",
  "https://claude.ai/*",
  "https://gemini.google.com/*"
]
```

## Future Enhancements

1. **Complete Provider Support**: Implement input field detection for all providers (currently only ChatGPT is fully implemented)
2. **Response Collection**: Collect and compare responses from different providers
3. **Custom Prompts**: Save and reuse prompt templates
4. **Enhanced UI**: More customization options for the sidepanel

## Development Notes

- The content script contains TODO comments for implementing provider-specific input selectors
- The implementation uses a robust messaging system to ensure reliable communication between components
- Theme implementation uses direct DOM manipulation to ensure consistent theme application 