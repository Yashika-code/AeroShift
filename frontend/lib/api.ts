import { RoutesResponse, Mode } from './types';

export async function fetchRoutes(origin: [number, number], destination: [number, number], mode: Mode): Promise<RoutesResponse> {
  const response = await fetch('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, mode }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch routes');
  }

  return response.json();
}
