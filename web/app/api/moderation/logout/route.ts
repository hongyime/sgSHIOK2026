import { handleModeratorLogout } from '../session';
import { moderationMethodNotAllowed } from '../http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

export async function POST(request: Request): Promise<Response> { return handleModeratorLogout(request); }
export const GET = moderationMethodNotAllowed;
export const HEAD = moderationMethodNotAllowed;
export const OPTIONS = moderationMethodNotAllowed;
export const PUT = moderationMethodNotAllowed;
export const PATCH = moderationMethodNotAllowed;
export const DELETE = moderationMethodNotAllowed;
