import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const qs = url.search ? url.search : '';

    const res = await fetch(`${BACKEND_BASE}/api/payment/callback${qs}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    // Backend redirects to frontend success/failed - follow redirects or return as-is
    if (res.redirected || res.status >= 300 && res.status < 400) {
      return NextResponse.redirect(res.url);
    }

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    console.error('Payment callback proxy error:', error);
    return NextResponse.redirect(new URL('/purchase/failed?error=server_error', req.url));
  }
}
