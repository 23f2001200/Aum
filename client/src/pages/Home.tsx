
import React, { useEffect, useState } from 'react';
import { Video, Play, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VideoItem {
    id: string; // custom_slug or wistia_hashed_id
    wistiaId?: string;
    title: string;
    createdAt: string;
    thumbnailUrl?: string;
    duration?: number;
    views?: number;
    customSlug?: string;
}

export default function Home() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3003'}/videos`)
            .then(res => res.json())
            .then(data => {
                setVideos(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch videos', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="bg-orange-50 p-4 rounded-full mb-4">
                    <Video className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos yet</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                    Record your first video to share your ideas with the world.
                </p>
                <Link
                    to="/record"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-black transition-all"
                >
                    Start Recording
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Library</h1>
                    <p className="text-sm text-gray-500 mt-1">{videos.length} videos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                    <Link
                        to={`/aum/${video.customSlug || video.id}`}
                        key={video.id}
                        className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-orange-200"
                    >
                        {/* Thumbnail */}
                        <div className="aspect-video bg-gray-100 relative overflow-hidden group-hover:bg-gray-50">
                            {video.thumbnailUrl ? (
                                <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Video className="h-8 w-8 text-gray-300" />
                                </div>
                            )}

                            {/* Duration Badge */}
                            {video.duration && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                                    {formatDuration(video.duration)}
                                </div>
                            )}

                            {/* Play Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                                <div className="bg-white/90 rounded-full p-3 shadow-sm transform scale-90 group-hover:scale-100 transition-transform">
                                    <Play className="h-5 w-5 text-orange-600 fill-orange-600 ml-0.5" />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                {video.title}
                            </h3>
                            <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(video.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                                {video.views !== undefined && (
                                    <span>{video.views} views</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
