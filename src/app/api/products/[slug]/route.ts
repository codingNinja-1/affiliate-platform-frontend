import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/products/${encodeURIComponent(params.slug)}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    console.error('Product detail proxy error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
