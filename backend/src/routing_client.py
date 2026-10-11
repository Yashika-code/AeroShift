import os
import requests

class RoutingClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.environ.get('ROUTING_BASE_URL', 'https://router.project-osrm.org')
        
    def get_routes(self, origin_lat, origin_lon, dest_lat, dest_lon, mode, via_points=None):
        # OSRM profiles: driving, walking, cycling
        profile = 'driving'
        if mode == 'active':
            profile = 'cycling'
            
        if via_points:
            coords_str = f"{origin_lon},{origin_lat}"
            for v_lat, v_lon in via_points:
                coords_str += f";{v_lon},{v_lat}"
            coords_str += f";{dest_lon},{dest_lat}"
            url = f"{self.base_url}/route/v1/{profile}/{coords_str}?geometries=geojson&overview=full&steps=true"
        else:
            url = f"{self.base_url}/route/v1/{profile}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}?alternatives=true&geometries=geojson&overview=full&steps=true"
        
        try:
            response = requests.get(url, timeout=5)
            if response.status_code != 200:
                return []
            data = response.json()
            if data.get('code') != 'Ok':
                return []
            return data.get('routes', [])
        except Exception:
            return []

