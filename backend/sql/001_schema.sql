-- ============================================================
-- AI Product Intelligence System — Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users imported from CRM (Salesforce / HubSpot mock)
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL UNIQUE,
    name          TEXT,
    company       TEXT,
    company_size  TEXT        CHECK (company_size IN ('1-10','11-50','51-200','201-500','500+')),
    role          TEXT,
    industry      TEXT,
    source        TEXT        NOT NULL CHECK (source IN ('salesforce','hubspot')),
    status        TEXT        NOT NULL CHECK (status IN ('signed_up','not_engaged')),
    signed_up_at  TIMESTAMPTZ,
    last_active   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated meeting briefs
CREATE TABLE IF NOT EXISTS briefs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content           JSONB       NOT NULL,   -- full structured brief
    summary           TEXT,                     -- plain-text executive summary
    confidence_score  REAL        CHECK (confidence_score >= 0 AND confidence_score <= 1),
    agent_outputs     JSONB,                    -- raw per-agent results
    feedback          TEXT,                      -- user feedback for iteration
    parent_brief_id   UUID REFERENCES briefs(id),  -- for feedback loop lineage
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_users_status   ON users(status);
CREATE INDEX idx_users_source   ON users(source);
CREATE INDEX idx_briefs_created ON briefs(created_at DESC);
