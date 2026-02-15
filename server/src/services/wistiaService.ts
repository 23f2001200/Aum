
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { createVideo } from './videoService';

const WISTIA_API_URL = 'https://upload.wistia.com';
const WISTIA_DATA_API_URL = 'https://api.wistia.com/v1';

export interface WistiaUploadResult {
    hashed_id: string;
    name: string;
    thumbnail: { url: string };
    duration: number;
    created: string;
    // Database record
    dbVideo?: any;
    customSlug?: string;
}

export interface WistiaVideo {
    id: string;
    hashed_id: string;
    name: string;
    description?: string;
    thumbnail: { url: string };
    duration: number;
    created: string;
    updated: string;
    status: string;
    type: string;
    progress?: number;
    assets?: any[];
    stats?: {
        plays: number;
        visitors: number;
        averagePercentWatched: number;
    };
}

export interface UploadOptions {
    title?: string;
    description?: string;
    ownerId?: string;
}

export const uploadToWistia = async (filePath: string, customSlug?: string, options?: UploadOptions): Promise<WistiaUploadResult> => {
    const token = process.env.WISTIA_ACCESS_TOKEN;
    console.log('Wistia Token:', token ? 'Found' : 'Missing');
    if (!token) {
        throw new Error('WISTIA_ACCESS_TOKEN is not configured');
    }

    const fileStream = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append('file', fileStream);
    formData.append('access_token', token);

    try {
        const response = await axios.post(WISTIA_API_URL, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        const wistiaData = response.data;
        console.log('Wistia upload successful:', wistiaData.hashed_id);

        // Save to Supabase database with accurate duration from Wistia
        const dbVideo = await createVideo({
            wistiaHashedId: wistiaData.hashed_id,
            title: options?.title || wistiaData.name || 'Untitled Video',
            description: options?.description,
            thumbnailUrl: wistiaData.thumbnail?.url,
            duration: Math.round(wistiaData.duration || 0), // Use Wistia's duration
            wistiaMetadata: wistiaData,
            customSlug: customSlug,
            ownerId: options?.ownerId
        });

        if (dbVideo) {
            console.log('Video saved to Supabase:', dbVideo.id, 'slug:', dbVideo.custom_slug);
        } else {
            console.warn('Failed to save video to Supabase, but Wistia upload succeeded');
        }

        return {
            ...wistiaData,
            dbVideo,
            customSlug: dbVideo?.custom_slug
        };
    } catch (error: any) {
        const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Wistia Upload Error:', errorMsg);

        // Log to file for debugging
        fs.appendFileSync('wistia-error.log', `${new Date().toISOString()} - Upload Error: ${errorMsg}\n`);

        throw new Error('Failed to upload to Wistia');
    }
};

export const listWistiaVideos = async (): Promise<WistiaVideo[]> => {
    try {
        const token = process.env.WISTIA_ACCESS_TOKEN;
        console.log('List Wistia Token:', token ? 'Found' : 'Missing');

        if (!token) {
            console.warn('WISTIA_ACCESS_TOKEN is not configured, returning empty list.');
            return [];
        }

        const response = await axios.get(`${WISTIA_DATA_API_URL}/medias.json`, {
            params: { access_token: token },
        });

        // Return full Wistia video data
        return response.data.map((video: any) => ({
            id: video.hashed_id,
            hashed_id: video.hashed_id,
            name: video.name,
            description: video.description,
            thumbnail: video.thumbnail,
            duration: video.duration,
            created: video.created,
            updated: video.updated,
            status: video.status,
            type: video.type,
            progress: video.progress,
            assets: video.assets,
            stats: {
                plays: video.stats?.plays || 0,
                visitors: video.stats?.visitors || 0,
                averagePercentWatched: video.stats?.averagePercentWatched || 0
            }
        }));
    } catch (error: any) {
        const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Wistia List Error:', errorMsg);

        // Log to file for debugging
        fs.appendFileSync('wistia-error.log', `${new Date().toISOString()} - List Error: ${errorMsg}\n`);

        return []; // Return empty array instead of throwing to prevent frontend crash
    }
};

// Get single video details from Wistia
export const getWistiaVideo = async (hashedId: string): Promise<WistiaVideo | null> => {
    try {
        const token = process.env.WISTIA_ACCESS_TOKEN;
        if (!token) {
            throw new Error('WISTIA_ACCESS_TOKEN is not configured');
        }

        const response = await axios.get(`${WISTIA_DATA_API_URL}/medias/${hashedId}.json`, {
            params: { access_token: token },
        });

        return response.data;
    } catch (error: any) {
        console.error('Wistia Get Video Error:', error.message);
        return null;
    }
};

// Delete video from Wistia
export const deleteWistiaVideo = async (hashedId: string): Promise<boolean> => {
    try {
        const token = process.env.WISTIA_ACCESS_TOKEN;
        if (!token) {
            throw new Error('WISTIA_ACCESS_TOKEN is not configured');
        }

        await axios.delete(`${WISTIA_DATA_API_URL}/medias/${hashedId}.json`, {
            params: { access_token: token },
        });

        console.log('Video deleted from Wistia:', hashedId);
        return true;
    } catch (error: any) {
        const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Wistia Delete Error:', errorMsg);
        fs.appendFileSync('wistia-error.log', `${new Date().toISOString()} - Delete Error: ${errorMsg}\n`);
        return false;
    }
};

// Update video in Wistia (name, description)
export const updateWistiaVideo = async (hashedId: string, updates: { name?: string; description?: string }): Promise<WistiaVideo | null> => {
    try {
        const token = process.env.WISTIA_ACCESS_TOKEN;
        if (!token) {
            throw new Error('WISTIA_ACCESS_TOKEN is not configured');
        }

        const response = await axios.put(
            `${WISTIA_DATA_API_URL}/medias/${hashedId}.json`,
            null,
            {
                params: {
                    access_token: token,
                    ...updates
                },
            }
        );

        console.log('Video updated in Wistia:', hashedId);
        return response.data;
    } catch (error: any) {
        const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Wistia Update Error:', errorMsg);
        return null;
    }
};

// Get Wistia account stats
export const getWistiaStats = async (): Promise<any> => {
    try {
        const token = process.env.WISTIA_ACCESS_TOKEN;
        if (!token) {
            throw new Error('WISTIA_ACCESS_TOKEN is not configured');
        }

        const response = await axios.get(`${WISTIA_DATA_API_URL}/stats/account.json`, {
            params: { access_token: token },
        });

        return response.data;
    } catch (error: any) {
        console.error('Wistia Stats Error:', error.message);
        return null;
    }
};
