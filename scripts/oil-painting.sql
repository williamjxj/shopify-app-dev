-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Painting styles table (enum)
CREATE TABLE painting_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined painting styles
INSERT INTO painting_styles (name, description, thumbnail_url) VALUES
  ('Renaissance', 'Classic Renaissance portrait style', 'https://your-bucket.s3.amazonaws.com/styles/renaissance-thumbnail.jpg'),
  ('Impressionist', 'Impressionist painting style with vibrant colors', 'https://your-bucket.s3.amazonaws.com/styles/impressionist-thumbnail.jpg'),
  ('Royal Portrait', 'Traditional royal portrait style', 'https://your-bucket.s3.amazonaws.com/styles/royal-portrait-thumbnail.jpg'),
  ('Anime Style', 'Japanese anime inspired portrait style', 'https://your-bucket.s3.amazonaws.com/styles/anime-thumbnail.jpg');

-- User artwork projects table (combining original + generated info)
CREATE TABLE artwork_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 1. Painting style selection (from painting_styles table)
  style_id UUID REFERENCES painting_styles(id) ON DELETE RESTRICT,
  
  -- 2. Optional detail field
  custom_details TEXT,
  
  -- 3. User uploaded image metadata (S3)
  original_image_s3_key TEXT NOT NULL,
  original_image_s3_url TEXT NOT NULL,
  original_image_filename TEXT NOT NULL,
  original_image_size INTEGER NOT NULL, -- in bytes
  original_image_mime_type TEXT NOT NULL,
  original_image_width INTEGER,
  original_image_height INTEGER,
  
  -- Thumbnail for original image (stored directly in Supabase)
  original_thumbnail_base64 TEXT,
  original_thumbnail_width INTEGER,
  original_thumbnail_height INTEGER,
  
  -- Generated artwork metadata (S3)
  generated_image_s3_key TEXT,
  generated_image_s3_url TEXT,
  generated_image_size INTEGER, -- in bytes
  generated_image_width INTEGER,
  generated_image_height INTEGER,
  
  -- Watermarked thumbnail for generated image (stored directly in Supabase)
  generated_thumbnail_base64 TEXT,
  generated_thumbnail_width INTEGER,
  generated_thumbnail_height INTEGER,
  
  -- Additional tracking information
  is_generated BOOLEAN DEFAULT FALSE,
  generation_date TIMESTAMP WITH TIME ZONE,
  is_downloaded BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  generation_parameters JSONB, -- Store any AI parameters used
  processing_time INTEGER, -- in milliseconds
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for faster queries
CREATE INDEX idx_artwork_projects_user_id ON artwork_projects(user_id);
CREATE INDEX idx_artwork_projects_style_id ON artwork_projects(style_id);
CREATE INDEX idx_artwork_projects_created_at ON artwork_projects(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only access their own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own artwork projects" ON artwork_projects
  FOR ALL USING (auth.uid() = user_id);

-- Public access policy for painting styles
CREATE POLICY "Anyone can view painting styles" ON painting_styles
  FOR SELECT USING (true);

-- Utility function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artwork_projects_updated_at
  BEFORE UPDATE ON artwork_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();