
import { Request, Response } from 'express';
import { PrismaClient } from '../mockPrisma';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        // Note: Password should be hashed in production
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: password, // TODO: Hash this
                name,
            },
        });

        // Create default workspace
        const workspace = await prisma.workspace.create({
            data: {
                name: `${name}'s Workspace`,
                ownerId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: 'OWNER',
                    },
                },
            },
        });

        res.status(201).json({ user, workspace });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || user.passwordHash !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // TODO: Generate JWT
        const token = 'mock-jwt-token';

        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
};
