import { NextResponse } from 'next/server';
import { RoutesResponse, Mode } from '@/lib/types';

const apiUrl = process.env.AEROSHIFT_API_URL;

// Generate dummy demo data matching the contract
function getDemoData(origin: [number, number], destination: [number, number], mode: string): RoutesResponse {
  return {
    request: { origin, destination, mode: mode as unknown as Mode },

    routes: {
      fastest: {
        duration_min: 30.5,
        distance_km: 12.0,
        inhaled_mass_ug: 40.2,
        geometry: { type: 'LineString', coordinates: [[origin[1], origin[0]], [destination[1], destination[0]]] }
      },
      balanced: {
        duration_min: 35.0,
        distance_km: 13.5,
        inhaled_mass_ug: 25.1, // significant drop
        geometry: { type: 'LineString', coordinates: [[origin[1], origin[0]], [(origin[1]+destination[1])/2, origin[0]], [destination[1], destination[0]]] }
      },
      cleanest: {
        duration_min: 45.0,
        distance_km: 15.0,
        inhaled_mass_ug: 22.0,
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
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
