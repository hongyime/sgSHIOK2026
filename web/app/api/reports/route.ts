import { handleReportPost, reportMethodNotAllowed } from './http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function POST(request: Request): Promise<Response> {
  return handleReportPost(request);
}

export const GET = reportMethodNotAllowed;
export const HEAD = reportMethodNotAllowed;
export const OPTIONS = reportMethodNotAllowed;
export const PUT = reportMethodNotAllowed;
export const PATCH = reportMethodNotAllowed;
export const DELETE = reportMethodNotAllowed;
