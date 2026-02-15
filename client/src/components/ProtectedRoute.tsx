import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login, but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
