
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();

import authRoutes from './routes/authRoutes';
import { authMiddleware, optionalAuthMiddleware } from './middleware/authMiddleware';

import { PrismaClient } from './mockPrisma';
import * as videoService from './services/videoService';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3003;

app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

app.use('/auth', authRoutes);

// Video Upload Route (Wistia + Supabase) - PROTECTED
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { uploadToWistia, listWistiaVideos, deleteWistiaVideo, updateWistiaVideo, getWistiaVideo, getWistiaStats } from './services/wistiaService';

// Ensure uploads directory exists (still needed for temporary storage)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));

// Auth session endpoint - get current user
app.get('/auth/session', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({ user: null });
        }

        const token = authHeader.split(' ')[1];
        const { supabase } = await import('./services/supabase');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.json({ user: null });
        }

        res.json({ 
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name
            }
        });
    } catch (error) {
        console.error('Session check error:', error);
        res.json({ user: null });
    }
});

// Upload video - saves to Wistia + Supabase (PROTECTED - requires auth)
app.put('/uploads/:filename', authMiddleware, (req, res) => {
    const filename = req.params.filename as string;
    console.log(`Receiving upload for ${filename} from user ${req.user?.email}`);
    const filePath = path.join(uploadDir, filename);
    const writeStream = fs.createWriteStream(filePath);
    const customSlug = req.query.slug as string | undefined;

    req.pipe(writeStream);

    writeStream.on('finish', async () => {
        console.log('Upload finished locally, uploading to Wistia...');
        try {
            // Get title from query params or use filename
            const title = (req.query.title as string) || filename.replace(/\.[^/.]+$/, '');
            const description = req.query.description as string | undefined;
            
            const wistiaData = await uploadToWistia(filePath, customSlug, {
                title,
                description,
                ownerId: req.user?.id
            });
            // Optionally delete local file
            // fs.unlinkSync(filePath);
            res.status(200).json(wistiaData);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to upload to Wistia');
        }
    });

    writeStream.on('error', (err) => {
        console.error('Upload error', err);
        res.status(500).send(err.message);
    });
});

// =====================================================
// WISTIA MANAGEMENT API ROUTES
// =====================================================

// Get single Wistia video details
app.get('/wistia/videos/:hashedId', async (req, res) => {
    try {
        const video = await getWistiaVideo(req.params.hashedId);
        if (!video) {
            return res.status(404).json({ error: 'Video not found in Wistia' });
        }
        res.json(video);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch video from Wistia' });
    }
});

