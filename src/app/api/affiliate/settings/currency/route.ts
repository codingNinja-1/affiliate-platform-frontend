import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const body = await req.json();

    const res = await fetch(`${BACKEND_BASE}/api/affiliate/settings/currency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json().catch(async () => {
      const text = await res.text().catch(() => '');
      return { success: res.ok, message: text };
    });

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Currency update proxy error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
