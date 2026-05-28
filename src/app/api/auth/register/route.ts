import type { NextRequest } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Proxy error', error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({ 
      message: 'Method Not Allowed',
      error: 'POST method is required for registration'
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
