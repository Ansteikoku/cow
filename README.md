# 2ch-style Bulletin Board — Complete Starter

This archive contains a working starter for a 2000s 2ch-style bulletin board using:
- Supabase (Postgres + Storage)
- Cloudflare Pages / any static hosting for frontend
- Supabase Edge Function / Cloudflare Worker examples for secure posting & archiving

**Important:** Replace placeholder SUPABASE_URL and SUPABASE_PUBLIC_KEY / SERVICE_ROLE_KEY with your actual project keys in the environment or supabase.js file. Do NOT commit SERVICE_ROLE_KEY to public repos.

## Structure
- index.html
- board.html
- thread.html
- css/style.css
- js/supabase.js
- js/board.js
- js/thread.js
- js/anchor.js
- js/anti_spam.js
- functions/post_handler.js         (example Edge Function / Worker for posting)
- workers/archive_threads.js       (example archive worker)
- sql/setup.sql                    (create tables / views)
- sql/triggers.sql                 (optional triggers / rpc)
- README.md

## Quick start
1. Create Supabase project and run `sql/setup.sql` in SQL Editor.
2. Create buckets: `images` (public).
3. Deploy static site (Cloudflare Pages / GitHub Pages).
4. Deploy `functions/post_handler.js` as an Edge Function or Cloudflare Worker. Set env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
5. Deploy `workers/archive_threads.js` as a scheduled Worker (cron) to run daily.
6. Update `js/supabase.js` with your SUPABASE_URL and SUPABASE_PUBLIC_KEY.

## Notes
- This is a starter: you should secure service keys as environment variables on serverless platforms.
- For production, enable stricter spam protections, WAF (Cloudflare), and backups.

