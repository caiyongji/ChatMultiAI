import "./globals.css"
import { useState, useEffect, useRef, useCallback } from "react"
// import cssText from "data-text:@/globals.css"
import type { PlasmoCSConfig } from "plasmo"
import { Moon, Sun, Send, Monitor } from "lucide-react"
import logoIcon from "data-base64:~images/logo.png"
import { useTheme } from "next-themes"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 导入AI提供商的图标
import chatgptLightIcon from "data-base64:~images/chatgpt-light.svg"
import chatgptDarkIcon from "data-base64:~images/chatgpt-dark.svg"
import claudeLightIcon from "data-base64:~images/claude-light.svg"
import claudeDarkIcon from "data-base64:~images/claude-dark.svg"
import geminiLightIcon from "data-base64:~images/gemini-light.svg"
import geminiDarkIcon from "data-base64:~images/gemini-dark.svg"
import grokLightIcon from "data-base64:~images/grok-light.svg"
import grokDarkIcon from "data-base64:~images/grok-dark.svg"
import deepseekLightIcon from "data-base64:~images/deepseek-light.svg"
import deepseekDarkIcon from "data-base64:~images/deepseek-dark.svg"

export const config: PlasmoCSConfig = {
  css: ["font-src: self;"]
}

// Plasmo CSS handling is not needed when importing CSS directly
// export const getStyle = () => {
//   const style = document.createElement("style")
//   style.textContent = cssText
//   return style
// }

export const getShadowHostId = () => "plasmo-shadow-host"

// 主题类型
type Theme = 'light' | 'dark' | 'system';

// 主题顺序：按照点击循环顺序定义
const themeOrder: Theme[] = ['light', 'dark', 'system'];

