-- Hobsons Bay + activate outer Melbourne councils for suburb imports
INSERT INTO councils (external_id, name, state, timezone, is_active)
VALUES
  ('city-of-hobsons-bay', 'Hobsons Bay City Council', 'VIC', 'Australia/Melbourne', TRUE)
ON CONFLICT (external_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

UPDATE councils SET is_active = TRUE, updated_at = NOW()
WHERE external_id IN ('city-of-moonee-valley', 'city-of-hobsons-bay');
