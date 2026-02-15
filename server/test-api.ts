
import axios from 'axios';

const test = async () => {
    try {
        console.log('Testing /health...');
        const health = await axios.get('http://localhost:3003/health');
        console.log('Health:', health.data);
    } catch (e: any) {
        console.error('Health failed:', e.message);
    }

    try {
        console.log('Testing /videos...');
        const videos = await axios.get('http://localhost:3003/videos');
        console.log('Videos Status:', videos.status);
        console.log('Videos Data:', videos.data);
    } catch (e: any) {
        console.error('Videos failed:', e.message, e.response?.status, e.response?.data);
    }
};

test();
