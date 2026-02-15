
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Video, Home, Settings, Search, Plus } from 'lucide-react';

export default function Layout() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-gray-50">
                    <Link to="/" className="flex items-center gap-2">
                        {/* Logo */}
                        <img
                            src="/Aum.png"
                            alt="Aum"
                            className="h-8 w-8 object-contain"
                            onError={(e) => {
                                // Fallback if image fails
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        <span className="hidden text-xl font-bold tracking-tight text-gray-900">Aum</span>
                    </Link>
                </div>

                <div className="flex-1 py-6 px-3 space-y-1">
                    <Link
                        to="/"
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/')
                            ? 'bg-orange-50 text-orange-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Home className="h-5 w-5 mr-3" />
                        Home
                    </Link>
                    <Link
                        to="/library"
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/library')
                            ? 'bg-orange-50 text-orange-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Video className="h-5 w-5 mr-3" />
                        My Library
                    </Link>
                    <Link
                        to="/settings"
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/settings')
                            ? 'bg-orange-50 text-orange-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Settings className="h-5 w-5 mr-3" />
                        Settings
                    </Link>
                </div>

                <div className="p-4 border-t border-gray-50">
                    <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <LogOut className="h-5 w-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sm:px-8">
                    <div className="flex-1 max-w-lg">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search videos..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                        <Link
                            to="/record"
                            className="hidden sm:flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-black shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Video
                        </Link>

                        <button className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold ring-2 ring-white shadow-sm">
                            <span className="text-sm">JD</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-6 sm:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
