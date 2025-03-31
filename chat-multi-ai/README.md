# ChatMultiAI

A Chrome extension that allows you to send prompts to multiple AI assistants at once.

## Features

- Send the same prompt to multiple AI platforms (ChatGPT, Grok, DeepSeq, Claude) with one click
- Use Chrome's SidePanel to easily access ChatMultiAI from any webpage
- Select which AI providers to use for each prompt
- Modern UI with shadcn/ui components

## Tech Stack

- React
- TypeScript
- Plasmo (Chrome extension framework)
- Next.js
- shadcn/ui
- TailwindCSS
- pnpm (package manager)

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Create a production package
pnpm package
```

## Usage

1. Click the ChatMultiAI icon in your browser to open the SidePanel
2. Select which AI providers you want to use
3. Type your prompt in the text area
4. Click "Send to AI providers" to send your prompt to all selected AI platforms
5. Each selected AI platform will open in a new tab with your prompt

## License

MIT
