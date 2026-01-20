import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const url = new URL(req.url);
    const qs = url.search ? url.search : '';

    const res = await fetch(`${BACKEND_BASE}/api/affiliate/products${qs}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(async () => {
      const text = await res.text().catch(() => '');
      return { success: res.ok, message: text };
    });

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Affiliate products proxy error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
