
import { Video, MoreVertical, Share2, Trash2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const videos = [
    {
        id: 1,
        title: 'Product Demo Walkthrough',
        thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=60',
        duration: '02:14',
        views: 124,
        createdAt: '2 hours ago',
        author: 'John Doe'
    },
    {
        id: 2,
        title: 'Q4 Marketing Strategy',
        thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=60',
        duration: '05:32',
        views: 89,
        createdAt: '1 day ago',
        author: 'John Doe'
    },
    {
        id: 3,
        title: 'Bug Report - Login Issue',
        thumbnail: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&auto=format&fit=crop&q=60',
        duration: '01:05',
        views: 45,
        createdAt: '2 days ago',
        author: 'John Doe'
    },
    {
        id: 4,
        title: 'Team Standup Recording',
        thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60',
        duration: '15:20',
        views: 236,
        createdAt: '3 days ago',
        author: 'John Doe'
    },
    {
        id: 5,
        title: 'Client Feedback Review',
        thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=60',
        duration: '08:45',
        views: 67,
        createdAt: '4 days ago',
        author: 'John Doe'
    }
];

export default function Home() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, John 👋</h1>
                    <p className="mt-1 text-zinc-400 font-medium">Here's what happened while you were away.</p>
                </div>
                <div className="hidden sm:block">
                    <button className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">
                        View all activity
                    </button>
                </div>
            </div>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Video className="h-5 w-5 text-purple-400" />
                        Recent Videos
                    </h2>
                    <div className="flex gap-2">
                        <select className="bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500/50">
                            <option>All Videos</option>
                            <option>My Recordings</option>
                            <option>Shared with me</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map((video, index) => (
                        <div
                            key={video.id}
                            className="group relative bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:bg-zinc-900/60 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 opacity-0 animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <Link to={`/video/${video.id}`} className="block relative aspect-video overflow-hidden">
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

                                {/* Duration Badge */}
                                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-md rounded-md text-xs font-semibold text-white">
                                    {video.duration}
                                </div>

                                {/* Play Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white shadow-xl">
                                        <Play className="h-5 w-5 fill-white ml-0.5" />
                                    </div>
                                </div>
                            </Link>

                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <Link to={`/video/${video.id}`} className="block">
                                            <h3 className="text-base font-semibold text-zinc-100 truncate group-hover:text-purple-400 transition-colors">
                                                {video.title}
                                            </h3>
                                        </Link>
                                        <div className="mt-1 flex items-center text-xs text-zinc-500">
                                            <span className="font-medium text-zinc-400">{video.createdAt}</span>
                                            <span className="mx-1.5">•</span>
                                            <span>{video.views} views</span>
                                        </div>
                                    </div>
                                    <button className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Actions that appear on hover */}
                                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-y-2 group-hover:translate-y-0">
                                    <button className="flex-1 flex items-center justify-center gap-2 text-xs font-medium py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors">
                                        <Share2 className="h-3 w-3" />
                                        Share
                                    </button>
                                    <button className="flex items-center justify-center p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* New Video Placeholder */}
                    <Link
                        to="/record"
                        className="group relative bg-zinc-900/20 border border-white/5 border-dashed rounded-2xl overflow-hidden hover:border-purple-500/50 hover:bg-purple-900/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[250px] gap-3 opacity-0 animate-fade-in-up"
                        style={{ animationDelay: `${videos.length * 100}ms` }}
                    >
                        <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-purple-600 group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg">
                            <Video className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                        </div>
                        <span className="font-medium text-zinc-400 group-hover:text-purple-300 transition-colors">Record New Video</span>
                    </Link>

                </div>
            </section>
        </div>
    );
}
