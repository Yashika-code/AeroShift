import { NextResponse } from 'next/server';

const apiUrl = process.env.AEROSHIFT_API_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!apiUrl) {
      // Demo fallback
      const { fastest, balanced } = body;
      const timeDiff = balanced.duration_min - fastest.duration_min;
      const pct = (((fastest.inhaled_mass_ug - balanced.inhaled_mass_ug) / fastest.inhaled_mass_ug) * 100).toFixed(1);
      
      return NextResponse.json({ 
        explanation: `The balanced route adds ${timeDiff} minutes but has ${pct}% lower modeled inhaled PM2.5 mass in the current exposure model. This estimate is based on nearby monitoring observations and spatial interpolation.`,
        _demoMode: true
      });
    }

    const response = await fetch(`${apiUrl}/routes/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Backend error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
