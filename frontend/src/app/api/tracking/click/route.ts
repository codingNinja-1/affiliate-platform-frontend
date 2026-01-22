import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliate_id, product_id } = body;

    if (!affiliate_id || !product_id) {
      return NextResponse.json(
        { error: 'Missing affiliate_id or product_id' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_BASE}/api/tracking/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        affiliate_id,
        product_id,
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(async () => {
      const text = await response.text().catch(() => '');
      return { message: text, success: response.ok };
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to track click' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
