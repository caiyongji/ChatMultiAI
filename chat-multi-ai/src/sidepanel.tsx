import "./globals.css"
import { useState, useEffect } from "react"
// import cssText from "data-text:@/globals.css"
import type { PlasmoCSConfig } from "plasmo"
import { Moon, Sun, Send, MessageSquare, Zap, Sparkles, Bot } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 初始主题检测脚本
const initTheme = `
  (function() {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const isDarkMode = darkModeMediaQuery.matches;
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  })();
`;

// 添加初始化脚本到页面头部
export const getStyle = () => {
  const script = document.createElement("script");
  script.textContent = initTheme;
  return script;
};

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
  const [isDark, setIsDark] = useState(false)
  
  // 直接检测并设置暗黑模式
  useEffect(() => {
    // 初始化主题：检查是否有暗黑模式类或系统偏好
    const isDarkMode = document.documentElement.classList.contains('dark') || 
      window.matchMedia('(prefers-color-scheme: dark)').matches
    
    setIsDark(isDarkMode)
    
    // 应用初始主题
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])
  
  // 切换主题
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    setIsDark(!isDark)
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full h-8 w-8"
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

const ChatMultiAIContent = () => {
  const [prompt, setPrompt] = useState<string>("")
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: "chatgpt",
      name: "ChatGPT",
      enabled: true,
      url: "https://chat.openai.com/",
      icon: <MessageSquare className="h-4 w-4 text-emerald-500" />,
      models: ["GPT-3.5", "GPT-4", "GPT-4o"],
      selected: "GPT-4o"
    },
    {
      id: "grok",
      name: "Grok",
      enabled: false,
      url: "https://grok.x.ai/",
      icon: <Zap className="h-4 w-4 text-blue-500" />,
      models: ["Grok-1", "Grok-2"],
      selected: "Grok-2"
    },
    {
      id: "deepseq",
      name: "DeepSeq",
      enabled: false,
      url: "https://deepseek.ai/",
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      models: ["DeepSeek-7B", "DeepSeek-67B"],
      selected: "DeepSeek-67B"
    },
    {
      id: "claude",
      name: "Claude",
      enabled: false,
      url: "https://claude.ai/",
      icon: <Bot className="h-4 w-4 text-amber-500" />,
      models: ["Claude 3 Opus", "Claude 3 Sonnet", "Claude 3 Haiku"],
      selected: "Claude 3 Sonnet"
    }
  ])

  const toggleProvider = (id: string) => {
    setProviders(
      providers.map((provider) =>
        provider.id === id
          ? { ...provider, enabled: !provider.enabled }
          : provider
      )
    )
  }

  const handleModelChange = (id: string, model: string) => {
    setProviders(
      providers.map((provider) =>
        provider.id === id
          ? { ...provider, selected: model }
          : provider
      )
    )
  }

  const handleSendPrompt = () => {
    if (!prompt.trim()) return
    
    const enabledProviders = providers.filter((provider) => provider.enabled)
    
    enabledProviders.forEach((provider) => {
      window.open(provider.url, "_blank")
    })
    
    setPrompt("")
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center space-x-2">
          <div className="bg-primary rounded-md p-1 text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-semibold">ChatMultiAI</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-grow overflow-auto p-4">
        <Accordion type="multiple" defaultValue={providers.filter(p => p.enabled).map(p => p.id)} className="mb-4">
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
          placeholder="Type your prompt here..."
          className="min-h-[100px] resize-none mb-2 focus-visible:ring-primary"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
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
    <ChatMultiAIContent />
  )
}

export default ChatMultiAI 