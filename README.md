This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

This project now includes a MERN backend alongside the Next.js frontend.

First, install dependencies:

```bash
npm install
```

Copy the example environment file and configure MongoDB:

```bash
cp .env.example .env
```

Configure SMTP for institutional Outlook verification emails:

- `INSTITUTIONAL_EMAIL_DOMAIN` (default: `cit.edu`)
- `EMAIL_HOST` (Office365: `smtp.office365.com`)
- `EMAIL_PORT` (Office365: `587`)
- `EMAIL_SECURE` (`false` for Office365 on port 587)
- `EMAIL_REQUIRE_TLS` (`true` for Office365)
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

When a user registers or requests resend, the backend sends a 6-digit verification code email.
If SMTP delivery fails, the API returns an error instead of silently continuing.

Start both frontend and backend in development:

```bash
npm run dev
```

- Next.js frontend: http://localhost:3000
- Express backend API: http://localhost:5000

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
