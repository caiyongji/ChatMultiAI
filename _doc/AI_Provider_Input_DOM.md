# AI Provider Input DOM 结构与自动填充实现

本文档总结了各个AI提供商网站的输入区域DOM结构，以及ChatMultiAI如何自动填充提示文本并执行自动发送的实现细节。

## ChatGPT

### 输入区域DOM结构
ChatGPT使用可编辑的div元素作为输入区域：

```html
<div id="prompt-textarea" contenteditable="true" class="ProseMirror">
  <p data-placeholder="Ask anything" class="placeholder">
    <br class="ProseMirror-trailingBreak">
  </p>
</div>
```

### 发送按钮DOM结构
```html
<button data-testid="send-button" class="absolute p-1 rounded-md text-gray-500 bottom-1.5 md:bottom-2.5 hover:bg-gray-100 enabled:dark:hover:text-gray-400 enabled:dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent right-1 md:right-2 disabled:opacity-40">
  <span data-state="closed">
    <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z" fill="currentColor"></path>
    </svg>
  </span>
</button>
```

### 填充与发送实现
```typescript
const inputBox = await waitForElement("div[id='prompt-textarea']")
if (inputBox) {
  // For contenteditable div
  if (inputBox.getAttribute("contenteditable") === "true") {
    inputBox.textContent = prompt
    inputBox.dispatchEvent(new Event("input", { bubbles: true }))
    
    // Auto-submit
    const sendButton = await waitForElement("button[data-testid='send-button']")
    if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
      sendButton.click()
    }
  } else {
    // Fallback to textarea
    const textarea = await waitForElement("div[data-testid='text-input-area'] textarea")
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.value = prompt
      textarea.dispatchEvent(new Event("input", { bubbles: true }))
      
      // Auto-submit
      const sendButton = await waitForElement("button[data-testid='send-button']")
      if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
        sendButton.click()
      }
    }
  }
}
```

## Grok

### 输入区域DOM结构
Grok使用textarea元素作为输入区域：

```html
<textarea dir="auto" aria-label="Ask Grok anything" 
  class="w-full px-2 @[480px]/input:px-3 bg-transparent focus:outline-none text-primary align-bottom min-h-14 pt-5 my-0 mb-5" 
  style="resize: none; height: 44px !important;"></textarea>
```

### 发送按钮DOM结构
```html
<button type="submit" class="absolute bottom-2.5 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-surface-brand text-on-surface-brand disabled:bg-brand-100 disabled:text-brand-700">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-current">
    <path d="M4.92893 19.0711L19.0711 4.92893M19.0711 4.92893H8.00001M19.0711 4.92893V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>
</button>
```

### 填充与发送实现
```typescript
const textarea = await waitForElement("textarea.w-full.bg-transparent.focus\\:outline-none.text-primary")
if (textarea instanceof HTMLTextAreaElement) {
  textarea.value = prompt
  textarea.style.height = "auto" // Reset height
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  // Trigger resize if needed
  textarea.dispatchEvent(new Event("change", { bubbles: true }))
  
  // Auto-submit
  const sendButton = await waitForElement("button[type='submit']")
  if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
    sendButton.click()
  }
}
```

## DeepSeek

### 输入区域DOM结构
DeepSeek使用带有ID的textarea元素：

```html
<textarea id="chat-input" class="_27c9245" placeholder="Message DeepSeek" rows="2"></textarea>
```

### 发送按钮DOM结构
```html
<div role="button" aria-disabled="false" class="_7436101">
  <div class="_6f28693">
    <div class="ds-icon" style="font-size: 16px; width: 16px; height: 16px;">
      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M7 16c-.595 0-1.077-.462-1.077-1.032V1.032C5.923.462 6.405 0 7 0s1.077.462 1.077 1.032v13.936C8.077 15.538 7.595 16 7 16z" fill="currentColor"></path>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M.315 7.44a1.002 1.002 0 0 1 0-1.46L6.238.302a1.11 1.11 0 0 1 1.523 0c.421.403.421 1.057 0 1.46L1.838 7.44a1.11 1.11 0 0 1-1.523 0z" fill="currentColor"></path>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M13.685 7.44a1.11 1.11 0 0 1-1.523 0L6.238 1.762a1.002 1.002 0 0 1 0-1.46 1.11 1.11 0 0 1 1.523 0l5.924 5.678c.42.403.42 1.056 0 1.46z" fill="currentColor"></path>
      </svg>
    </div>
  </div>
</div>
```

### 填充与发送实现
```typescript
const textarea = await waitForElement("textarea#chat-input")
if (textarea instanceof HTMLTextAreaElement) {
  textarea.value = prompt
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  
  // Auto-submit - DeepSeek使用div元素作为按钮
  const sendButton = await waitForElement("div[role='button'][aria-disabled='false']")
  if (sendButton instanceof HTMLElement) {
    sendButton.click()
  }
}
```

