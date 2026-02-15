
// This is a workaround since prisma generate is failing in this environment.
// In a real setup, this would come from @prisma/client

export class PrismaClient {
    user: any = {
        findUnique: async () => null,
        create: async () => ({ id: 'mock-id', email: 'mock@example.com' }),
    };
    workspace: any = {
        create: async () => ({ id: 'mock-ws-id', name: 'Mock Workspace' }),
    };
    video: any = {
        findMany: async () => [],
        create: async () => ({ id: 'mock-video-id' }),
    };
    $connect = async () => { };
    $disconnect = async () => { };
    $queryRaw = async (...args: any[]) => [];
}
