# Discord message sender

A small Astro site for sending Markdown / emoji / embed messages to a Discord channel
using a bot token + channel ID, or a webhook URL.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
```

## Build / deploy

```bash
npm run build      # static files in ./dist
npm run preview
```

`dist/` can be hosted anywhere static (Netlify, Vercel, GitHub Pages, Cloudflare Pages...).

## Structure

```
src/
  layouts/Layout.astro        page shell
  pages/index.astro           the single page
  components/
    ConnectionPanel.astro     token / channel / webhook fields
    ComposerPanel.astro       toolbar, text box, emojis, embed builder
    PreviewPanel.astro        Discord-style preview + send button
  scripts/
    markdown.ts               Discord-flavoured Markdown -> HTML (preview only)
    discord.ts                the actual API request
    app.ts                    wires the DOM together
  styles/global.css
```

## Security notes

- Requests go straight from the browser to Discord. There is no backend.
- The token is only saved if you tick "Remember", and then in plain text in localStorage.
- Anyone who can open the page can use whatever token is typed into it, so don't
  bake a token into the source or host a pre-filled copy publicly.
- Keep tokens out of git (`.env` is already ignored if you extend this with env vars).
