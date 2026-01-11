import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const url = new URL(req.url);
    const qs = url.search ? url.search : '';

    const res = await fetch(`${BACKEND_BASE}/api/affiliate/withdrawals${qs}`, {
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
    console.error('Affiliate withdrawals proxy error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const body = await req.json().catch(() => ({}));

    const res = await fetch(`${BACKEND_BASE}/api/affiliate/withdrawals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(async () => {
      const text = await res.text().catch(() => '');
      return { success: res.ok, message: text };
    });

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Create withdrawal proxy error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
