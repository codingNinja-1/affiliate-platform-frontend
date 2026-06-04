import type { NextRequest } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const res = await fetch(`${BACKEND_BASE}/api/vendor/products`, {
      headers: { Authorization: auth, Accept: 'application/json' },
    });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Proxy error', error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const contentType = req.headers.get('content-type') || '';
    let body: BodyInit;
    let headers: Record<string, string> = { Authorization: auth, Accept: 'application/json' };

    if (contentType.includes('multipart/form-data')) {
      body = await req.formData();
    } else {
      body = await req.text();
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${BACKEND_BASE}/api/vendor/products`, {
      method: 'POST',
      headers,
      body,
    });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Proxy error', error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
