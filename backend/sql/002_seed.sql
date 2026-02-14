-- ============================================================
-- Seed: 100 signed-up users + 200 not-engaged leads
-- Run after 001_schema.sql
-- ============================================================

-- Helper: generate a deterministic email
-- We use generate_series so no external deps are needed.

INSERT INTO users (email, name, company, company_size, role, industry, source, status, signed_up_at, last_active)
SELECT
    'user' || i || '@' ||
        (ARRAY['acme.com','globex.io','initech.co','umbrella.dev','stark.ai',
               'waynetech.com','oscorp.io','lexcorp.co','daily.dev','capsule.ai'])[1 + (i % 10)]
        AS email,
    'User ' || i AS name,
    (ARRAY['Acme Corp','Globex Inc','Initech','Umbrella LLC','Stark AI',
           'WayneTech','OsCorp','LexCorp','Daily Dev','Capsule AI'])[1 + (i % 10)]
        AS company,
    (ARRAY['1-10','11-50','51-200','201-500','500+'])[1 + (i % 5)]
        AS company_size,
    (ARRAY['Founder','PM','Marketing','Engineering','Sales','CS','Design'])[1 + (i % 7)]
        AS role,
    (ARRAY['SaaS','FinTech','HealthTech','E-commerce','DevTools','EdTech','AI/ML'])[1 + (i % 7)]
        AS industry,
    CASE WHEN i % 2 = 0 THEN 'salesforce' ELSE 'hubspot' END AS source,
    'signed_up' AS status,
    now() - (random() * interval '90 days') AS signed_up_at,
    now() - (random() * interval '7 days')  AS last_active
FROM generate_series(1, 100) AS s(i)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, name, company, company_size, role, industry, source, status, signed_up_at, last_active)
SELECT
    'lead' || i || '@' ||
        (ARRAY['prospect.com','outreach.io','cold.co','funnel.dev','pipeline.ai',
               'target.com','reach.io','connect.co','engage.dev','nurture.ai'])[1 + (i % 10)]
        AS email,
    'Lead ' || i AS name,
    (ARRAY['Prospect Co','Outreach Inc','Cold Corp','Funnel LLC','Pipeline AI',
           'Target Co','Reach Inc','Connect Corp','Engage LLC','Nurture AI'])[1 + (i % 10)]
        AS company,
    (ARRAY['1-10','11-50','51-200','201-500','500+'])[1 + (i % 5)]
        AS company_size,
    (ARRAY['Founder','PM','Marketing','Engineering','Sales','CS','Design'])[1 + (i % 7)]
        AS role,
    (ARRAY['SaaS','FinTech','HealthTech','E-commerce','DevTools','EdTech','AI/ML'])[1 + (i % 7)]
        AS industry,
    CASE WHEN i % 3 = 0 THEN 'salesforce' ELSE 'hubspot' END AS source,
    'not_engaged' AS status,
    NULL AS signed_up_at,
    NULL AS last_active
FROM generate_series(1, 200) AS s(i)
ON CONFLICT (email) DO NOTHING;
