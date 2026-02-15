
import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Send, Share2, MoreHorizontal, MessageSquare, ThumbsUp, Copy, Check, Loader2, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

interface VideoData {
    id: string;
    wistiaId: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: number;
    views: number;
    customSlug?: string;
    createdAt: string;
    embedUrl?: string;
}

interface Comment {
    id: string;
    text: string;
    timestamp_seconds?: number;
    created_at: string;
    author_id?: string;
}

export default function VideoPlayer() {
    const { id } = useParams<{ id: string }>();
    const { user, loading: authLoading } = useAuth();
    const [video, setVideo] = useState<VideoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [copied, setCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    // Redirect to login if not authenticated
    if (!authLoading && !user) {
        return <Navigate to="/login" replace />;
    }

    // Fetch video data
    useEffect(() => {
        if (!id) return;

        const fetchVideo = async () => {
            try {
                setLoading(true);
                setError(null);

                // Try fetching by Wistia ID first (most reliable), then by slug
                let response = await fetch(`${API_URL}/videos/wistia/${id}`);

                if (!response.ok) {
                    // Fallback to slug
                    response = await fetch(`${API_URL}/videos/slug/${id}`);
                }

                if (!response.ok) {
                    // Last resort: create a minimal video object for direct Wistia playback
                    setVideo({
                        id: id,
                        wistiaId: id,
                        title: 'Video',
                        views: 0,
                        createdAt: new Date().toISOString(),
                        embedUrl: `//fast.wistia.net/embed/iframe/${id}`
                    });
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setVideo({
                    ...data,
                    wistiaId: data.wistiaId || id
                });

                // Fetch comments if we have a video ID (optional, may fail)
                if (data.id) {
                    try {
                        const commentsRes = await fetch(`${API_URL}/videos/${data.id}/comments`);
                        if (commentsRes.ok) {
                            const commentsData = await commentsRes.json();
                            setComments(commentsData);
                        }
                    } catch (e) {
                        // Comments are optional, don't fail the page
                        console.log('Could not fetch comments');
                    }
                }
            } catch (err: any) {
                console.error('Error fetching video:', err);
                // Still try to play the video directly via Wistia
                setVideo({
                    id: id,
                    wistiaId: id,
                    title: 'Video',
                    views: 0,
                    createdAt: new Date().toISOString(),
                    embedUrl: `//fast.wistia.net/embed/iframe/${id}`
                });
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [id]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !video?.id) return;

        try {
            const response = await fetch(`${API_URL}/videos/${video.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: comment })
            });

            if (response.ok) {
                const newComment = await response.json();
                setComments([...comments, newComment]);
                setComment('');
            }
        } catch (err) {
            console.error('Error posting comment:', err);
        }
    };

    const copyShareLink = () => {
        const shareUrl = `${APP_URL}/aum/${video?.customSlug || video?.wistiaId}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} mins ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-red-400 mb-4 text-lg">{error || 'Video not found'}</p>
                <Link to="/" className="text-purple-400 hover:text-purple-300 hover:underline">Back to Library</Link>
            </div>
        );
    }

    const wistiaId = video.wistiaId;

    return (
        <div className="min-h-full pb-12">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Link */}
                <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white mb-8 transition-colors group">
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Library
                </Link>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Video Player Container */}
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative ring-1 ring-white/10 group">
                            <iframe
                                src={`//fast.wistia.net/embed/iframe/${wistiaId}?videoFoam=true&autoPlay=true`}
                                title="Wistia Video Player"
                                allow="autoplay; fullscreen"
                                allowTransparency={true}
                                frameBorder="0"
                                scrolling="no"
                                className="w-full h-full absolute inset-0"
                                name="wistia_embed"
                            ></iframe>
                            <script src="//fast.wistia.net/assets/external/E-v1.js" async></script>
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
                        </div>

                        {/* Title & Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{video.title}</h1>
                                <div className="flex items-center mt-3 space-x-4 text-sm text-zinc-400">
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                                        {formatDate(video.createdAt)}
                                    </span>
                                    <span>•</span>
                                    <span>Duration: {formatDuration(video.duration)}</span>
                                    <span>•</span>
                                    <span>{video.views} views</span>
                                </div>
                            </div>
                            <div className="flex space-x-3 relative">
                                <button
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    className="inline-flex items-center px-4 py-2.5 border border-white/10 shadow-lg shadow-purple-900/10 text-sm font-medium rounded-xl text-white bg-white/5 hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                </button>

                                {/* Share Menu */}
                                {showShareMenu && (
                                    <div className="absolute right-0 top-14 glass text-zinc-100 rounded-xl p-4 z-50 w-80 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-sm font-medium text-white">Share this video</p>
                                            <button onClick={() => setShowShareMenu(false)} className="text-zinc-500 hover:text-white">
                                                <span className="sr-only">Close</span>
                                                &times;
                                            </button>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={`${window.location.origin}/aum/${video.customSlug || video.wistiaId}`}
                                                className="flex-1 text-sm bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                            />
                                            <button
                                                onClick={copyShareLink}
                                                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/20"
                                            >
                                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {copied && <p className="text-xs text-green-400 mt-2 font-medium">Link copied to clipboard!</p>}
                                    </div>
                                )}

                                <button className="p-2.5 border border-white/10 shadow-lg rounded-xl text-zinc-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {video.description && (
                            <div className="glass p-6 rounded-2xl">
                                <p className="text-zinc-300 leading-relaxed">{video.description}</p>
                            </div>
                        )}

                        <div className="border-t border-white/5 pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold ring-4 ring-zinc-900 shadow-xl">
                                    U
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-white">Video Owner</p>
                                    <p className="text-xs text-zinc-500 font-medium">Uploaded {formatTimeAgo(video.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Comments Column */}
                    <div className="xl:col-span-1">
                        <div className="glass rounded-2xl flex flex-col h-[600px] overflow-hidden">
                            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center backdrop-blur-md">
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                                        <MessageSquare className="h-4 w-4" />
                                    </div>
                                    Comments ({comments.length})
                                </h2>
                            </div>

                            <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
                                {comments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
                                        <MessageSquare className="h-8 w-8 opacity-20" />
                                        <p className="text-sm text-center">No comments yet.<br />Be the first to share your thoughts!</p>
                                    </div>
                                ) : (
                                    comments.map(c => (
                                        <div key={c.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-bold border border-white/5">
                                                        A
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-white">Anonymous</span>
                                                        <span className="text-[10px] text-zinc-500">{formatTimeAgo(c.created_at)}</span>
                                                    </div>
                                                    <div className="p-3 rounded-2xl rounded-tl-none bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                        <p className="text-sm text-zinc-300 leading-relaxed">{c.text}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-1 px-1">
                                                        {c.timestamp_seconds && (
                                                            <button className="flex items-center text-[10px] font-medium text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                                                <Play className="h-2 w-2 mr-1 fill-current" />
                                                                {formatDuration(c.timestamp_seconds)}
                                                            </button>
                                                        )}
                                                        <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="text-xs text-zinc-500 hover:text-white flex items-center transition-colors">
                                                                <ThumbsUp className="h-3 w-3 mr-1" />
                                                                Like
                                                            </button>
                                                            <button className="text-xs text-zinc-500 hover:text-white transition-colors">Reply</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-white/5 border-t border-white/5 backdrop-blur-md">
                                <form onSubmit={handleCommentSubmit} className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        className="w-full pl-4 pr-12 py-3.5 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:bg-zinc-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!comment.trim()}
                                        className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 shadow-lg shadow-purple-900/20 scale-90 hover:scale-100"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


