import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://snow-mantis-616662.hostingersite.com';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imagePath = searchParams.get('path');

    if (!imagePath) {
      return NextResponse.json({ error: 'Missing image path' }, { status: 400 });
    }

    // Build the full image URL
    let imageUrl = imagePath;
    if (!imagePath.startsWith('http')) {
      imageUrl = `${BACKEND_BASE}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    }

    // Fetch the image from the backend
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'AffiliateHub/1.0',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${res.status}` },
        { status: res.status }
      );
    }

    // Get the content type from the response
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    // Stream the image with proper headers
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
