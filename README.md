# Discord Message Sender

A small Astro application for composing and sending Discord messages with Markdown, emojis, and embeds. Send messages using either a bot token and channel ID or a webhook URL.

The application includes a live Discord-style preview, a Markdown toolbar, an emoji picker, and an embed builder.

## Requirements

- Node.js `>=22.12.0`
- npm

## Run locally

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Build and preview

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The application uses Astro's server output and the Node.js adapter. Unlike a purely static site, it requires a server runtime to handle Discord API requests.

## Deployment

Deploy to a hosting environment that supports the configured Astro Node.js adapter, such as a Node.js server or VPS.

The application cannot be deployed as a static-only site without changing the message-sending architecture, because `/api/send-message` must execute on the server.

Ensure the production server uses HTTPS and that access to the sending endpoint is appropriately protected.

## Features

- **Bot mode:** Send messages using a Discord bot token and channel ID.
- **Webhook mode:** Send messages using a Discord webhook URL, with optional username and avatar overrides.
- **Markdown preview:** Preview supported Discord-style formatting before sending.
- **Emoji support:** Insert standard emojis and preview custom Discord emojis.
- **Embed builder:** Configure an embed title, description, color, footer, and image.
- **Mention control:** Choose whether messages may trigger mentions.
- **Message counter:** Track the 2,000-character message content limit.
- **Remember settings:** Optionally save connection settings in browser local storage.

## Project structure

```text
src/
  layouts/
    Layout.astro             Page shell
  pages/
    index.astro              Main page
    api/
      send-message.ts        Server endpoint for sending messages
  components/
    ConnectionPanel.astro    Bot token, channel, and webhook fields
    ComposerPanel.astro      Toolbar, text editor, emojis, embed builder
    PreviewPanel.astro       Discord-style preview and send button
  lib/
    server/
      sendMessage.ts             Server-side Discord API requests
  scripts/
    markdown.ts              Discord-style Markdown to HTML
    app.ts                   Client-side UI interactions
  styles/
    global.css               Global styles
  types.ts                   Shared TypeScript interfaces and types
```

## How message sending works

1. The browser collects the message content, embed settings, and connection details.
2. The browser sends the request to the application's `/api/send-message` endpoint.
3. The server validates the request and sends the message to Discord.
4. The endpoint returns the result to the browser for display.

Discord API requests are made by the server rather than directly by the browser, avoiding browser CORS restrictions.

## Security notes

- **Never commit bot tokens or webhook URLs.** Treat both as credentials.
- Connection details are supplied by the user and are sent to the server only when a message is submitted.
- The optional "Remember these settings" feature stores connection details in plaintext in the browser's local storage. Only use it on a trusted device, and avoid enabling it on shared computers.
- Anyone who can access the application may be able to use its message-sending functionality unless appropriate access controls are implemented.
- Validate incoming requests and configure rate limiting and access controls before making the application publicly accessible. An origin check alone does not authenticate users.
- Do not log bot tokens, webhook URLs, or other sensitive connection details.
- Use HTTPS in production.
- Keep dependencies updated and never expose credentials in client-side code or public environment variables.
