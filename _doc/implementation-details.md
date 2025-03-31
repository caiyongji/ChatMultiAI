# ChatMultiAI Technical Implementation

This document provides an overview of the technical implementation of the ChatMultiAI Chrome extension.

## Architecture Overview

ChatMultiAI is a Chrome browser extension built with Plasmo framework that allows users to send the same prompt to multiple AI assistants simultaneously. The extension uses a SidePanel interface to provide a clean, accessible UI for interacting with various AI providers.

## Technical Stack

- **Frontend Framework**: React with TypeScript
- **Extension Framework**: Plasmo
- **UI Components**: shadcn/ui components
- **Styling**: TailwindCSS
- **Package Manager**: pnpm

## Code Structure

```
chat-multi-ai/
├── src/
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx           # Reusable button component
│   │   ├── lib/
│   │   │   └── utils.ts                 # Utility functions
│   │   ├── sidepanel.tsx                # Main SidePanel component
│   │   ├── content.tsx                  # Content script
│   │   ├── popup.tsx                    # Popup component
│   │   └── style.css                    # Global styles
│   ├── assets/                          # Extension icons and assets
│   ├── tailwind.config.js               # TailwindCSS configuration
│   ├── package.json                     # Project dependencies and manifest
│   └── README.md                        # Project documentation
```

## Components

### SidePanel (sidepanel.tsx)

The main component of the extension, providing the user interface within Chrome's side panel. Key features:

- State management for AI providers and user prompt
- Toggle functionality to select/deselect AI providers
- Text area for entering prompts
- Send functionality that opens selected AI platforms in new tabs

```typescript
// Key state management
const [prompt, setPrompt] = useState<string>("")
const [aiProviders, setAiProviders] = useState<AiProvider[]>([
  // Provider configurations...
])

// Toggle provider selection
const toggleProvider = (id: string) => {
  setAiProviders(
    aiProviders.map((provider) =>
      provider.id === id
        ? { ...provider, enabled: !provider.enabled }
        : provider
    )
  )
}

// Send prompt to selected providers
const handleSendPrompt = () => {
  if (!prompt.trim()) return
  
  const enabledProviders = aiProviders.filter((provider) => provider.enabled)
  
  enabledProviders.forEach((provider) => {
    window.open(provider.url, "_blank")
  })
  
  setPrompt("")
}
```

### Button Component (components/ui/button.tsx)

A reusable button component built with shadcn/ui styling system:

- Supports multiple variants (default, destructive, outline, etc.)
- Configurable sizes (sm, default, lg, icon)
- Uses class-variance-authority for style variants

## Styling

The project uses TailwindCSS with a custom theme configuration that provides:

- Light and dark mode support
- Custom color variables
- Consistent spacing and typography
- Animation utilities

Color scheme variables are defined in CSS using HSL values:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* Additional variables... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* Dark theme variables... */
}
```

## Chrome Extension Configuration

The extension is configured in `package.json` with the following key settings:

```json
"manifest": {
  "host_permissions": [
    "https://*/*"
  ],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "permissions": [
    "sidePanel"
  ],
  "action": {
    "default_title": "ChatMultiAI",
    "default_icon": {
      "16": "assets/icon16.png",
      "32": "assets/icon32.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    }
  }
}
```

## AI Providers

The extension currently supports the following AI providers:

1. **ChatGPT** (https://chat.openai.com/)
2. **Grok** (https://grok.x.ai/)
3. **DeepSeq** (https://deepseek.ai/)
4. **Claude** (https://claude.ai/)

Each provider is defined with:
- Unique ID
- Display name
- Default enabled state
- URL endpoint

## User Flow

1. User opens the ChatMultiAI SidePanel in Chrome
2. Selects which AI providers they want to use
3. Types a prompt in the text area
4. Clicks "Send to AI providers"
5. The extension opens a new browser tab for each selected provider

## Future Enhancements

Potential future improvements include:
- Direct API integration with AI providers
- Saving and loading prompt templates
- Conversation history management
- Customizable provider settings
- Side-by-side comparison of responses 