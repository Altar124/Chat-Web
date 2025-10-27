INSTALLATION & DEPLOY GUIDE

This combined package includes:
- A Next.js project (folder root).
- A modern minimal static index.html placed into the Next.js project's public/ folder.
- Supabase helper libs and demo E2E chat client.

Prerequisites:
1. Node.js 18+ and npm.
2. A Supabase project with:
   - A PostgreSQL database and 'messages' table per provided SQL schema.
   - A storage bucket named 'chat-files' (private).
   - RLS and policies configured for your needs.
3. Vercel account (optional) for deployment.

Local development:
1. Unzip and open terminal at the project root (where package.json is).
2. Install deps:
   npm install
3. Create .env.local file with:
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
4. Run dev server:
   npm run dev
5. Open http://localhost:3000
   The static modern index.html is served from /public/index.html and the Next.js app is the main app.

Static-only setup:
- If you only want the static index.html, open the file `public/index.html` and replace SUPABASE_URL and SUPABASE_ANON_KEY placeholders with your values.
- Then host that file on any static host (Vercel, Netlify, GitHub Pages).

Supabase setup notes:
- Create table 'messages' with columns: id (uuid primary key), room_id (text), sender_id (text), ciphertext (text), attachments (jsonb), created_at (timestamptz default now()).
- Create storage bucket 'chat-files' and set appropriate policies. Use signed URLs for serving attachments.

E2E and security:
- Demo stores symmetric keys in localStorage. Replace with proper key exchange before production.
- Do not use anon keys in production for sensitive data without policies.
- Enable RLS and Supabase Auth for user management.

Deploy to Vercel:
1. Push repo to GitHub.
2. Create new Vercel project and import.
3. Set environment variables in Vercel settings (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).
4. Deploy.

For issues, check browser console and Supabase log panel.


STATIC AUTH PAGES
- public/login.html
- public/register.html
- public/dashboard.html

Edit each file and replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values before upload.

'Remember me' behavior: checking 'Ingat saya' leaves session in localStorage. If unchecked session stored in sessionStorage and cleared when browser closed.
