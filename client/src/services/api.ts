
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

export const uploadVideo = async (blob: Blob, filename: string) => {
    // 1. Get presigned URL (mocked) or just upload directly to our mock endpoint
    // In real app: const { uploadUrl } = await fetch('/api/upload/initiate')...

    // For MVP mock: Direct PUT to server
    const response = await fetch(`${API_URL}/uploads/${filename}`, {
        method: 'PUT',
        body: blob,
        headers: {
            'Content-Type': 'video/webm'
        }
    });

    if (!response.ok) {
        throw new Error('Upload failed');
    }

    return response;
};
