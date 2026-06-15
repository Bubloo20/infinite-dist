# Infinite Distribution — Website

A modern, animated marketing site for **Infinite Distribution**, Melbourne's letterbox flyer distribution network. Built as a fast, fully responsive single-page site and ready to deploy on Vercel.

> **Tagline:** Local Reach. Maximum Impact.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations
- Google Fonts via `next/font` (Inter + Space Grotesk)

## Features

- Glassmorphic sticky navbar with mobile menu
- Animated hero with floating envelope particles, gradient mesh & grid backdrop
- Animated stat counters (campaigns, houses delivered, satisfaction)
- Scroll-reveal sections throughout + top scroll-progress bar
- 4-step "How It Works" process, 100% Quality guarantees, Case Studies
- "Join the Team" recruitment block & a working contact form layout
- Newsletter signup, full contact details, SEO metadata
- Fully responsive, `prefers-reduced-motion` friendly

## Getting started (local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build
```

## Deploy to Vercel

The easiest path:

1. Push this folder to a GitHub/GitLab/Bitbucket repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Vercel auto-detects Next.js — just click **Deploy**. No config needed.

Or deploy straight from your machine with the Vercel CLI:

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

## Wiring up the contact form

The contact form (`components/Contact.tsx`) and newsletter (`components/Footer.tsx`)
currently show a success state on submit without sending anywhere. To receive real
submissions, connect one of:

- **[Formspree](https://formspree.io/)** — set the form `action` to your endpoint.
- **[Resend](https://resend.com/)** — add a Next.js route handler (`app/api/contact/route.ts`)
  and `fetch` it from the form.
- **Vercel serverless function** + your email provider of choice.

## Customising content

All copy and contact details live inside the component files in `components/`.
Key spots:

- Contact info: `components/Contact.tsx` & `components/Footer.tsx`
- Stats: `components/Stats.tsx`
- Process steps: `components/Process.tsx`
- Guarantees: `components/Quality.tsx`
- Case studies: `components/CaseStudies.tsx`

Brand colors are defined in `tailwind.config.ts` under `theme.extend.colors`.

---

© 2026 Infinite Distribution. Melbourne, Australia.
