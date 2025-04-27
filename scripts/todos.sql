-- Create the todos table
CREATE TABLE IF NOT EXISTS todos (
  id bigint GENERATED ALWAYS AS IDENTITY,
  task text,
  status text DEFAULT 'Not Started',
  inserted_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Insert random records
-- Note: You must replace with a valid UUID from your auth.users table
INSERT INTO todos (task, status) VALUES
  ('Complete project proposal', 'In Progress'),
  ('Schedule team meeting', 'Not Started'),
  ('Review code changes', 'In Progress'),
  ('Update documentation', 'Not Started'),
  ('Fix bug in authentication module', 'Not Started'),
  ('Deploy new version to staging', 'Not Started'),
  ('Prepare presentation for stakeholders', 'In Progress'),
  ('Research new API integration options', 'Complete');