interface AIProvider {
  id: string
  name: string
  enabled: boolean
  url: string
  icon: React.ReactNode
  models: string[]
  selected: string
}

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  
  // 初始化主题
  useEffect(() => {
    // 这里可以改成从chrome.storage读取
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [setTheme])
  
  // Function to cycle through themes
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }
  
  // Get the appropriate icon for the current theme
  const getThemeIcon = () => {
    switch(theme) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'dark': return <Moon className="h-4 w-4" />
      case 'system': return <Monitor className="h-4 w-4" />
      default: return <Sun className="h-4 w-4" />
    }
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full h-8 w-8"
      onClick={toggleTheme}
      title={`Theme: ${theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : 'System'}`}
    >
      {getThemeIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

const ChatMultiAIContent = () => {
  const [prompt, setPrompt] = useState<string>("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Get theme information from next-themes
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  console.log("currentTheme: ", currentTheme)
  
  // Helper function to get icon for provider based on theme, memoized with useCallback
  const getIconForProvider = useCallback((providerId: string) => {
    const textColor = isDark ? "text-white-400" : "text-black-400"
    
    switch(providerId) {
      case "chatgpt": 
        return <img src={isDark ? chatgptDarkIcon : chatgptLightIcon} className={`h-5 w-5 ${textColor}`} alt="ChatGPT" />
      case "grok": 
        return <img src={isDark ? grokDarkIcon : grokLightIcon} className={`h-5 w-5 ${textColor}`} alt="Grok" />
      case "deepseek": 
        return <img src={isDark ? deepseekDarkIcon : deepseekLightIcon} className={`h-5 w-5 ${textColor}`} alt="DeepSeek" />
      case "claude": 
        return <img src={isDark ? claudeDarkIcon : claudeLightIcon} className={`h-5 w-5 ${textColor}`} alt="Claude" />
      case "gemini": 
        return <img src={isDark ? geminiDarkIcon : geminiLightIcon} className={`h-5 w-5 ${textColor}`} alt="Gemini" />
      default: 
        return <img src={isDark ? chatgptDarkIcon : chatgptLightIcon} className={`h-5 w-5 ${textColor}`} alt="AI" />
    }
  }, [isDark]) // Only re-create when isDark changes
  
  // Default providers configuration with useCallback
  const getDefaultProviders = useCallback((): AIProvider[] => [
    {
      id: "chatgpt",
      name: "ChatGPT",
      enabled: true,
      url: "https://chatgpt.com/",
      icon: getIconForProvider("chatgpt"),
      models: ["GPT-3.5", "GPT-4", "GPT-4o"],
      selected: "GPT-4o"
    },
    {
      id: "grok",
      name: "Grok",
      enabled: false,
      url: "https://grok.com/",
      icon: getIconForProvider("grok"),
      models: ["Grok-1", "Grok-2"],
      selected: "Grok-2"
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      enabled: false,
      url: "https://chat.deepseek.com/",
      icon: getIconForProvider("deepseek"),
      models: ["DeepSeek-7B", "DeepSeek-67B"],
      selected: "DeepSeek-67B"
    },
    {
      id: "claude",
      name: "Claude",
      enabled: false,
      url: "https://claude.ai/",
      icon: getIconForProvider("claude"),
      models: ["Claude 3 Opus", "Claude 3 Sonnet", "Claude 3 Haiku"],
      selected: "Claude 3 Sonnet"
    },
    {
      id: "gemini",
      name: "Gemini",
      enabled: false,
      url: "https://gemini.google.com/",
      icon: getIconForProvider("gemini"),
      models: ["Gemini Pro", "Gemini Ultra"],
      selected: "Gemini Ultra"
    }
  ], [getIconForProvider]) // Depend on getIconForProvider
  
  // Initialize providers state with saved data or defaults
  const [providers, setProviders] = useState<AIProvider[]>(() => {
    // Default to an empty array initially, will be populated in useEffect
    return []
  })
  
  // Load providers from localStorage on component mount
  useEffect(() => {
    try {
      const savedProviders = localStorage.getItem('chatmultiai_providers')
      if (savedProviders) {
        const parsed = JSON.parse(savedProviders)
        setProviders(parsed.map((provider: any) => ({
          ...provider,
          icon: getIconForProvider(provider.id)
        })))
      } else {
        setProviders(getDefaultProviders())
      }
    } catch (e) {
      console.error("Failed to load providers:", e)
      setProviders(getDefaultProviders())
    }
  }, [isDark, getIconForProvider]) // Re-run when theme changes to update icons
  
  // Save providers to localStorage whenever they change
  useEffect(() => {
    // Skip saving if providers is empty (initial state)
    if (providers.length === 0) return
    
    // Serialize providers without the React node icons
    const serializableProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      enabled: provider.enabled,
      url: provider.url,
      models: provider.models,
      selected: provider.selected
    }))
    
    localStorage.setItem('chatmultiai_providers', JSON.stringify(serializableProviders))
  }, [providers])
  
  // Toggle provider enabled state
  const toggleProvider = (id: string) => {
    setProviders(
      providers.map((provider) =>
        provider.id === id
          ? { ...provider, enabled: !provider.enabled }
          : provider
      )
    )
  }
  
  // Change selected model for a provider
  const handleModelChange = (id: string, model: string) => {
    setProviders(
      providers.map((provider) =>
        provider.id === id
          ? { ...provider, selected: model }
          : provider
      )
    )
  }
  
  // Handle sending prompt to AI providers
  const handleSendPrompt = () => {
    if (!prompt.trim()) return
    
    const enabledProviders = providers.filter((provider) => provider.enabled)
    
    if (enabledProviders.length === 0) return
    
    // Send message to background script with URLs and prompt
    chrome.runtime.sendMessage({
      type: "OPEN_AI_PROVIDERS",
      urls: enabledProviders.map(provider => provider.url),
      prompt: prompt
    }, (response) => {
      if (response && response.success) {
        console.log("Successfully sent prompt to background script")
        // Clear input after sending
        setPrompt("")
      } else {
        console.error("Failed to send prompt to background script")
      }
    })
  }
  
  // Auto-resize textarea when content changes
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto'
      // Set new height based on content (with a maximum of 200px)
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [prompt])
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center space-x-2">
          <div className="rounded-md p-1">
            <img src={logoIcon} className="h-6 w-6 object-contain" alt="ChatMultiAI logo" />
          </div>
          <h1 className="text-xl font-semibold">ChatMultiAI</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-grow overflow-auto p-4">
        <Accordion type="multiple" defaultValue={[]} className="mb-4">
          {providers.map((provider) => (
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {provider.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="sticky bottom-0 bg-background pt-2 p-4 border-t">
        <Textarea
          ref={textareaRef}
          placeholder="Type your prompt here..."
          className="min-h-[50px] resize-none mb-2 focus-visible:ring-primary overflow-y-auto overflow-x-hidden"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            // Check if Enter key is pressed without Shift (to allow Shift+Enter for new line)
            if (e.key === 'Enter' && !e.shiftKey) {
              // Don't send if in the middle of composition (e.g., Chinese input)
              if (!e.nativeEvent.isComposing) {
                e.preventDefault() // Prevent new line
                // Only trigger send if prompt is not empty and at least one provider is enabled
                if (prompt.trim() && providers.some((p) => p.enabled)) {
                  handleSendPrompt()
                }
              }
            }
          }}
        />
        <Button 
          className="w-full gap-2 h-10"
          onClick={handleSendPrompt}
          disabled={!prompt.trim() || !providers.some((p) => p.enabled)}
        >
          <Send className="h-4 w-4" />
          Send to AI providers
        </Button>
      </div>
    </div>
  )
}

const ChatMultiAI = () => {
  return (
    <ThemeProvider>
      <ChatMultiAIContent />
    </ThemeProvider>
  )
}

export default ChatMultiAI 