## Claude

### 输入区域DOM结构
Claude使用可编辑的div元素：

```html
<div contenteditable="true" translate="no" enterkeyhint="enter" tabindex="0" class="ProseMirror break-words max-w-[60ch]">
  <p data-placeholder="How can I help you today?" class="is-empty is-editor-empty before:!text-text-500 before:whitespace-nowrap">
    <br class="ProseMirror-trailingBreak">
  </p>
</div>
```

### 发送按钮DOM结构
```html
<button aria-label="Send message" data-state="ready" data-size="medium" data-spacing="compact" data-full-width="false" data-variant="primary" data-icon-position="trailing" data-loading="false" class="btn-primary dark:btn-primary-dark">
  <div class="flex items-center justify-center flex-grow overflow-hidden space-x-2">
    <div class="flex">
      <span>Send</span>
    </div>
    <div aria-hidden="true" class="flex">
      <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0">
        <path d="M1.60615 4.04733C1.33077 2.51733 2.597 1.22556 4.143 1.45659L11.6809 2.57267C13.7762 2.87524 14.6477 5.46497 13.234 7.09587L11.6323 8.94548C11.2916 9.33528 11.2473 9.90201 11.5304 10.3382L12.9217 12.4254C14.0374 14.0992 12.9223 16.3616 11.0101 16.1611L3.05337 15.2925C1.90663 15.1683 1.07202 14.1318 1.1443 12.9797L1.60615 4.04733Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>
        <path d="M4.75 5.5L9 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </div>
  </div>
</button>
```

### 填充与发送实现
```typescript
const contentEditableDiv = await waitForElement("div.ProseMirror[contenteditable='true']")
if (contentEditableDiv) {
  // Clear existing content
  contentEditableDiv.innerHTML = ""
  
  // Create a paragraph element
  const paragraph = document.createElement("p")
  paragraph.textContent = prompt
  
  // Append the paragraph to the contenteditable div
  contentEditableDiv.appendChild(paragraph)
  
  // Trigger input event
  contentEditableDiv.dispatchEvent(new Event("input", { bubbles: true }))
  
  // Auto-submit
  const sendButton = await waitForElement("button[aria-label='Send message']")
  if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
    sendButton.click()
  }
}
```

## Gemini

### 输入区域DOM结构
Gemini也使用可编辑的div元素：

```html
<div class="ql-editor ql-blank textarea new-input-ui" data-gramm="false" contenteditable="true" 
  role="textbox" aria-multiline="true" aria-label="Enter a prompt here" data-placeholder="Ask Gemini">
  <p><br></p>
</div>
```

### 发送按钮DOM结构
```html
<button class="send-button material-symbols center" aria-label="Send message" data-test-id="gemini-chat-send-button">
  <div class="material-symbols ripple" jsname="itIyff">send</div>
</button>
```

### 填充与发送实现
```typescript
const contentEditableDiv = await waitForElement("div.ql-editor[contenteditable='true']")
if (contentEditableDiv) {
  // Clear existing content
  contentEditableDiv.innerHTML = ""
  
  // Create a paragraph element
  const paragraph = document.createElement("p")
  paragraph.textContent = prompt
  
  // Append the paragraph to the contenteditable div
  contentEditableDiv.appendChild(paragraph)
  
  // Trigger input event
  contentEditableDiv.dispatchEvent(new Event("input", { bubbles: true }))
  
  // Auto-submit
  const sendButton = await waitForElement("button.send-button")
  if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
    sendButton.click()
  }
}
```

## 通用辅助函数

为了确保可靠地识别和填充输入元素，ChatMultiAI实现了以下辅助函数：

### 等待DOM元素出现
```typescript
function waitForElement(selector: string, timeout = 10000): Promise<Element | null> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector))
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect()
        resolve(document.querySelector(selector))
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Set timeout to avoid waiting indefinitely
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}
```

## 清空存储实现

为确保每次输入和发送后不会在再次打开网站时自动填充和发送，ChatMultiAI在发送后会清空存储的提示：

```typescript
// 发送后清空localStorage中存储的提示
localStorage.removeItem("chatmultiai_prompt")
```

这确保了只有当用户从侧边栏明确发送新提示时，才会自动填充和发送。

## 注意事项

1. 所有实现都包含自动提交按钮功能，在填充输入区域后自动提交
2. 每个网站的DOM结构可能会随着更新而变化，需要定期更新选择器
3. 对于使用`contenteditable`的输入区域，需要清除现有内容并创建新段落
4. 触发适当的事件（如`input`和`change`）对于正确激活UI是必要的
5. 每次处理完提示后，脚本会从localStorage中清除存储的提示，确保再次打开网站时不会重复填充 