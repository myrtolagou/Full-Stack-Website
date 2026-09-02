# BcnCor Marketing Automation Platform

An internal web application for automating a marketing content workflow — from scraping competitor content and blog articles to generating carousels and blog drafts using AI.

Company and competitor names in this repository have been replaced with generic placeholders (`BcnCor`, `Competitor 1`–`Competitor 7`) for privacy. Real API keys, database credentials, and deploy configuration are excluded via `.gitignore` and were never committed.

---

## What it does

- Scrapes the company's own blog and generates carousel slides and LinkedIn/Instagram captions using Claude AI
- Monitors 7 competitors (blogs, LinkedIn, Instagram) and scores content by strategic relevance
- Auto-generates blog draft responses to high-priority competitor content
- Manages a content calendar showing approved and published posts
- Provides a Scheduler to automate all pipelines on a set frequency
- Exports carousel content directly to Canva for final design

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, deployed on Firebase Hosting |
| Backend | Node.js + Express, deployed on Google Cloud Run |
| Database | PostgreSQL on Google Cloud SQL |
| AI | Anthropic Claude API (Sonnet) |
| Scraping | Apify (LinkedIn + Instagram), custom scrapers (blogs) |

---

## Setup

See `bcncor-app/backend/README.md` for backend setup (environment variables, database migrations, seeds) and `bcncor-app/frontend` for the Vite frontend. Copy `.env.production.example` and `.firebaserc.example` in the frontend to your own real values before deploying — they are gitignored on purpose.

---

Built by a 6-person student project team.
