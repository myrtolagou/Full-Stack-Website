-- =============================================================
-- seeds/dev_workflows.sql
--
-- Sample automation workflows for local development.
--
-- PURPOSE:
--   Populates the `workflows` table with realistic entries so the
--   workflow builder UI can be built and tested with existing data.
--
-- NOTE:
--   campaign_id and created_by values must match rows seeded by
--   dev_campaigns.sql and dev_users.sql respectively.
--   The `steps` column is JSONB — each step object should include
--   at minimum: { "type": string, "label": string, "config": object }
--
-- DEPENDS ON: all migrations, dev_users.sql, dev_campaigns.sql
--
-- HOW TO RUN:
--   psql $DATABASE_URL -f database/seeds/dev_workflows.sql
-- =============================================================

/*
INSERT INTO workflows (name, campaign_id, trigger, steps, is_active, created_by) VALUES
  (
    'Welcome Email Sequence',
    (SELECT id FROM campaigns WHERE title = 'Q1 Email Outreach'),
    'form_submit',
    '[
      { "type": "send_email", "label": "Send welcome email",    "config": { "template": "welcome" } },
      { "type": "wait",       "label": "Wait 2 days",           "config": { "days": 2 } },
      { "type": "send_email", "label": "Send follow-up email",  "config": { "template": "followup_1" } }
    ]',
    TRUE,
    (SELECT id FROM users WHERE email = 'alex@bcncor.com')
  ),
  (
    'Lead Nurture Drip',
    (SELECT id FROM campaigns WHERE title = 'Q1 Email Outreach'),
    'manual',
    '[
      { "type": "send_email", "label": "Intro email",           "config": { "template": "nurture_intro" } },
      { "type": "wait",       "label": "Wait 5 days",           "config": { "days": 5 } },
      { "type": "send_email", "label": "Case study email",      "config": { "template": "case_study_1" } },
      { "type": "tag",        "label": "Tag as warm lead",      "config": { "tag": "warm" } }
    ]',
    FALSE,
    (SELECT id FROM users WHERE email = 'maria@bcncor.com')
  ),
  (
    'Partner Onboarding Flow',
    (SELECT id FROM campaigns WHERE title = 'Partner Referral Launch'),
    'form_submit',
    '[
      { "type": "send_email", "label": "Partner welcome email", "config": { "template": "partner_welcome" } },
      { "type": "notify",     "label": "Notify account manager","config": { "channel": "email" } }
    ]',
    FALSE,
    (SELECT id FROM users WHERE email = 'alex@bcncor.com')
  );
*/
