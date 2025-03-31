# ChatMultiAI
这是一个Chrome浏览器插件,它的功能就是说,在我 在SidePanel这个Chrome Extension的侧边栏进行输入的时候 它可以一次打开多个type页比如说grok 或者chattgpt 或者deepseq 或者 把我的问题同时输入给这四个平台然后可以选择他们对应的 模型,然后进行提问这样的一个快速提问的插件

我打算使用Plasmo这个浏览器的框架平台进行开发

再结合 next.js 和 shardcn, tailwind.css 这些 框架进行开发也就是说我要采用react进行开发

然后我还要使用TypeScript

## 技术栈
- react
- typescript
- plasmo
- nextjs
- shadcn
- tailwindcss
- pnpm

## 项目结构
```
chat-multi-ai/
├── src/
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx           # 可复用的按钮组件
│   ├── lib/
│   │   └── utils.ts                 # 工具函数
│   ├── sidepanel.tsx                # 主侧边栏组件
│   ├── content.tsx                  # 内容脚本
│   ├── popup.tsx                    # 弹出窗口组件
│   └── style.css                    # 全局样式
├── assets/                          # 扩展图标和资源
├── tailwind.config.js               # TailwindCSS配置
├── package.json                     # 项目依赖和清单
└── README.md                        # 项目文档
```

## 支持的AI平台
1. **ChatGPT** (https://chat.openai.com/)
2. **Grok** (https://grok.x.ai/)
3. **DeepSeq** (https://deepseek.ai/)
4. **Claude** (https://claude.ai/)

# plasmo doc
https://docs.plasmo.com/framework
https://docs.plasmo.com/framework/tab-pages
https://docs.plasmo.com/framework/workflows/new
https://docs.plasmo.com/framework/workflows/new