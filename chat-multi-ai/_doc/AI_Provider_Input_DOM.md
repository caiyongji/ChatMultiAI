# AI Provider Input DOM 结构与自动填充实现

本文档总结了各个AI提供商网站的输入区域DOM结构，以及ChatMultiAI如何自动填充提示文本的实现细节。

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

### 填充实现
```typescript
const inputBox = await waitForElement("div[id='prompt-textarea']")
if (inputBox) {
  // For contenteditable div
  if (inputBox.getAttribute("contenteditable") === "true") {
    inputBox.textContent = prompt
    inputBox.dispatchEvent(new Event("input", { bubbles: true }))
  } else {
    // Fallback to find textarea
    const textarea = await waitForElement("div[data-testid='text-input-area'] textarea")
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.value = prompt
      textarea.dispatchEvent(new Event("input", { bubbles: true }))
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

### 填充实现
```typescript
const textarea = await waitForElement("textarea.w-full.bg-transparent.focus\\:outline-none.text-primary")
if (textarea instanceof HTMLTextAreaElement) {
  textarea.value = prompt
  textarea.style.height = "auto" // Reset height
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  // Trigger resize if needed
  textarea.dispatchEvent(new Event("change", { bubbles: true }))
}
```

## DeepSeek

### 输入区域DOM结构
DeepSeek使用带有ID的textarea元素：

```html
<textarea id="chat-input" class="_27c9245" placeholder="Message DeepSeek" rows="2"></textarea>
```

### 填充实现
```typescript
const textarea = await waitForElement("textarea#chat-input")
if (textarea instanceof HTMLTextAreaElement) {
  textarea.value = prompt
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
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

### 填充实现
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

### 填充实现
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

## 注意事项

1. 所有实现都包含可选的自动提交按钮功能（目前处于注释状态）
2. 每个网站的DOM结构可能会随着更新而变化，需要定期更新选择器
3. 对于使用`contenteditable`的输入区域，需要清除现有内容并创建新段落
4. 触发适当的事件（如`input`和`change`）对于正确激活UI是必要的 