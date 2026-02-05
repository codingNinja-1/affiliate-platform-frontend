import { NextRequest } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const backendUrl = `${BACKEND_BASE}${pathname}${search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  let body: BodyInit | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const text = await req.text();
    body = text.length ? text : undefined;
  }

  const res = await fetch(backendUrl, {
    method: req.method,
    headers,
    body,
    cache: 'no-store',
    redirect: 'manual',
  });

  const resBody = await res.arrayBuffer();
  const resHeaders = new Headers(res.headers);

  return new Response(resBody, {
    status: res.status,
    headers: resHeaders,
  });
}

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function POST(req: NextRequest) {
  return proxy(req);
}

export async function PUT(req: NextRequest) {
  return proxy(req);
}

export async function PATCH(req: NextRequest) {
  return proxy(req);
}

export async function DELETE(req: NextRequest) {
  return proxy(req);
}

export async function OPTIONS(req: NextRequest) {
  return proxy(req);
}
