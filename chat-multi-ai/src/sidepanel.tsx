import { useState } from "react"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"

import { Button } from "./components/ui/button"

export const config: PlasmoCSConfig = {
  css: ["font-src: self;"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getShadowHostId = () => "plasmo-shadow-host"

type AiProvider = {
  id: string
  name: string
  enabled: boolean
  url: string
}

const ChatMultiAI = () => {
  const [prompt, setPrompt] = useState<string>("")
  const [aiProviders, setAiProviders] = useState<AiProvider[]>([
    {
      id: "chatgpt",
      name: "ChatGPT",
      enabled: true,
      url: "https://chat.openai.com/"
    },
    {
      id: "grok",
      name: "Grok",
      enabled: false,
      url: "https://grok.x.ai/"
    },
    {
      id: "deepseq",
      name: "DeepSeq",
      enabled: false,
      url: "https://deepseek.ai/"
    },
    {
      id: "claude",
      name: "Claude",
      enabled: false,
      url: "https://claude.ai/"
    }
  ])

  const toggleProvider = (id: string) => {
    setAiProviders(
      aiProviders.map((provider) =>
        provider.id === id
          ? { ...provider, enabled: !provider.enabled }
          : provider
      )
    )
  }

  const handleSendPrompt = () => {
    if (!prompt.trim()) return
    
    const enabledProviders = aiProviders.filter((provider) => provider.enabled)
    
    enabledProviders.forEach((provider) => {
      window.open(provider.url, "_blank")
    })
    
    setPrompt("")
  }

  return (
    <div className="w-full h-full p-4 bg-background text-foreground flex flex-col">
      <div className="mb-4">
        <h1 className="text-xl font-bold">ChatMultiAI</h1>
        <p className="text-sm text-muted-foreground">
          Send prompts to multiple AI assistants at once.
        </p>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">Select AI providers:</div>
        <div className="flex flex-wrap gap-2">
          {aiProviders.map((provider) => (
            <Button
              key={provider.id}
              variant={provider.enabled ? "default" : "outline"}
              onClick={() => toggleProvider(provider.id)}
              className="mr-2 mb-2"
              size="sm"
            >
              {provider.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-grow mb-4">
        <div className="text-sm font-medium mb-2">Your prompt:</div>
        <textarea
          className="w-full h-40 p-2 border rounded-md bg-background resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your prompt here..."
        ></textarea>
      </div>

      <Button 
        onClick={handleSendPrompt}
        disabled={!prompt.trim() || !aiProviders.some((p) => p.enabled)}
      >
        Send to AI providers
      </Button>
    </div>
  )
}

export default ChatMultiAI 