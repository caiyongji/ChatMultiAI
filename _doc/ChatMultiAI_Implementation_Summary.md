# ChatMultiAI 实现总结

本文档总结了ChatMultiAI Chrome扩展的核心实现，重点关注自动填充和发送功能。

## 核心功能

ChatMultiAI允许用户:
1. 在侧边栏输入一个提示
2. 选择多个AI服务提供商
3. 一键将相同提示发送到所有选定的AI服务
4. 自动填充每个AI服务的输入框
5. 自动点击发送按钮

## 组件架构

系统由三个主要组件组成:

1. **侧边栏 (Sidepanel)**: 用户交互界面
2. **后台脚本 (Background Script)**: 处理消息传递和标签页管理
3. **内容脚本 (Content Script)**: 在AI服务页面中运行，自动填充和发送提示

## 数据流程

1. 用户在侧边栏输入提示并选择AI提供商
2. 侧边栏将提示存储到`localStorage`并发送消息给后台脚本
3. 后台脚本打开选定的AI提供商网站
4. 内容脚本在每个页面加载完成后自动填充输入框并点击发送按钮
5. 发送后清除存储的提示，确保下次打开网站时不会自动填充

## 自动填充和发送实现

每个AI提供商需要特定的实现，因为它们使用不同的DOM结构:

### 实现策略

系统使用以下策略确保可靠的填充和发送:

1. **等待页面加载**: 确保DOM已完全加载
2. **等待元素出现**: 使用`MutationObserver`等待输入元素和发送按钮出现
3. **适应不同的输入类型**: 处理`contenteditable` div和`textarea`元素
4. **触发适当事件**: 使用`input`和`change`事件确保UI更新
5. **检查按钮状态**: 确保发送按钮未被禁用
6. **异常处理**: 使用超时和错误捕获

### 代码示例 (ChatGPT实现)

```typescript
const inputBox = await waitForElement("div[id='prompt-textarea']")
if (inputBox) {
  if (inputBox.getAttribute("contenteditable") === "true") {
    inputBox.textContent = prompt
    inputBox.dispatchEvent(new Event("input", { bubbles: true }))
    
    const sendButton = await waitForElement("button[data-testid='send-button']")
    if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
      sendButton.click()
    }
  }
}
```

## 支持的AI提供商

当前支持以下AI提供商:

| 提供商 | 域名 | 输入类型 | 发送按钮类型 |
|-------|------|---------|------------|
| ChatGPT | chatgpt.com | contenteditable div | button[data-testid='send-button'] |
| Grok | grok.com | textarea | button[type='submit'] |
| DeepSeek | chat.deepseek.com | textarea | div[role='button'][aria-disabled='false'] |
| Claude | claude.ai | contenteditable div | button[aria-label='Send message'] |
| Gemini | gemini.google.com | contenteditable div | button.send-button |

## 状态管理与清除

为防止重复填充和发送，系统实现了两层清除机制:

1. **在内容脚本中**: 发送后立即从`localStorage`中移除存储的提示
   ```typescript
   localStorage.removeItem("chatmultiai_prompt")
   ```

2. **在后台脚本中**: 设置30秒超时清除内存中的提示
   ```typescript
   setTimeout(() => {
     currentPrompt = ""
   }, 30000)
   ```

3. **通知机制**: 内容脚本通知后台脚本提示已发送
   ```typescript
   chrome.runtime.sendMessage({ type: "PROMPT_SENT" })
   ```

## 异常处理

系统实现了几种异常处理机制:

1. **元素等待超时**: 如果10秒内未找到目标元素，则不再等待
2. **按钮状态检查**: 只有在按钮未被禁用时才尝试点击
3. **处理跟踪**: 使用`processed`标志确保每个页面只处理一次提示
4. **多重消息传递**: 通过多个渠道传递提示，确保可靠性

## 未来改进

可能的改进方向:

1. **UI反馈**: 添加发送状态和成功/失败指示器
2. **响应收集**: 收集和比较各AI提供商的响应
3. **更多提供商**: 添加更多AI服务支持
4. **提示模板**: 允许保存和重用常用提示

## 总结

ChatMultiAI通过利用Chrome扩展API和DOM操作，实现了跨多个AI提供商的无缝提示发送功能。核心功能依赖于准确识别每个提供商的DOM结构，同时实现了可靠的状态管理，确保提示只发送一次。 