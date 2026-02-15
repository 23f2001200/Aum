import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase credentials not configured. Some features will be limited.');
}

// Create Supabase client with service role key (for server-side operations)
export const supabase = createClient(
    supabaseUrl || '',
    supabaseServiceKey || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Database types for TypeScript
export interface DbUser {
    id: string;
    email: string;
    password_hash?: string;
    name?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface DbVideo {
    id: string;
    title: string;
    description?: string;
    wistia_hashed_id: string;
    wistia_playback_url?: string;
    wistia_embed_url?: string;
    thumbnail_url?: string;
    duration?: number;
    custom_slug?: string;
    is_public: boolean;
    password_hash?: string;
    owner_id?: string;
    workspace_id?: string;
    views: number;
    wistia_metadata?: any;
    created_at: string;
    updated_at: string;
}

export interface DbComment {
    id: string;
    video_id: string;
    author_id?: string;
    text: string;
    timestamp_seconds?: number;
    parent_id?: string;
    is_resolved: boolean;
    created_at: string;
    updated_at: string;
}

export interface DbSharingLink {
    id: string;
    video_id: string;
    token: string;
    custom_alias?: string;
    password_hash?: string;
    expires_at?: string;
    max_views?: number;
    current_views: number;
    allow_comments: boolean;
    allow_downloads: boolean;
    created_by?: string;
    created_at: string;
}

export default supabase;
