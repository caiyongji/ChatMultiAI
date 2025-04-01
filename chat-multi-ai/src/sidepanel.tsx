import "./globals.css"
import { useState, useEffect } from "react"
// import cssText from "data-text:@/globals.css"
import type { PlasmoCSConfig } from "plasmo"
import { Moon, Sun, Send, MessageSquare, Zap, Sparkles, Bot, Monitor } from "lucide-react"
import logoIcon from "data-base64:~images/logo.png"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 初始主题检测脚本 - 现在支持存储的主题偏好
const initTheme = `
  (function() {
    // 从localStorage读取主题偏好
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (storedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // 如果是'system'或未设置，则跟随系统
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const isDarkMode = darkModeMediaQuery.matches;
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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
  const [theme, setTheme] = useState<Theme>('system')
  
  // 从localStorage获取主题及应用
  useEffect(() => {
    // 从localStorage获取存储的主题
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme && themeOrder.includes(storedTheme)) {
      setTheme(storedTheme);
    }
    
    // 创建媒体查询来检测系统主题变化
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 当主题为'system'时应用系统主题
    const applySystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      if (theme === 'system' || !localStorage.getItem('theme')) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    // 初始应用系统主题（如果选择了系统主题）
    applySystemTheme(darkModeMediaQuery);
    
    // 监听系统主题变化
    darkModeMediaQuery.addEventListener('change', applySystemTheme);
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', applySystemTheme);
    };
  }, [theme]);
  
  // 应用主题设置
  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (newTheme === 'system') {
      // 如果是系统主题，则根据系统偏好设置
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };
  
  // 循环切换主题
  const toggleTheme = () => {
    // 找到当前主题在数组中的索引
    const currentIndex = themeOrder.indexOf(theme);
    // 计算下一个主题索引（循环）
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    // 获取下一个主题
    const nextTheme = themeOrder[nextIndex];
    
    // 设置新主题
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };
  
  // 获取当前主题图标
  const getThemeIcon = () => {
    switch(theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full h-8 w-8"
      onClick={toggleTheme}
      title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`} // 添加标题提示当前主题
    >
      {getThemeIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

const ChatMultiAIContent = () => {
  const [prompt, setPrompt] = useState<string>("")
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: "chatgpt",
      name: "ChatGPT",
      enabled: true,
      url: "https://chatgpt.com/",
      icon: <MessageSquare className="h-4 w-4 text-emerald-500" />,
      models: ["GPT-3.5", "GPT-4", "GPT-4o"],
      selected: "GPT-4o"
    },
    {
      id: "grok",
      name: "Grok",
      enabled: false,
      url: "https://grok.com/",
      icon: <Zap className="h-4 w-4 text-blue-500" />,
      models: ["Grok-1", "Grok-2"],
      selected: "Grok-2"
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      enabled: false,
      url: "https://chat.deepseek.com/",
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
    },
    {
      id: "gemini",
      name: "Gemini",
      enabled: false,
      url: "https://gemini.google.com/",
      icon: <Sparkles className="h-4 w-4 text-blue-600" />,
      models: ["Gemini Pro", "Gemini Ultra"],
      selected: "Gemini Ultra"
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
    
    if (enabledProviders.length === 0) return
    
    // 发送消息到background script，带上URLs和prompt
    chrome.runtime.sendMessage({
      type: "OPEN_AI_PROVIDERS",
      urls: enabledProviders.map(provider => provider.url),
      prompt: prompt
    }, (response) => {
      if (response && response.success) {
        console.log("Successfully sent prompt to background script")
        // 发送后清空输入框
        setPrompt("")
      } else {
        console.error("Failed to send prompt to background script")
      }
    })
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center space-x-2">
          <div className="bg-primary rounded-md p-1 text-primary-foreground">
            <img src={logoIcon} className="h-4 w-4 object-contain" alt="Chat Multi AI logo" />
          </div>
          <h1 className="text-xl font-semibold">Chat Multi AI</h1>
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
          onKeyDown={(e) => {
            // Check if Enter key is pressed without Shift (to allow Shift+Enter for new line)
            if (e.key === 'Enter' && !e.shiftKey) {
              // Don't send if in the middle of composition (e.g., Chinese input)
              if (!e.nativeEvent.isComposing) {
                e.preventDefault(); // Prevent new line
                // Only trigger send if prompt is not empty and at least one provider is enabled
                if (prompt.trim() && providers.some((p) => p.enabled)) {
                  handleSendPrompt();
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
    <ChatMultiAIContent />
  )
}

export default ChatMultiAI 