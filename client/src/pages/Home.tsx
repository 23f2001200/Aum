import { useState, useEffect } from 'react';
import { Video, MoreVertical, Share2, Trash2, Play, Loader2, RefreshCw, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

interface VideoItem {
    id: string;
    wistiaId: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    duration: number;
    views: number;
    visitors?: number;
    createdAt: string;
    updatedAt?: string;
    status?: string;
    type?: string;
}

function formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function Home() {
    const { user, getAccessToken } = useAuth();
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_URL}/videos`);
            if (!response.ok) throw new Error('Failed to fetch videos');
            const data = await response.json();
            setVideos(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to fetch videos', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleDelete = async (wistiaId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            alert('Please sign in to delete videos');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this video? This cannot be undone.')) {
            return;
        }

        try {
            setDeleting(wistiaId);
            setMenuOpen(null);
            
            const token = await getAccessToken();
            const response = await fetch(`${API_URL}/wistia/videos/${wistiaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete video');
            }

            // Remove from local state
            setVideos(videos.filter(v => v.wistiaId !== wistiaId));
        } catch (err: any) {
            console.error('Delete error:', err);
            alert('Failed to delete video: ' + err.message);
        } finally {
            setDeleting(null);
        }
    };

    const copyShareLink = (videoId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/aum/${videoId}`;
        navigator.clipboard.writeText(shareUrl);
        setMenuOpen(null);
        alert('Share link copied!');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="text-zinc-400">Loading videos from Wistia...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={fetchVideos}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Video Library</h1>
                    <p className="mt-1 text-zinc-400 font-medium">
                        {videos.length} video{videos.length !== 1 ? 's' : ''} in your Wistia account
                    </p>
                </div>
                <button
                    onClick={fetchVideos}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-300 hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Video className="h-5 w-5 text-purple-400" />
                        All Videos
                    </h2>
                </div>

                {videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                            <Video className="h-8 w-8 text-zinc-500" />
                        </div>
                        <p className="text-zinc-400">No videos yet. Record your first video!</p>
                        <Link
                            to="/record"
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Start Recording
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {videos.map((video, index) => (
                            <div
                                key={video.id}
                                className={`group relative bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:bg-zinc-900/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 ${
                                    deleting === video.wistiaId ? 'opacity-50 pointer-events-none' : ''
                                }`}
                                style={{ animation: `fadeInUp 0.3s ease-out ${index * 50}ms both` }}
                            >
                                <Link to={`/aum/${video.wistiaId}`} className="block relative aspect-video overflow-hidden">
                                    {video.thumbnailUrl ? (
                                        <img
                                            src={video.thumbnailUrl}
                                            alt={video.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                            <Video className="h-12 w-12 text-zinc-600" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

                                    {/* Duration Badge */}
                                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-md rounded-md text-xs font-semibold text-white">
                                        {formatDuration(video.duration)}
                                    </div>

                                    {/* Status Badge */}
                                    {video.status && video.status !== 'ready' && (
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-500/80 backdrop-blur-md rounded-md text-xs font-semibold text-black">
                                            {video.status}
                                        </div>
                                    )}

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white shadow-xl">
                                            <Play className="h-5 w-5 fill-white ml-0.5" />
                                        </div>
                                    </div>

                                    {/* Deleting Overlay */}
                                    {deleting === video.wistiaId && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                                        </div>
                                    )}
                                </Link>

                                <div className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0 pr-3">
                                            <Link to={`/aum/${video.wistiaId}`} className="block">
                                                <h3 className="text-base font-semibold text-zinc-100 truncate group-hover:text-purple-400 transition-colors">
                                                    {video.title}
                                                </h3>
                                            </Link>
                                            <div className="mt-1 flex items-center text-xs text-zinc-500">
                                                <span className="font-medium text-zinc-400">{formatTimeAgo(video.createdAt)}</span>
                                                <span className="mx-1.5">•</span>
                                                <span>{video.views} plays</span>
                                            </div>
                                        </div>
                                        
                                        {/* Dropdown Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setMenuOpen(menuOpen === video.id ? null : video.id);
                                                }}
                                                className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                            
                                            {menuOpen === video.id && (
                                                <div className="absolute right-0 top-8 z-50 bg-zinc-800 border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px]">
                                                    <button
                                                        onClick={(e) => copyShareLink(video.wistiaId, e)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
                                                    >
                                                        <Share2 className="h-4 w-4" />
                                                        Copy Link
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(video.wistiaId, e)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Actions on Hover */}
                                    <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={(e) => copyShareLink(video.wistiaId, e)}
                                            className="flex-1 flex items-center justify-center gap-2 text-xs font-medium py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                                        >
                                            <Share2 className="h-3 w-3" />
                                            Share
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(video.wistiaId, e)}
                                            className="flex items-center justify-center p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* New Video Placeholder */}
                        <Link
                            to="/record"
                            className="group relative bg-zinc-900/20 border border-white/5 border-dashed rounded-2xl overflow-hidden hover:border-purple-500/50 hover:bg-purple-900/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] gap-3"
                        >
                            <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-purple-600 group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg">
                                <Video className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                            </div>
                            <span className="font-medium text-zinc-400 group-hover:text-purple-300 transition-colors">Record New Video</span>
                        </Link>
                    </div>
                )}
            </section>

            {/* Click outside to close menu */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(null)}
                />
            )}

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
