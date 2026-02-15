import { supabase, DbVideo, DbComment, DbSharingLink } from './supabase';
import crypto from 'crypto';

// Generate a random URL-safe slug
function generateSlug(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// =====================================================
// VIDEO OPERATIONS
// =====================================================

export interface CreateVideoInput {
    wistiaHashedId: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: number;
    wistiaMetadata?: any;
    ownerId?: string;
    workspaceId?: string;
    customSlug?: string;
}

export async function createVideo(input: CreateVideoInput): Promise<DbVideo | null> {
    const slug = input.customSlug || generateSlug(10);
    
    const { data, error } = await supabase
        .from('videos')
        .insert({
            wistia_hashed_id: input.wistiaHashedId,
            title: input.title || 'Untitled Video',
            description: input.description,
            thumbnail_url: input.thumbnailUrl,
            duration: input.duration,
            custom_slug: slug,
            wistia_embed_url: `//fast.wistia.net/embed/iframe/${input.wistiaHashedId}`,
            wistia_metadata: input.wistiaMetadata,
            owner_id: input.ownerId,
            workspace_id: input.workspaceId || '00000000-0000-0000-0000-000000000001',
            is_public: true,
            views: 0
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating video:', error);
        return null;
    }

    return data;
}

export async function getVideoById(id: string): Promise<DbVideo | null> {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching video by ID:', error);
        return null;
    }

    return data;
}

export async function getVideoByWistiaId(wistiaHashedId: string): Promise<DbVideo | null> {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('wistia_hashed_id', wistiaHashedId)
        .single();

    if (error) {
        console.error('Error fetching video by Wistia ID:', error);
        return null;
    }

    return data;
}

export async function getVideoBySlug(slug: string): Promise<DbVideo | null> {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('custom_slug', slug)
        .single();

    if (error) {
        console.error('Error fetching video by slug:', error);
        return null;
    }

    return data;
}

export async function listVideos(limit: number = 50, offset: number = 0): Promise<DbVideo[]> {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error listing videos:', error);
        return [];
    }

    return data || [];
}

export async function updateVideo(id: string, updates: Partial<DbVideo>): Promise<DbVideo | null> {
    const { data, error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating video:', error);
        return null;
    }

    return data;
}

export async function incrementVideoViews(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_views', { video_id: id });
    
    if (error) {
        // Fallback: manual increment
        const video = await getVideoById(id);
        if (video) {
            await supabase
                .from('videos')
                .update({ views: (video.views || 0) + 1 })
                .eq('id', id);
        }
    }
}

export async function deleteVideo(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting video:', error);
        return false;
    }

    return true;
}

// =====================================================
// SHARING LINK OPERATIONS
// =====================================================

export interface CreateSharingLinkInput {
    videoId: string;
    customAlias?: string;
    password?: string;
    expiresAt?: Date;
    maxViews?: number;
    allowComments?: boolean;
    allowDownloads?: boolean;
    createdBy?: string;
}

export async function createSharingLink(input: CreateSharingLinkInput): Promise<DbSharingLink | null> {
    const token = crypto.randomBytes(16).toString('hex');
    const passwordHash = input.password 
        ? crypto.createHash('sha256').update(input.password).digest('hex')
        : null;

    const { data, error } = await supabase
        .from('sharing_links')
        .insert({
            video_id: input.videoId,
            token,
            custom_alias: input.customAlias,
            password_hash: passwordHash,
            expires_at: input.expiresAt?.toISOString(),
            max_views: input.maxViews,
            allow_comments: input.allowComments ?? true,
            allow_downloads: input.allowDownloads ?? false,
            created_by: input.createdBy
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating sharing link:', error);
        return null;
    }

    return data;
}

export async function getSharingLinkByToken(token: string): Promise<DbSharingLink | null> {
    const { data, error } = await supabase
        .from('sharing_links')
        .select('*')
        .eq('token', token)
        .single();

    if (error) {
        console.error('Error fetching sharing link:', error);
        return null;
    }

    return data;
}

export async function getSharingLinkByAlias(alias: string): Promise<DbSharingLink | null> {
    const { data, error } = await supabase
        .from('sharing_links')
        .select('*')
        .eq('custom_alias', alias)
        .single();

    if (error) {
        console.error('Error fetching sharing link by alias:', error);
        return null;
    }

    return data;
}

// =====================================================
// COMMENT OPERATIONS
// =====================================================

export interface CreateCommentInput {
    videoId: string;
    authorId?: string;
    text: string;
    timestampSeconds?: number;
    parentId?: string;
}

export async function createComment(input: CreateCommentInput): Promise<DbComment | null> {
    const { data, error } = await supabase
        .from('comments')
        .insert({
            video_id: input.videoId,
            author_id: input.authorId,
            text: input.text,
            timestamp_seconds: input.timestampSeconds,
            parent_id: input.parentId
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating comment:', error);
        return null;
    }

    return data;
}

export async function getCommentsByVideoId(videoId: string): Promise<DbComment[]> {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }

    return data || [];
}

export async function deleteComment(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting comment:', error);
        return false;
    }

    return true;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function recordVideoView(videoId: string, viewerData?: {
    viewerId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
}): Promise<void> {
    // Increment view count
    await incrementVideoViews(videoId);

    // Record detailed view analytics (optional)
    if (viewerData) {
        await supabase
            .from('video_views')
            .insert({
                video_id: videoId,
                viewer_id: viewerData.viewerId,
                session_id: viewerData.sessionId,
                ip_address: viewerData.ipAddress,
                user_agent: viewerData.userAgent
            });
    }
}
