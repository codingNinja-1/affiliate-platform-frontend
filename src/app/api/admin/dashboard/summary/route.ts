import { NextRequest } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    
    const res = await fetch(`${BACKEND_BASE}/api/admin/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: 'Proxy error', error: String(err) }),
      { status: 500 }
    );
  }
}
