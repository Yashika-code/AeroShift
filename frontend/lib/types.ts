export type Mode = 'two_wheeler' | 'active' | 'car';

export interface RouteGeometry {
  type: string;
  coordinates: number[][];
}

export interface RouteData {
  duration_min: number;
  distance_km: number;
  inhaled_mass_ug: number;
  geometry: RouteGeometry;
}

export interface RoutesResponse {
  request: {
    origin: [number, number];
    destination: [number, number];
    mode: Mode;
  };
  routes: {
    fastest: RouteData;
    balanced: RouteData;
    cleanest: RouteData;
  };
  metadata: {
    station_count: number;
    model: string;
    exposure_type: string;
    disclaimer: string;
  };
}
