-- Checkpoint Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the data model.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Events Table
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  ticket_price NUMERIC NOT NULL, -- Ticket price in USDC (6 decimals, e.g. 50.00)
  organizer VARCHAR(42) NOT NULL, -- EVM Address
  end_time BIGINT NOT NULL, -- UNIX timestamp in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on organizer address
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer);

-- 2. RSVPs Table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  attendee VARCHAR(42) NOT NULL, -- EVM Address of attendee
  tx_hash TEXT, -- Escrow deposit transaction hash
  status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, deposited, checked_in, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(event_id, attendee)
);

-- Index on attendee address
CREATE INDEX IF NOT EXISTS idx_rsvps_attendee ON rsvps(attendee);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  vendor_address VARCHAR(42) NOT NULL, -- EVM Address of vendor
  amount NUMERIC NOT NULL, -- Invoice amount in USDC (6 decimals)
  file_url TEXT NOT NULL, -- URL of uploaded invoice document (PDF/Image)
  status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, approved, rejected, paid
  feedback TEXT, -- Feedback from AI Agent review
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on vendor and event
CREATE INDEX IF NOT EXISTS idx_invoices_vendor ON invoices(vendor_address);
CREATE INDEX IF NOT EXISTS idx_invoices_event ON invoices(event_id);

-- 4. Agent Decisions Table (Audit trail of autonomous agent activities)
CREATE TABLE IF NOT EXISTS agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- check_in, settle, invoice_approval
  target_address VARCHAR(42), -- Target address (attendee or vendor)
  decision VARCHAR(50) NOT NULL, -- approved, rejected, processed
  reasoning TEXT NOT NULL, -- Detailed LLM explanation of the decision
  tx_hash TEXT, -- Resulting transaction hash
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on event and target
CREATE INDEX IF NOT EXISTS idx_agent_decisions_event ON agent_decisions(event_id);

-- Enable Realtime for all tables
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table rsvps;
alter publication supabase_realtime add table invoices;
alter publication supabase_realtime add table agent_decisions;
