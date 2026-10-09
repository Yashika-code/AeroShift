import { NextResponse } from 'next/server';

const apiUrl = process.env.AEROSHIFT_API_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!apiUrl) {
      // Demo fallback
      return NextResponse.json({
        facility_name: body.facility_name,
        latest_pm25: 120,
        max_pm25: 145,
        min_pm25: 90,
        trend_direction: "increasing",
        advisory: {
          risk_level: "High",
          observed_window: "Past 8 hours",
          recommended_actions: [
            "Limit intense outdoor physical activity.",
            "Consider adjusting operational hours if air quality worsens."
          ],
          basis: "Based on recent monitoring observations supplied to the system."
        },
        _demoMode: true
      });
    }

    const response = await fetch(`${apiUrl}/shield/advisory`, {
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
