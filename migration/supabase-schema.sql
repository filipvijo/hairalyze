-- Hairalyze Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Submissions table (main hair analysis data)
CREATE TABLE submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_user_id TEXT, -- Firebase user ID for migration tracking
  
  -- User questionnaire data
  hair_problem TEXT DEFAULT '',
  allergies TEXT DEFAULT '',
  medication TEXT DEFAULT '',
  dyed TEXT DEFAULT '',
  wash_frequency TEXT DEFAULT '',
  additional_concerns TEXT DEFAULT '',
  
  -- Image URLs (S3 paths)
  hair_photos TEXT[] DEFAULT '{}',
  hair_photo_analysis TEXT[] DEFAULT '{}',
  product_images TEXT[] DEFAULT '{}',
  product_image_analysis TEXT[] DEFAULT '{}',
  product_names TEXT[] DEFAULT '{}',
  
  -- Structured analysis data (stored as JSONB for flexibility)
  analysis JSONB DEFAULT '{
    "rawAnalysis": "",
    "detailedAnalysis": "",
    "metrics": {
      "moisture": 0,
      "strength": 0,
      "elasticity": 0,
      "scalpHealth": 0
    },
    "haircareRoutine": {
      "cleansing": "",
      "conditioning": "",
      "treatments": "",
      "styling": ""
    },
    "routineSchedule": {
      "dailyRoutine": {
        "morning": [],
        "evening": []
      },
      "weeklyRoutine": {
        "washDays": {
          "frequency": "",
          "steps": []
        },
        "treatments": {
          "deepConditioning": "",
          "scalpCare": "",
          "specialTreatments": ""
        }
      }
    },
    "productSuggestions": [],
    "aiBonusTips": []
  }',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (for AI chat history - future feature)
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Hair Analysis Chat',
  messages JSONB DEFAULT '[]', -- Array of {role: 'user'|'assistant', content: 'text', timestamp: 'iso'}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_submission_id ON conversations(submission_id);

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can manage their own submissions" ON submissions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_submissions_updated_at 
  BEFORE UPDATE ON submissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for easier querying of submissions with user email
CREATE VIEW submissions_with_user AS
SELECT 
  s.*,
  u.email as user_email
FROM submissions s
JOIN auth.users u ON s.user_id = u.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON submissions TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT SELECT ON submissions_with_user TO authenticated;
