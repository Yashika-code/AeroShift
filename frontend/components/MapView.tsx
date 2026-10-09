'use client';

import * as React from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { RoutesResponse } from '@/lib/types';

interface MapViewProps {
  data: RoutesResponse | null;
  selectedRoute: string | null;
}

const COLORS: Record<string, string> = {
  fastest: '#EF4444', 
  balanced: '#10B981', 
  cleanest: '#1a73e8', // Google Blue
};

const STROKE_COLORS: Record<string, string> = {
  fastest: '#B91C1C', 
  balanced: '#047857', 
  cleanest: '#1557b0', 
};

// Helper to decode OSRM polyline strings
const decodePolyline = (str: string) => {
  let index = 0, lat = 0, lng = 0, coordinates = [];
  while (index < str.length) {
      let b, shift = 0, result = 0;
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat;
      shift = 0; result = 0;
      do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
      coordinates.push([lng * 1e-5, lat * 1e-5]);
  }
  return coordinates;
};

export default function MapView({ data, selectedRoute }: MapViewProps) {
  const selectedRouteData = data && selectedRoute ? data.routes[selectedRoute as keyof typeof data.routes] : null;

  const handleStartJourney = () => {
    if (!data?.request || !selectedRouteData) return;
    const { origin, destination } = data.request;
    
    // Extract a few waypoints from the selected route to force Google Maps to take this exact path
    let waypointsStr = '';
    let coords: number[][] = [];
    if (typeof selectedRouteData.geometry === 'string') {
        coords = decodePolyline(selectedRouteData.geometry);
    } else if (Array.isArray(selectedRouteData.geometry)) {
        coords = selectedRouteData.geometry as number[][];
    } else if (selectedRouteData.geometry && Array.isArray(selectedRouteData.geometry.coordinates)) {
        coords = selectedRouteData.geometry.coordinates as number[][];
    }
    
    if (coords.length > 0 && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
        coords = coords.flat() as number[][];
    }
    coords = coords.map(c => [Number(c[0]), Number(c[1])]).filter(c => !isNaN(c[0]) && !isNaN(c[1]));

    if (coords.length > 10) {
      // Pick 3 evenly spaced points along a real route to act as waypoints
      const step = Math.floor(coords.length / 4);
      const wp1 = coords[step];
      const wp2 = coords[step * 2];
      const wp3 = coords[step * 3];
      waypointsStr = `&waypoints=${wp1[1]},${wp1[0]}|${wp2[1]},${wp2[0]}|${wp3[1]},${wp3[0]}`;
    } else if (coords.length > 2) {
      // For demo routes that only have a single intermediate point
      const wp1 = coords[1];
      waypointsStr = `&waypoints=${wp1[1]},${wp1[0]}`;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}${waypointsStr}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Determine bounds
  const bounds = React.useMemo(() => {
    if (!data?.routes?.fastest?.geometry) return undefined;
    const route = data.routes.fastest;
    let coords: number[][] = [];
    if (typeof route.geometry === 'string') {
        coords = decodePolyline(route.geometry);
    } else if (Array.isArray(route.geometry)) {
        coords = route.geometry as number[][];
    } else if (route.geometry && Array.isArray(route.geometry.coordinates)) {
        coords = route.geometry.coordinates as number[][];
    }
    
    if (coords.length > 1) {
      let minLng = coords[0][0]; let maxLng = coords[0][0];
      let minLat = coords[0][1]; let maxLat = coords[0][1];
      for (const c of coords) {
        if (c[0] < minLng) minLng = c[0];
        if (c[0] > maxLng) maxLng = c[0];
        if (c[1] < minLat) minLat = c[1];
        if (c[1] > maxLat) maxLat = c[1];
      }
      return [minLng, minLat, maxLng, maxLat] as [number, number, number, number];
    }
    return undefined;
  }, [data]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-100 rounded-3xl overflow-hidden shadow-sm border border-slate-200">
      <Map
        initialViewState={{
          longitude: 77.2090,
          latitude: 28.6139,
          zoom: 10,
          bounds: bounds,
          fitBoundsOptions: { padding: 50 }
        }}
        mapStyle={{
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap Contributors'
            }
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }]
        }}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
      >
        {data?.routes && Object.entries(data.routes).map(([key, route]) => {
          if (!route || !route.geometry) return null;
          
          let coords: number[][] = [];
          if (typeof route.geometry === 'string') {
              coords = decodePolyline(route.geometry);
          } else if (Array.isArray(route.geometry)) {
              coords = route.geometry as number[][];
          } else if (route.geometry && Array.isArray(route.geometry.coordinates)) {
              coords = route.geometry.coordinates as number[][];
          }

          // Flatten and sanitize
          if (coords.length > 0 && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
              coords = coords.flat() as number[][];
          }
          coords = coords.map(c => [Number(c[0]), Number(c[1])]).filter(c => !isNaN(c[0]) && !isNaN(c[1]));

          if (coords.length < 2) return null;

          const isSelected = selectedRoute === key;
          const innerColor = COLORS[key] || '#94a3b8';
          const strokeColor = STROKE_COLORS[key] || '#64748b';

          const geojson = {
            type: 'FeatureCollection' as const,
            features: [{
              type: 'Feature' as const,
              properties: {},
              geometry: { type: 'LineString' as const, coordinates: coords }
            }]
          };

          // Generate Blob URL to prevent MapLibre worker cloning errors
          let sourceUrl = '';
          try {
            const blob = new Blob([JSON.stringify(geojson)], { type: 'application/json' });
            sourceUrl = URL.createObjectURL(blob);
          } catch(e) {}

          return (
            <Source key={`source-${key}`} id={`source-${key}`} type="geojson" data={sourceUrl || geojson}>
              <Layer 
                id={`layer-bg-${key}`} 
                type="line" 
                paint={{ 'line-color': strokeColor, 'line-width': 12, 'line-opacity': isSelected ? 1.0 : 0.0 }} 
                layout={{ 'line-join': 'round', 'line-cap': 'round' }} 
              />
              <Layer 
                id={`layer-${key}`} 
                type="line" 
                paint={{ 'line-color': innerColor, 'line-width': isSelected ? 8 : 4, 'line-opacity': isSelected ? 1.0 : 0.4 }} 
                layout={{ 'line-join': 'round', 'line-cap': 'round' }} 
              />
            </Source>
          );
        })}

        {selectedRouteData && (() => {
          let coords: number[][] = [];
          if (typeof selectedRouteData.geometry === 'string') {
              coords = decodePolyline(selectedRouteData.geometry);
          } else if (Array.isArray(selectedRouteData.geometry)) {
              coords = selectedRouteData.geometry as number[][];
          } else if (selectedRouteData.geometry && Array.isArray(selectedRouteData.geometry.coordinates)) {
              coords = selectedRouteData.geometry.coordinates as number[][];
          }
          if (coords.length > 0 && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) coords = coords.flat() as number[][];
          coords = coords.map(c => [Number(c[0]), Number(c[1])]).filter(c => !isNaN(c[0]) && !isNaN(c[1]));

          if (coords.length < 2) return null;

          const start = coords[0] as [number, number];
          const end = coords[coords.length - 1] as [number, number];

          return (
            <>
              <Marker longitude={start[0]} latitude={start[1]} color="#10B981" />
              <Marker longitude={end[0]} latitude={end[1]} color="#EF4444" />
            </>
          );
        })()}
      </Map>

      {selectedRouteData && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white p-2.5 pr-3 rounded-full shadow-xl border border-slate-200 z-10">
          <div className="flex flex-col pl-4 border-r border-slate-100 pr-5">
            <span className="text-sm font-black text-slate-800">{Math.round(selectedRouteData.duration_min)} min</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedRouteData.distance_km.toFixed(1)} km</span>
          </div>
          <button 
            onClick={handleStartJourney}
            className="flex items-center justify-center px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-sm font-bold shadow-md transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Start Journey
          </button>
        </div>
      )}
    </div>
  );
}
