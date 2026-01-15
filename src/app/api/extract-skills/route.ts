import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body.text || '';

    // Proxy to Python backend
    console.log('[extract-skills] proxying to python backend, length=', text.length);
    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000/extract';
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    // Log response status for easier debugging
    console.log(`[extract-skills] python backend responded: ${res.status}`);

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[extract-skills] backend error body:', errBody);
      return NextResponse.json({ error: 'Python backend error', details: errBody }, { status: 502 });
    }

    const data = await res.json();
    console.log('[extract-skills] extracted skills:', data.skills);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error in /api/extract-skills:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