// Delete video from Wistia (and optionally from Supabase) - PROTECTED
app.delete('/wistia/videos/:hashedId', authMiddleware, async (req, res) => {
    try {
        const hashedId = req.params.hashedId as string;
        
        // Delete from Wistia
        const wistiaDeleted = await deleteWistiaVideo(hashedId);
        if (!wistiaDeleted) {
            return res.status(500).json({ error: 'Failed to delete video from Wistia' });
        }
        
        // Also try to delete from Supabase if it exists there
        const dbVideo = await videoService.getVideoByWistiaId(hashedId);
        if (dbVideo) {
            await videoService.deleteVideo(dbVideo.id);
        }
        
        res.json({ success: true, message: 'Video deleted from Wistia' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

// Update video in Wistia - PROTECTED
app.patch('/wistia/videos/:hashedId', authMiddleware, async (req, res) => {
    try {
        const hashedId = req.params.hashedId as string;
        const { name, description } = req.body;
        const updated = await updateWistiaVideo(hashedId, { name, description });
        
        if (!updated) {
            return res.status(500).json({ error: 'Failed to update video in Wistia' });
        }
        
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update video' });
    }
});

// Get Wistia account stats
app.get('/wistia/stats', async (req, res) => {
    try {
        const stats = await getWistiaStats();
        if (!stats) {
            return res.status(500).json({ error: 'Failed to fetch Wistia stats' });
        }
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// =====================================================
// VIDEO API ROUTES (Supabase - for metadata/slugs)
// =====================================================

// List all videos from Wistia (primary source)
app.get('/videos', async (req, res) => {
    console.log('GET /videos request received');
    try {
        const wistiaVideos = await listWistiaVideos();
        
        // Transform to match frontend expected format
        const formattedVideos = wistiaVideos.map(v => ({
            id: v.hashed_id,
            wistiaId: v.hashed_id,
            title: v.name,
            description: v.description,
            thumbnailUrl: v.thumbnail?.url,
            createdAt: v.created,
            updatedAt: v.updated,
            duration: v.duration,
            views: v.stats?.plays || 0,
            visitors: v.stats?.visitors || 0,
            status: v.status,
            type: v.type
        }));
        
        res.json(formattedVideos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to list videos' });
    }
});

// Get video by custom slug (for /aum/:slug routes)
app.get('/videos/slug/:slug', async (req, res) => {
    try {
        const slug = req.params.slug as string;
        const video = await videoService.getVideoBySlug(slug);
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        // Record view
        await videoService.recordVideoView(video.id);
        
        res.json({
            id: video.id,
            wistiaId: video.wistia_hashed_id,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnail_url,
            duration: video.duration,
            views: video.views + 1,
            customSlug: video.custom_slug,
            createdAt: video.created_at,
            embedUrl: video.wistia_embed_url
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch video' });
    }
});

// Get video by Wistia ID (backward compatibility)
app.get('/videos/wistia/:wistiaId', async (req, res) => {
    try {
        const wistiaId = req.params.wistiaId as string;
        const video = await videoService.getVideoByWistiaId(wistiaId);
        if (!video) {
            // Fallback: return basic info for Wistia videos not in DB
            return res.json({
                wistiaId: wistiaId,
                title: 'Video',
                embedUrl: `//fast.wistia.net/embed/iframe/${wistiaId}`
            });
        }
        
        await videoService.recordVideoView(video.id);
        
        res.json({
            id: video.id,
            wistiaId: video.wistia_hashed_id,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnail_url,
            duration: video.duration,
            views: video.views + 1,
            customSlug: video.custom_slug,
            createdAt: video.created_at,
            embedUrl: video.wistia_embed_url
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch video' });
    }
});

// Update video metadata - PROTECTED
app.patch('/videos/:id', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id as string;
        const { title, description, isPublic } = req.body;
        const video = await videoService.updateVideo(id, {
            title,
            description,
            is_public: isPublic
        });
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        res.json(video);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update video' });
    }
});

// Delete video - PROTECTED
app.delete('/videos/:id', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id as string;
        const success = await videoService.deleteVideo(id);
        if (!success) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

// =====================================================
// COMMENTS API ROUTES
// =====================================================

// Get comments for a video
app.get('/videos/:videoId/comments', async (req, res) => {
    try {
        const videoId = req.params.videoId as string;
        const comments = await videoService.getCommentsByVideoId(videoId);
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Add comment to video - PROTECTED
app.post('/videos/:videoId/comments', authMiddleware, async (req, res) => {
    try {
        const videoId = req.params.videoId as string;
        const { text, timestampSeconds } = req.body;
        const comment = await videoService.createComment({
            videoId: videoId,
            text,
            timestampSeconds,
            authorId: req.user?.id  // Use authenticated user ID
        });
        
        if (!comment) {
            return res.status(400).json({ error: 'Failed to create comment' });
        }
        
        res.status(201).json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Delete comment - PROTECTED
app.delete('/comments/:id', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id as string;
        const success = await videoService.deleteComment(id);
        if (!success) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// =====================================================
// SHARING LINKS API ROUTES
// =====================================================

// Create sharing link - PROTECTED
app.post('/videos/:videoId/share', authMiddleware, async (req, res) => {
    try {
        const videoId = req.params.videoId as string;
        const { customAlias, password, expiresAt, maxViews } = req.body;
        const sharingLink = await videoService.createSharingLink({
            videoId: videoId,
            customAlias,
            password,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            maxViews,
            createdBy: req.user?.id  // Use authenticated user ID
        });
        
        if (!sharingLink) {
            return res.status(400).json({ error: 'Failed to create sharing link' });
        }
        
        res.status(201).json({
            token: sharingLink.token,
            customAlias: sharingLink.custom_alias,
            shareUrl: `/share/${sharingLink.token}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create sharing link' });
    }
});

// Validate sharing link
app.get('/share/:token', async (req, res) => {
    try {
        const sharingLink = await videoService.getSharingLinkByToken(req.params.token);
        if (!sharingLink) {
            return res.status(404).json({ error: 'Invalid sharing link' });
        }
        
        // Check expiration
        if (sharingLink.expires_at && new Date(sharingLink.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Sharing link has expired' });
        }
        
        // Check max views
        if (sharingLink.max_views && sharingLink.current_views >= sharingLink.max_views) {
            return res.status(410).json({ error: 'Sharing link has reached maximum views' });
        }
        
        const video = await videoService.getVideoById(sharingLink.video_id);
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        res.json({
            video: {
                wistiaId: video.wistia_hashed_id,
                title: video.title,
                embedUrl: video.wistia_embed_url
            },
            allowComments: sharingLink.allow_comments,
            allowDownloads: sharingLink.allow_downloads
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to validate sharing link' });
    }
});

// =====================================================
// HEALTH & ROOT ROUTES
// =====================================================

app.get('/', (req, res) => {
    res.send('Loom Clone API is running');
});

// Health check
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: String(error) });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
