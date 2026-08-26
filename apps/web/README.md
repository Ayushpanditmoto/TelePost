# TelePost — Web App

## Local development

Run both apps from the repo root:

```bash
# 1. Worker (auto-loads apps/worker/.dev.vars for secrets)
cd apps/worker && npx wrangler dev          # → http://localhost:8787

# 2. Web
cd apps/web && npm run dev                  # → http://localhost:3000
```

### Environment

Copy `.env.example` to `.env.local` and adjust:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Worker base URL (`http://localhost:8787`) |
| `NEXT_PUBLIC_DEV_LOGIN` | `true` shows the local-only Dev Login button |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Bot username (no `@`) — required for the real Telegram Login Widget |

Worker secrets live in `apps/worker/.dev.vars` (gitignored): `TELEGRAM_BOT_TOKEN`,
`SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`.

### Logging in

- **Local dev:** use the **Dev login** button on `/login` (no Telegram account or
  bot domain needed). It only exists while the worker runs with
  `ENVIRONMENT != production`.
- **Real Telegram login:** create a bot with [@BotFather](https://t.me/BotFather),
  run `/setdomain` with your deployed domain, set
  `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, then deploy.
  The widget cannot run on `localhost` — Telegram requires a registered domain.

This is a [Next.js](https://nextjs.org) app bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
