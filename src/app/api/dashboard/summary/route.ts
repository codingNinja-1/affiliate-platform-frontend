import { NextRequest } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    const userType = req.nextUrl.searchParams.get('user_type') ?? 'vendor';
    const currency = req.nextUrl.searchParams.get('currency') ?? '';
    const qs = currency ? `?currency=${encodeURIComponent(currency)}` : '';

    // Route to the correct backend endpoint based on user type
    let endpoint: string;
    if (userType === 'affiliate') {
      endpoint = `${BACKEND_BASE}/api/affiliate/converted-amounts${qs}`;
    } else {
      endpoint = `${BACKEND_BASE}/api/vendor/dashboard/summary${qs}`;
    }

    const res = await fetch(endpoint, {
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
