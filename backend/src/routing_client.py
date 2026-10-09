import os
import requests

class RoutingClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.environ.get('ROUTING_BASE_URL', 'https://router.project-osrm.org')
        
    def get_routes(self, origin_lat, origin_lon, dest_lat, dest_lon, mode):
        # OSRM profiles: driving, walking, cycling
        profile = 'driving'
        if mode == 'active':
            profile = 'cycling'
            
        url = f"{self.base_url}/route/v1/{profile}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}?alternatives=true&geometries=geojson&overview=full&steps=true"
        
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Routing API error: {response.text}")
            
        data = response.json()
        if data['code'] != 'Ok':
            raise Exception(f"OSRM returned error: {data['code']}")
            
        return data['routes']
