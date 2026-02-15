
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

export const uploadToWistia = async (filePath: string, customSlug?: string): Promise<WistiaUploadResult> => {
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

        // Save to Supabase database
        const dbVideo = await createVideo({
            wistiaHashedId: wistiaData.hashed_id,
            title: wistiaData.name || 'Untitled Video',
            thumbnailUrl: wistiaData.thumbnail?.url,
            duration: Math.round(wistiaData.duration || 0),
            wistiaMetadata: wistiaData,
            customSlug: customSlug
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

export const listWistiaVideos = async (): Promise<any[]> => {
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

        // Map Wistia response to our app's video format
        return response.data.map((video: any) => ({
            id: video.hashed_id,
            title: video.name,
            thumbnailUrl: video.thumbnail.url,
            createdAt: video.created,
            duration: video.duration,
            views: video.stats?.plays || 0
        }));
    } catch (error: any) {
        const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error('Wistia List Error:', errorMsg);

        // Log to file for debugging
        fs.appendFileSync('wistia-error.log', `${new Date().toISOString()} - List Error: ${errorMsg}\n`);

        return []; // Return empty array instead of throwing to prevent frontend crash
    }
};
