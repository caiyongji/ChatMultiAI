# ChatMultiAI Technical Implementation

This document provides an overview of the technical implementation of the ChatMultiAI Chrome extension.

## Architecture Overview

ChatMultiAI is a Chrome browser extension built with Plasmo framework that allows users to send the same prompt to multiple AI assistants simultaneously. The extension uses a SidePanel interface to provide a clean, accessible UI for interacting with various AI providers.

## Technical Stack

- **Frontend Framework**: React with TypeScript
- **Extension Framework**: Plasmo
- **UI Components**: shadcn/ui components
- **Styling**: TailwindCSS
- **Theming**: next-themes for system-based theme switching
- **Package Manager**: pnpm

## Code Structure

```
chat-multi-ai/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── button.tsx           # Reusable button component
│   │   └── theme-provider.tsx       # Theme provider for light/dark mode
│   ├── lib/
│   │   └── utils.ts                 # Utility functions
│   ├── background.ts                # Background script for extension
│   ├── sidepanel.tsx                # Main SidePanel component
│   ├── content.tsx                  # Content script
│   └── style.css                    # Global styles
├── assets/                          # Extension icons and assets
├── tailwind.config.js               # TailwindCSS configuration
├── package.json                     # Project dependencies and manifest
└── README.md                        # Project documentation
```

## Components

### SidePanel (sidepanel.tsx)

The main component of the extension, providing the user interface within Chrome's side panel. Key features:

- State management for AI providers and user prompt
- Toggle functionality to select/deselect AI providers
- Text area for entering prompts
- Send functionality that opens selected AI platforms in new tabs
- System-based theme switching (light/dark mode)

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

### Theme Detection (ThemeDetector component)

Automatically detects system theme preference and updates the UI accordingly:

```typescript
const ThemeDetector = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme()

  useEffect(() => {
    // Check if system prefers dark mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    // Set theme based on system preference
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setTheme(e.matches ? "dark" : "light")
    }
    
    // Set initial theme
    updateTheme(mediaQuery)
    
    // Listen for theme changes
    mediaQuery.addEventListener("change", updateTheme)
    
    return () => {
      mediaQuery.removeEventListener("change", updateTheme)
    }
  }, [setTheme])

  return <>{children}</>
}
```

### Background Script (background.ts)

Handles extension installation and sets up the SidePanel behavior:

```typescript
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installation reason:', details.reason);
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});
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
      "<all_urls>"
    ],
    "permissions": [
      "sidePanel"
    ]
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