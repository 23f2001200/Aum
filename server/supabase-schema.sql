-- =====================================================
-- SUPABASE DATABASE SCHEMA FOR LOOM CLONE
-- Run this SQL in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- 2. WORKSPACES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. WORKSPACE MEMBERS TABLE
-- =====================================================
CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'VIEWER',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- =====================================================
-- 4. VIDEOS TABLE (CORE TABLE)
-- =====================================================
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    title VARCHAR(500) DEFAULT 'Untitled Video',
    description TEXT,
    
    -- Wistia Integration
    wistia_hashed_id VARCHAR(100) UNIQUE NOT NULL,  -- Wistia's video ID
    wistia_playback_url TEXT,                        -- Direct playback URL from Wistia
    wistia_embed_url TEXT,                           -- Embed iframe URL
    
    -- Thumbnail & Duration
    thumbnail_url TEXT,
    duration INTEGER,  -- Duration in seconds
    
    -- Custom Sharing
    custom_slug VARCHAR(100) UNIQUE,  -- For URLs like /aum/custom-slug
    is_public BOOLEAN DEFAULT true,
    password_hash VARCHAR(255),       -- Optional password protection
    
    -- Ownership
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    
    -- Stats
    views INTEGER DEFAULT 0,
    
    -- Metadata from Wistia
    wistia_metadata JSONB,  -- Store full Wistia response
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_videos_wistia_id ON videos(wistia_hashed_id);
CREATE INDEX IF NOT EXISTS idx_videos_custom_slug ON videos(custom_slug);
CREATE INDEX IF NOT EXISTS idx_videos_owner ON videos(owner_id);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);

-- =====================================================
-- 5. SHARING LINKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sharing_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Shareable URL components
    token VARCHAR(100) UNIQUE NOT NULL,  -- Random token for link
    custom_alias VARCHAR(100) UNIQUE,    -- Custom alias like "my-demo"
    
    -- Access Control
    password_hash VARCHAR(255),
    expires_at TIMESTAMPTZ,
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    
    -- Settings
    allow_comments BOOLEAN DEFAULT true,
    allow_downloads BOOLEAN DEFAULT false,
    
    -- Tracking
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sharing_token ON sharing_links(token);
CREATE INDEX IF NOT EXISTS idx_sharing_alias ON sharing_links(custom_alias);

-- =====================================================
-- 6. COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    text TEXT NOT NULL,
    timestamp_seconds INTEGER,  -- Video timestamp for time-stamped comments
    
    -- Threading
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_resolved BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);

-- =====================================================
-- 7. REACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id, emoji)
);

-- =====================================================
-- 8. VIEW ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS video_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL for anonymous
    
    -- Session info
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- Watch data
    watch_duration INTEGER,  -- Seconds watched
    completed BOOLEAN DEFAULT false,
    
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_views_video ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON video_views(viewed_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate URL-safe slugs
CREATE OR REPLACE FUNCTION generate_slug(length INTEGER DEFAULT 8)
RETURNS VARCHAR AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result VARCHAR := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment video views atomically
CREATE OR REPLACE FUNCTION increment_views(video_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE videos SET views = views + 1 WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharing_links ENABLE ROW LEVEL SECURITY;

-- Videos: Public videos are readable by anyone
CREATE POLICY "Public videos are viewable by everyone" ON videos
    FOR SELECT USING (is_public = true);

-- Videos: Owners can do everything
CREATE POLICY "Owners can manage their videos" ON videos
    FOR ALL USING (auth.uid() = owner_id);

-- Comments: Anyone can read comments on public videos
CREATE POLICY "Comments on public videos are viewable" ON comments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM videos WHERE videos.id = comments.video_id AND videos.is_public = true)
    );

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Create a default workspace
INSERT INTO workspaces (id, name, owner_id) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Workspace', NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for video list with stats
CREATE OR REPLACE VIEW video_list AS
SELECT 
    v.id,
    v.title,
    v.description,
    v.wistia_hashed_id,
    v.thumbnail_url,
    v.duration,
    v.custom_slug,
    v.is_public,
    v.views,
    v.created_at,
    u.name as owner_name,
    u.avatar_url as owner_avatar,
    (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) as comment_count
FROM videos v
LEFT JOIN users u ON v.owner_id = u.id;

-- =====================================================
-- DONE! Your database is ready.
-- =====================================================
