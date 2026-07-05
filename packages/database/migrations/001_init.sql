-- 001_init.sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE councils (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'VIC',
  timezone TEXT NOT NULL DEFAULT 'Australia/Melbourne',
  coverage_geom GEOMETRY(MultiPolygon, 4326),
  last_import_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE parking_bays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  council_id UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
  external_bay_id TEXT NOT NULL,
  external_road_segment_id TEXT,
  street_description TEXT NOT NULL,
  suburb TEXT,
  location GEOMETRY(Point, 4326) NOT NULL,
  bay_type TEXT NOT NULL DEFAULT 'general',
  marker_id TEXT,
  zone_id TEXT,
  source TEXT NOT NULL,
  source_updated_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (council_id, external_bay_id)
);

CREATE INDEX idx_parking_bays_location ON parking_bays USING GIST (location);
CREATE INDEX idx_parking_bays_council ON parking_bays (council_id);
CREATE INDEX idx_parking_bays_marker ON parking_bays (marker_id);

CREATE TABLE parking_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bay_id UUID NOT NULL REFERENCES parking_bays(id) ON DELETE CASCADE,
  council_id UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
  external_restriction_id TEXT,
  kind TEXT NOT NULL,
  days_of_week SMALLINT[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_stay_minutes INTEGER,
  payment_required BOOLEAN NOT NULL DEFAULT FALSE,
  rate_per_hour NUMERIC(8,2),
  permit_required TEXT,
  permit_exempt TEXT[],
  vehicle_types TEXT[],
  priority INTEGER NOT NULL DEFAULT 0,
  effective_from DATE,
  effective_to DATE,
  is_temporary BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL,
  source_updated_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parking_restrictions_bay ON parking_restrictions (bay_id);
CREATE INDEX idx_parking_restrictions_council ON parking_restrictions (council_id);

CREATE TABLE parking_occupancy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bay_id UUID NOT NULL REFERENCES parking_bays(id) ON DELETE CASCADE,
  is_occupied BOOLEAN NOT NULL,
  sensor_id TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  observed_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parking_occupancy_bay_observed ON parking_occupancy (bay_id, observed_at DESC);

CREATE TABLE parking_meters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  council_id UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
  bay_id UUID REFERENCES parking_bays(id) ON DELETE SET NULL,
  external_meter_id TEXT NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL,
  rate_per_hour NUMERIC(8,2),
  source TEXT NOT NULL,
  source_updated_at TIMESTAMPTZ,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (council_id, external_meter_id)
);

CREATE INDEX idx_parking_meters_location ON parking_meters USING GIST (location);

CREATE TABLE parking_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bay_id UUID REFERENCES parking_bays(id) ON DELETE SET NULL,
  council_id UUID REFERENCES councils(id) ON DELETE SET NULL,
  issue_type TEXT NOT NULL,
  note TEXT,
  photo_url TEXT,
  reporter_device_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE saved_parking_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT,
  bay_id UUID REFERENCES parking_bays(id) ON DELETE SET NULL,
  street_description TEXT,
  suburb TEXT,
  location GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_locations_device ON saved_parking_locations (device_id);

CREATE TABLE parking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL,
  bay_id UUID NOT NULL REFERENCES parking_bays(id) ON DELETE CASCADE,
  vehicle_registration TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  expected_end_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  estimated_cost NUMERIC(8,2),
  reminders JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parking_sessions_device ON parking_sessions (device_id, status);

CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  council_id UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
  dataset_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  records_imported INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE import_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  external_id TEXT,
  reason TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO councils (external_id, name, state, timezone, is_active)
VALUES
  ('city-of-melbourne', 'City of Melbourne', 'VIC', 'Australia/Melbourne', TRUE),
  ('city-of-yarra', 'City of Yarra', 'VIC', 'Australia/Melbourne', FALSE),
  ('city-of-port-phillip', 'City of Port Phillip', 'VIC', 'Australia/Melbourne', FALSE),
  ('city-of-stonnington', 'City of Stonnington', 'VIC', 'Australia/Melbourne', FALSE),
  ('city-of-merri-bek', 'City of Merri-bek', 'VIC', 'Australia/Melbourne', FALSE),
  ('city-of-maribyrnong', 'City of Maribyrnong', 'VIC', 'Australia/Melbourne', FALSE),
  ('city-of-darebin', 'City of Darebin', 'VIC', 'Australia/Melbourne', FALSE),
  ('city-of-boroondara', 'City of Boroondara', 'VIC', 'Australia/Melbourne', FALSE),
  ('city-of-moonee-valley', 'City of Moonee Valley', 'VIC', 'Australia/Melbourne', FALSE),
  ('city-of-glen-eira', 'City of Glen Eira', 'VIC', 'Australia/Melbourne', FALSE)
ON CONFLICT (external_id) DO NOTHING;
