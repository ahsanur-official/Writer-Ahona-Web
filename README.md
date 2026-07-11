# Ahona Islam Writer Platform

A modern Bengali writer portfolio and admin content management demo built with Next.js App Router.

This repository contains two major experiences:
- A public-facing writer website for readers
- A protected (demo) admin area for managing posts, novels, and episodes

## Table of Contents

1. Project Summary
2. Tech Stack
3. Key Features
4. Project Structure
5. Routing Map
6. Getting Started
7. Available Scripts
8. Admin Demo Access
9. Architecture Notes
10. Styling and UI Notes
11. Current Limitations
12. Recommended Next Improvements
13. Deployment Notes
14. Troubleshooting
15. Contribution Guide
16. License

## 1. Project Summary

The public site introduces the writer brand and published works with:
- Hero section
- Category-based filtering
- Search over visible writings
- About section
- Newsletter form interaction (UI-only)

The admin side provides a UI flow for:
- Login
- Dashboard overview
- Managing posts
- Creating new posts
- Managing novels
- Creating episodes per novel

Important: this is currently a frontend/demo CMS flow. There is no real backend, database, or secure authentication service yet.

## 2. Tech Stack

- Framework: Next.js 15 (App Router)
- UI Library: React 19
- Language: TypeScript
- Styling: Global CSS (route-level CSS imports)
- Runtime: Node.js (LTS recommended)

Core dependency versions from package.json:
- next: 15.3.0
- react: 19.1.0
- react-dom: 19.1.0

## 3. Key Features

### Public Website
- Branded Bengali writer landing page
- Dynamic category filter (client-side)
- Keyword search over hardcoded works list (client-side)
- Section-based navigation (anchor links)
- Newsletter subscribe success message (client-side state)

### Admin Panel (Demo)
- LocalStorage-based login gate
- Dashboard with sample metrics and recent content cards
- Posts list with local filtering and remove action
- New post creation form with image preview
- Novels list and novel creation form
- Episode management page and new episode form

## 4. Project Structure

```text
.
|-- app/
|   |-- globals.css
|   |-- layout.tsx
|   |-- page.tsx
|   `-- admin/
|       |-- admin.css
|       |-- layout.tsx
|       |-- page.tsx
|       |-- dashboard/
|       |   `-- page.tsx
|       |-- login/
|       |   `-- page.tsx
|       |-- novels/
|       |   |-- layout.tsx
|       |   |-- novels.css
|       |   |-- page.tsx
|       |   |-- new/
|       |   |   `-- page.tsx
|       |   `-- [id]/
|       |       `-- episodes/
|       |           |-- page.tsx
|       |           `-- new/
|       |               `-- page.tsx
|       `-- posts/
|           |-- page.tsx
|           `-- new/
|               `-- page.tsx
|-- next-env.d.ts
|-- package.json
|-- tsconfig.json
`-- .gitignore
```

## 5. Routing Map

### Public Routes
- `/` -> Writer homepage

### Admin Routes
- `/admin` -> redirects to `/admin/login`
- `/admin/login` -> demo login page
- `/admin/dashboard` -> admin dashboard
- `/admin/posts` -> list/manage posts
- `/admin/posts/new` -> create new post
- `/admin/novels` -> list/manage novels
- `/admin/novels/new` -> create new novel
- `/admin/novels/:id/episodes` -> list episodes for selected novel
- `/admin/novels/:id/episodes/new` -> create new episode

## 6. Getting Started

### Prerequisites
- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open:
- http://localhost:3000

## 7. Available Scripts

From package.json:

```bash
npm run dev    # Start dev server
npm run build  # Create production build
npm run start  # Run production server
npm run lint   # Run Next.js lint
```

## 8. Admin Demo Access

Current admin login is demo-only and hardcoded in the frontend.

Credentials:
- Email: `admin@ahnaislam.com`
- Password: `ahona2026`

How auth works now:
- On successful login, localStorage key `ahona-admin` is set to `true`
- Protected admin pages check this value on client-side
- Logout removes this localStorage key

Security note:
- This is not secure for real production use
- Replace with server-side auth before deploying publicly

## 9. Architecture Notes

### App Router Layouts
- Root layout: metadata + global styles
- Admin layout: admin-specific shared styles
- Novels layout: novels/episodes-specific styles

### Data Model (Current)
- Content is hardcoded in arrays inside page components
- No API layer exists yet
- No persistent storage

### Component Strategy
- Route files contain page-level UI + local interaction logic
- Most interactions are state-driven (`useState`, `useEffect`, `useMemo`)

## 10. Styling and UI Notes

- Public and admin experiences are visually distinct
- Google fonts are imported from CSS
- CSS is currently plain global stylesheet strategy
- Some pages use compact one-line JSX style; can be refactored for readability

## 11. Current Limitations

- No backend or database
- No secure authentication
- No role-based authorization
- No real CRUD persistence
- No image upload API/storage integration
- Search/filter is local and only over in-memory arrays
- No automated tests configured yet

## 12. Recommended Next Improvements

1. Add real authentication (NextAuth/Auth.js, Clerk, or custom JWT/session)
2. Add database (PostgreSQL + Prisma recommended)
3. Move data from hardcoded arrays to API/database
4. Implement real post/novel/episode CRUD endpoints
5. Add validation (Zod + server actions or API validators)
6. Add proper file upload flow (S3/Cloudinary/local object storage)
7. Add automated testing (unit + integration + e2e)
8. Add content status workflow (draft/published/scheduled)
9. Add SEO metadata per post/novel page
10. Add analytics and comment moderation backend

## 13. Deployment Notes

Can be deployed to:
- Vercel (recommended for Next.js)
- Any Node.js hosting with build/start support

Typical production flow:

```bash
npm ci
npm run build
npm run start
```

If using Vercel:
- Connect repository
- Set build command: `next build` (default)
- Set output mode based on app requirements

## 14. Troubleshooting

### GitHub Push Rejected: Large File Error
If you accidentally committed `node_modules` or `.next`, GitHub may reject pushes due to files >100MB.

Fix checklist:
1. Ensure `.gitignore` includes `node_modules/` and `.next/`
2. Untrack generated/dependency folders:

```bash
git rm -r --cached node_modules .next
```

3. Commit cleanup:

```bash
git add -A
git commit -m "Remove tracked dependencies/build output"
```

4. If large file exists in history, rewrite history before pushing.

### Admin Pages Always Redirect to Login
- Verify browser localStorage has `ahona-admin=true`
- Login again from `/admin/login`
- Check browser privacy settings/extensions clearing localStorage

### Styles Not Updating
- Restart dev server
- Clear `.next` and rerun `npm run dev`

## 15. Contribution Guide

1. Create a feature branch from `main`
2. Keep commits focused and descriptive
3. Run lint/build before opening PR
4. Include UI screenshots for visual changes
5. Mention route-level impact in PR description

## 16. License

No explicit license file is currently included in this repository.
Add a `LICENSE` file (for example MIT) if open-source distribution is intended.
