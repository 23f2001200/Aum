import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase';

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role?: string;
            };
        }
    }
}

/**
 * Middleware to verify Supabase JWT token
 * Extracts user info and attaches to request
 */
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Unauthorized', 
                message: 'No token provided' 
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ 
                error: 'Unauthorized', 
                message: 'Invalid or expired token' 
            });
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email || '',
            role: user.role
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Authentication failed' 
        });
    }
};

/**
 * Optional auth middleware - doesn't require auth but attaches user if present
 */
export const optionalAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user } } = await supabase.auth.getUser(token);

            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email || '',
                    role: user.role
                };
            }
        }

        next();
    } catch (error) {
        // Don't fail on optional auth, just continue without user
        next();
    }
};

export default authMiddleware;
