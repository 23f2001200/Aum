
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Send, Share2, MoreHorizontal, MessageSquare, ThumbsUp, Copy, Check, Loader2 } from 'lucide-react';

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
    const [video, setVideo] = useState<VideoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [copied, setCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    // Fetch video data
    useEffect(() => {
        if (!id) return;

        const fetchVideo = async () => {
            try {
                setLoading(true);
                
                // Try fetching by slug first, then by wistia ID
                let response = await fetch(`${API_URL}/videos/slug/${id}`);
                
                if (!response.ok) {
                    // Fallback to wistia ID
                    response = await fetch(`${API_URL}/videos/wistia/${id}`);
                }
                
                if (!response.ok) {
                    throw new Error('Video not found');
                }
                
                const data = await response.json();
                setVideo(data);
                
                // Fetch comments if we have a video ID
                if (data.id) {
                    const commentsRes = await fetch(`${API_URL}/videos/${data.id}/comments`);
                    if (commentsRes.ok) {
                        const commentsData = await commentsRes.json();
                        setComments(commentsData);
                    }
                }
            } catch (err: any) {
                console.error('Error fetching video:', err);
                setError(err.message);
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
            <div className="flex items-center justify-center h-screen bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <p className="text-red-500 mb-4">{error || 'Video not found'}</p>
                <Link to="/" className="text-orange-500 hover:underline">Back to Library</Link>
            </div>
        );
    }

    const wistiaId = video.wistiaId;

    return (
        <div className="bg-white min-h-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Link */}
                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors group">
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Library
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Player Container */}
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative ring-1 ring-gray-900/5">
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
                        </div>

                        {/* Title & Actions */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{video.title}</h1>
                                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                                    <span>{formatDate(video.createdAt)}</span>
                                    <span>•</span>
                                    <span>Duration: {formatDuration(video.duration)}</span>
                                    <span>•</span>
                                    <span>{video.views} views</span>
                                </div>
                            </div>
                            <div className="flex space-x-3 relative">
                                <button 
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                </button>
                                
                                {/* Share Menu */}
                                {showShareMenu && (
                                    <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Share this video</p>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={`${window.location.origin}/aum/${video.customSlug || video.wistiaId}`}
                                                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2"
                                            />
                                            <button
                                                onClick={copyShareLink}
                                                className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                                            >
                                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {copied && <p className="text-xs text-green-600 mt-2">Link copied!</p>}
                                    </div>
                                )}
                                
                                <button className="p-2 border border-gray-200 shadow-sm rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {video.description && (
                            <p className="text-gray-600">{video.description}</p>
                        )}

                        <div className="border-t border-gray-100 pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold ring-2 ring-white">
                                    U
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Video Owner</p>
                                    <p className="text-xs text-gray-500">Uploaded {formatTimeAgo(video.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Comments Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 rounded-xl border border-gray-100 flex flex-col h-[600px]">
                            <div className="p-4 border-b border-gray-100 bg-white rounded-t-xl flex justify-between items-center">
                                <h2 className="text-sm font-bold text-gray-900 flex items-center">
                                    <MessageSquare className="h-4 w-4 mr-2 text-orange-500" />
                                    Comments ({comments.length})
                                </h2>
                            </div>

                            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                                {comments.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-8">No comments yet. Be the first!</p>
                                ) : (
                                    comments.map(c => (
                                        <div key={c.id} className="group">
                                            <div className="flex space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-600 font-bold">
                                                        A
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-gray-900">Anonymous</span>
                                                        <span className="text-[10px] text-gray-400">{formatTimeAgo(c.created_at)}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{c.text}</p>
                                                    {c.timestamp_seconds && (
                                                        <span className="text-xs text-orange-500 mt-1">@ {formatDuration(c.timestamp_seconds)}</span>
                                                    )}
                                                    <div className="mt-2 flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center">
                                                            <ThumbsUp className="h-3 w-3 mr-1" />
                                                            Like
                                                        </button>
                                                        <button className="text-xs text-gray-400 hover:text-gray-600">Reply</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-white border-t border-gray-100 rounded-b-xl">
                                <form onSubmit={handleCommentSubmit} className="relative">
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border-transparent rounded-lg text-sm focus:bg-white focus:border-orange-500 focus:ring-orange-500 transition-all"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!comment.trim()}
                                        className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-orange-500 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
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
