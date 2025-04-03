# ChatMultiAI Implementation Summary

This document provides a comprehensive technical overview of the ChatMultiAI Chrome extension implementation, based on our development process and final code.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Component Architecture](#component-architecture)
- [User Interface](#user-interface)
  - [Side Panel](#side-panel)
  - [Toolbar](#toolbar)
  - [Provider Selection](#provider-selection)
- [Data Persistence](#data-persistence)
- [Tab Management](#tab-management)
- [Content Injection](#content-injection)
- [Technical Challenges Solved](#technical-challenges-solved)
- [Browser Permissions](#browser-permissions)

## Overview

ChatMultiAI is a Chrome extension that enables users to send the same prompt to multiple AI providers simultaneously. It features a side panel interface where users can select their preferred AI services, configure models for each provider, and send prompts that will be automatically filled into each provider's web interface.

## Key Features

1. **Multi-AI Provider Support**: Integrates with popular AI services:
   - ChatGPT
   - Grok
   - Gemini
   - DeepSeek
   - Claude

2. **Persistent Provider Configuration**:
   - Remember enabled/disabled state for each provider
   - Store selected model preferences
   - Persist settings across browser sessions

3. **Theme Support**:
   - Light/Dark/System theme options
   - Theme-specific icons for each provider
   - Smooth theme switching

4. **Toolbar Controls**:
   - Auto-send toggle: Controls whether messages are automatically sent
   - Follow-up mode: Allows continuing existing conversations instead of creating new ones

5. **Dynamic Text Area**:
   - Auto-resizing input field
   - Support for multi-line input
   - Enter to send, Shift+Enter for new line

6. **Tab Management**:
   - Create new tabs or reuse existing ones (based on Follow-up mode)
   - Track open AI provider tabs
   - Clean up tracking when tabs are closed

## Component Architecture

The extension is built with the following key components:

1. **Side Panel UI** (`sidepanel.tsx`):
   - Main user interface
   - Provider configuration
   - Theme handling
   - Text input and sending controls

2. **Background Script** (`background.ts`):
   - Tab management
   - Message routing
   - Domain tracking
   - Follow-up mode implementation

3. **Content Script** (`ai-provider-content.ts`):
   - Interacts with AI provider websites
   - Fills input fields
   - Sends messages when auto-send is enabled
   - Handles follow-up messages

## User Interface

### Side Panel

The side panel provides the main interface for the extension, featuring:

- Header with logo and theme toggle
- Provider selection accordion
- Input area with toolbar and send button

```tsx
<div className="flex flex-col h-screen bg-background">
  <div className="p-4 flex items-center justify-between border-b">
    {/* Header with logo and theme toggle */}
  </div>

  <div className="flex-grow overflow-auto p-4">
    {/* Provider accordion */}
  </div>

  <div className="sticky bottom-0 bg-background pt-2 p-4 border-t">
    {/* Toolbar and input area */}
  </div>
</div>
```

### Toolbar

The toolbar provides control over how messages are sent:

```tsx
<div className="flex items-center justify-end mb-2">
  <div className="flex items-center space-x-4">
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
  </div>
</div>
```

### Provider Selection

Each AI provider is displayed in an accordion item with:
- Toggle switch to enable/disable
- Provider icon (theme-aware)
- Provider name
- Model selection dropdown

```tsx
<AccordionItem value={provider.id} key={provider.id}>
  <div className="flex items-center">
    <Switch
      id={`provider-${provider.id}`}
      checked={provider.enabled}
      onCheckedChange={() => toggleProvider(provider.id)}
      className="mr-2 data-[state=checked]:bg-primary"
    />
    <AccordionTrigger className="flex-1 py-2">
      <div className="flex items-center gap-2">
        {provider.icon}
        <span className="font-medium">{provider.name}</span>
      </div>
    </AccordionTrigger>
  </div>
  <AccordionContent className="p-2 pt-0">
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground mb-1">Select model:</p>
      <Select
        value={provider.selected}
        onValueChange={(value) => handleModelChange(provider.id, value)}
        disabled={!provider.enabled}
      >
        {/* Model options */}
      </Select>
    </div>
  </AccordionContent>
</AccordionItem>
```

## Data Persistence

The extension uses `localStorage` to persist various settings:

1. **Theme Preferences**:
   ```typescript
   localStorage.setItem('theme', theme)
   ```

2. **Provider Configuration**:
   ```typescript
   const serializableProviders = providers.map(provider => ({
     id: provider.id,
     name: provider.name,
     enabled: provider.enabled,
     url: provider.url,
     models: provider.models,
     selected: provider.selected
   }))
   
   localStorage.setItem('chatmultiai_providers', JSON.stringify(serializableProviders))
   ```

3. **Toolbar Settings**:
   ```typescript
   localStorage.setItem('chatmultiai_auto_send', JSON.stringify(autoSend))
   localStorage.setItem('chatmultiai_follow_up_mode', JSON.stringify(followUpMode))
   ```

## Tab Management

Tab management is a critical part of the extension, especially for the follow-up mode:

1. **Tab Tracking**:
   ```typescript
   const activeProviderTabs = new Map<string, number>()
   ```

2. **Finding Existing Tabs**:
   ```typescript
   const findExistingTabForDomain = async (domain: string): Promise<number | null> => {
     // Check cached map and verify tab still exists
     // Fallback to searching all tabs
   }
   ```

3. **Tab Reuse Logic**:
   ```typescript
   if (followUpMode) {
     tabId = await findExistingTabForDomain(domain)
     
     if (tabId) {
       // Use existing tab
       await chrome.tabs.update(tabId, { active: true })
       chrome.tabs.sendMessage(tabId, {/*...*/})
     } else {
       // Create new tab
       createNewTab(url, prompt, autoSend)
     }
   } else {
     // Always create new tab when not in follow-up mode
     createNewTab(url, prompt, autoSend)
   }
   ```

4. **Tab Cleanup**:
   ```typescript
   chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
     // Remove closed tabs from tracking
     for (const [domain, id] of activeProviderTabs.entries()) {
       if (id === tabId) {
         activeProviderTabs.delete(domain)
       }
     }
   })
   ```

## Content Injection

For each AI provider, the extension injects content differently:

| Provider | Input Method | Send Button Selector |
|----------|-------------|---------------------|
| ChatGPT | contenteditable div or textarea | button[data-testid='send-button'] |
| Grok | textarea | button[type='submit'] |
| Gemini | contenteditable div | button.send-button |
| DeepSeek | textarea | div[role='button'][aria-disabled='false'] |
| Claude | contenteditable div | button[type='button'][aria-label='Send Message'] |

The content script handles follow-up mode specially:

```typescript
async function fillInputBox(prompt: string, autoSend: boolean = false, isFollowUp: boolean = false) {
  // Skip processing check for follow-ups
  if (!isFollowUp && processed) return
  
  processed = true
  
  // Input field filling logic...
  
  // Reset processed flag for follow-ups
  if (isFollowUp) {
    processed = false
  }
}
```

## Technical Challenges Solved

1. **Dynamic Text Area Height**:
   - Issue: Initial scrollHeight value (~520px) caused oversized text area
   - Solution: Conditional height adjustment only when text is present
   ```typescript
   if (prompt) {
     textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
   }
   ```

2. **React Node Serialization**:
   - Issue: Icons (React nodes) can't be serialized to localStorage
   - Solution: Store only serializable data and reconstruct React nodes
   ```typescript
   const serializableProviders = providers.map(provider => ({
     // Omit icon property
   }))
   ```

3. **Follow-up Processing**:
   - Issue: Processing flag prevented multiple messages to same tab
   - Solution: Add isFollowUp parameter and reset processing flag
   ```typescript
   if (isFollowUp) {
     processed = false
   }
   ```

4. **Send Button Detection**:
   - Issue: Different AI providers have different send button implementations
   - Solution: Custom selectors for each provider with detailed error logging
   ```typescript
   if (sendButton instanceof HTMLButtonElement) {
     sendButton.click()
   } else {
     console.log("ChatMultiAI: Could not find or click send button")
   }
   ```

## Browser Permissions

The extension uses the following permissions:

```json
"permissions": [
  "sidePanel",
  "storage",
  "tabs",
  "scripting"
],
"host_permissions": [
  "https://chatgpt.com/*",
  "https://grok.com/*",
  "https://chat.deepseek.com/*",
  "https://claude.ai/*",
  "https://gemini.google.com/*"
]
```

- `sidePanel`: Used for the extension's main interface
- `tabs`: Used to create, track, and interact with tabs
- `storage` and `scripting`: Support permissions for extension operation
- Host permissions: Required to interact with specific AI provider websites

---

This implementation provides a seamless experience for users who want to compare responses from multiple AI providers or maintain consistent conversations across different AI services. 