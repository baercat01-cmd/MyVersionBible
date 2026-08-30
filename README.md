# MyVersionBible

An offline-first, install-anywhere Bible study app: phone, computer, and Android
e-readers (Boox) through one PWA.

## What it does

- **Download Bible versions** — public-domain translations (KJV, Darby, WEB, ASV,
  YLT, …) plus Hebrew (WLC) and Greek (TR) texts, from the open
  [bolls.life](https://bolls.life) corpus. Each version is stored completely on the
  device (IndexedDB), so reading needs no connection. Parallel two-version view included.
- **Study system** — three kinds of notes, all searchable and taggable:
  - *Verse notes & highlights*: select verses in the reader, pick a highlight
    color or attach a note; markers show up whenever you read that passage.
  - *Structured studies*: SOAP, Inductive, Word Study, Character Study, and
    Chapter Summary templates.
  - *Journal*: freeform entries.
- **Sync** — notes save locally first and sync to a private Supabase backend
  (shared with the Vesper project, table `mvb_notes`, strict per-user RLS)
  when signed in and online. Last-write-wins, works fine offline for weeks.
- **Print a study book** — pick any set of notes, and the app compiles a book
  (title page, table of contents, the scripture text of each referenced passage,
  formatted sections) that you print or *Save as PDF* from the browser.

## Stack

Vite + React + TypeScript PWA · Dexie (IndexedDB) for offline storage ·
`vite-plugin-pwa` service worker · Supabase (auth + sync).

## Develop

```sh
npm install
npm run dev
```

## Build / deploy

```sh
npm run build   # outputs dist/
```

Deploy `dist/` to any static host (Vercel). On each device, open the URL and
use "Add to Home Screen" / "Install app".

## Backend

`supabase/migrations/` holds the schema applied to the shared Supabase project
(`mvb_notes` + RLS). The client uses only the publishable key; every row is
guarded by `auth.uid() = user_id` policies.
