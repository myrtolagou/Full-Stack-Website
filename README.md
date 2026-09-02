An internal web application for automating a marketing content workflow.

Company and competitor names in this repository have been placed with generic placeholders (`BcnCor`, `Competitor 1`–`Competitor 7`) for privacy.

---

## What it does

- Monitors market competitors on online platforms and scores content by strategic relevance
- Auto-generates responses to high-priority competitor content
- Manages a content calendar showing approved and published posts
- Provides a Scheduler to automate all pipelines on a set frequency
- Exports targeted content 

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, deployed on Firebase Hosting |
| Backend | Node.js + Express, deployed on Google Cloud Run |
| Database | PostgreSQL on Google Cloud SQL |
| AI | Anthropic Claude API (Sonnet) |
| Scraping | Apify, custom scrapers |

---

## Setup

See `bcncor-app/backend/README.md` for backend setup (environment variables, database migrations, seeds) and `bcncor-app/frontend` for the Vite frontend. Copy `.env.production.example` and `.firebaserc.example` in the frontend to your own real values before deploying.

