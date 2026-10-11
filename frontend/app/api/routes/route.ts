import { NextResponse } from 'next/server';
import { RoutesResponse, Mode } from '@/lib/types';

const apiUrl = process.env.AEROSHIFT_API_URL;

// Generate dummy demo data matching the contract
function getDemoData(origin: [number, number], destination: [number, number], mode: string): RoutesResponse {
  // Vehicle mode multipliers consistent with backend exposure model:
  // car: 0.7, two_wheeler: 1.3, active: 2.2
  const modeMultiplier = mode === 'active' ? 2.2 : mode === 'two_wheeler' ? 1.3 : 0.7;
  const baseMass = 40.2 / 0.7; // base mass normalized

  return {
    request: { origin, destination, mode: mode as unknown as Mode },

    routes: {
      fastest: {
        duration_min: 30.5,
        distance_km: 12.0,
        inhaled_mass_ug: Number((baseMass * modeMultiplier * 0.7).toFixed(1)),
        geometry: { type: 'LineString', coordinates: [[origin[1], origin[0]], [destination[1], destination[0]]] }
      },
      balanced: {
        duration_min: 35.0,
        distance_km: 13.5,
        inhaled_mass_ug: Number(((baseMass * 0.62) * modeMultiplier * 0.7).toFixed(1)), // significant drop
        geometry: { type: 'LineString', coordinates: [[origin[1], origin[0]], [(origin[1]+destination[1])/2, origin[0]], [destination[1], destination[0]]] }
      },
      cleanest: {
        duration_min: 45.0,
        distance_km: 15.0,
        inhaled_mass_ug: Number(((baseMass * 0.54) * modeMultiplier * 0.7).toFixed(1)),
        geometry: { type: 'LineString', coordinates: [[origin[1], origin[0]], [origin[1], destination[0]], [destination[1], destination[0]]] }
      }
    },

    metadata: {
      station_count: 5,
      model: "IDW",
      exposure_type: "estimated_ambient_pm25_inhaled_mass",
      disclaimer: "Exposure values are modeled ambient estimates derived from nearby monitoring stations, not direct roadside measurements."
    }
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!apiUrl) {
      console.warn("AEROSHIFT_API_URL is missing. Returning demo data.");
      return NextResponse.json({ ...getDemoData(body.origin, body.destination, body.mode), _demoMode: true });
    }

    const response = await fetch(`${apiUrl}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Backend error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    if (data?.routes) {
      console.log(`[FRONTEND_ROUTE_DIAGNOSTIC] Mode: ${body.mode} | Origin: ${JSON.stringify(body.origin)} -> Dest: ${JSON.stringify(body.destination)}`);
      for (const [strategy, r] of Object.entries(data.routes as Record<string, { duration_min: number; distance_km: number }>)) {
        console.log(`  [${strategy.toUpperCase()}] Distance: ${r.distance_km} km | Raw Duration: ${(r.duration_min * 60).toFixed(1)}s | Display ETA: ${Math.round(r.duration_min)} min (${r.duration_min.toFixed(2)}m)`);
      }
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
