
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Video, Home, Settings, Search, Plus, Menu } from 'lucide-react';

export default function Layout() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-20 lg:w-64 glass border-r-0 z-20 flex flex-col hidden md:flex transition-all duration-300">
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                            <img
                                src="/Aum.png"
                                alt="Aum"
                                className="relative h-10 w-10 object-contain drop-shadow-lg"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="hidden h-10 w-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl items-center justify-center text-white font-bold">
                                A
                            </div>
                        </div>
                        <span className="hidden lg:block text-2xl font-bold tracking-tight text-white">
                            Aum
                        </span>
                    </Link>
                </div>

                <div className="flex-1 py-8 px-3 space-y-2">
                    <NavLink to="/" icon={<Home className="h-5 w-5" />} label="Home" active={isActive('/')} />
                    <NavLink to="/library" icon={<Video className="h-5 w-5" />} label="My Library" active={isActive('/library')} />
                    <NavLink to="/settings" icon={<Settings className="h-5 w-5" />} label="Settings" active={isActive('/settings')} />
                </div>

                <div className="p-4 border-t border-white/5">
                    <button className="flex items-center lg:w-full justify-center lg:justify-start px-3 py-3 text-sm font-medium text-zinc-400 rounded-xl hover:bg-white/5 hover:text-white transition-all duration-200 group">
                        <LogOut className="h-5 w-5 lg:mr-3 group-hover:text-pink-500 transition-colors" />
                        <span className="hidden lg:block">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-900/10 rounded-full blur-[120px]"></div>
                </div>

                {/* Header */}
                <header className="h-20 glass border-b-0 flex items-center justify-between px-6 sm:px-8 z-10">
                    <div className="flex items-center md:hidden">
                        <button className="text-zinc-400 hover:text-white">
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 max-w-xl mx-4 md:mx-0">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search videos..."
                                className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-full leading-5 bg-zinc-900/50 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:bg-zinc-900 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 sm:text-sm transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                        <Link
                            to="/record"
                            className="hidden sm:flex items-center px-5 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Video
                        </Link>

                        <button className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center text-zinc-300 font-semibold ring-2 ring-transparent hover:ring-purple-500/50 transition-all shadow-md">
                            <span className="text-sm">JD</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 sm:p-8 z-10 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

function NavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Link
            to={to}
            className={`flex items-center lg:w-full justify-center lg:justify-start px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${active
                ? 'bg-white/10 text-white shadow-lg shadow-purple-900/10'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <span className={`relative z-10 ${active ? 'text-purple-400' : 'group-hover:text-purple-400 transition-colors'}`}>
                {icon}
            </span>
            <span className="hidden lg:block ml-3 relative z-10">{label}</span>
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full"></div>
            )}
        </Link>
    );
}

