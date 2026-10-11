import json
import logging
from routing_client import RoutingClient
from station_repository import StationRepository
from idw import calculate_idw
from exposure_model import estimate_inhaled_mass
from pareto import select_strategy_routes

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        origin = body.get('origin')
        destination = body.get('destination')
        mode = body.get('mode')
        
        if not origin or not destination or not mode:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing origin, destination, or mode'})}
            
        routing_client = RoutingClient()
        repo = StationRepository()
        
        stations = repo.get_recent_stations()
        
        # Get direct routes from OSRM
        raw_routes = routing_client.get_routes(origin[0], origin[1], destination[0], destination[1], mode)
        
        # If OSRM returns fewer than 3 alternatives, generate alternative corridors using orthogonal midpoints
        if len(raw_routes) < 3:
            mid_lat = (origin[0] + destination[0]) / 2.0
            mid_lon = (origin[1] + destination[1]) / 2.0
            d_lat = destination[0] - origin[0]
            d_lon = destination[1] - origin[1]

            offsets = [
                (mid_lat - d_lon * 0.18, mid_lon + d_lat * 0.18),
                (mid_lat + d_lon * 0.18, mid_lon - d_lat * 0.18)
            ]
            
            for w_lat, w_lon in offsets:
                via_routes = routing_client.get_routes(
                    origin[0], origin[1], destination[0], destination[1], mode, via_points=[(w_lat, w_lon)]
                )
                if via_routes:
                    raw_routes.append(via_routes[0])
                if len(raw_routes) >= 4:
                    break
        
        processed_routes = []
        for r in raw_routes:
            # Calculate total duration in minutes and distance in km
            duration_min = r['duration'] / 60.0
            distance_km = r['distance'] / 1000.0
            
            # Sample route geometry (legs/steps)
            total_inhaled_mass = 0
            
            # For simplicity, calculate average PM2.5 along steps and assign proportional duration
            # OSRM provides steps with duration
            for leg in r['legs']:
                for step in leg['steps']:
                    step_duration_min = step['duration'] / 60.0
                    step_lon, step_lat = step['maneuver']['location']
                    
                    try:
                        pm25 = calculate_idw(step_lat, step_lon, stations)
                        inhaled_mass = estimate_inhaled_mass(pm25, step_duration_min, mode)
                        total_inhaled_mass += inhaled_mass
                    except ValueError:
                        pass # No stations available
                        
            processed_routes.append({
                'duration_min': duration_min,
                'distance_km': distance_km,
                'inhaled_mass_ug': total_inhaled_mass,
                'geometry': r['geometry']
            })
            
        # Strategy-based ranking and selection (Fastest, Cleanest, Balanced)
        selected_routes = select_strategy_routes(processed_routes)
        fastest = selected_routes['fastest']
        balanced = selected_routes['balanced']
        cleanest = selected_routes['cleanest']

        
        response = {
            "request": {
                "origin": origin,
                "destination": destination,
                "mode": mode
            },
            "routes": {
                "fastest": fastest,
                "balanced": balanced,
                "cleanest": cleanest
            },
            "metadata": {
                "station_count": len(stations),
                "model": "IDW",
                "exposure_type": "estimated_ambient_pm25_inhaled_mass",
                "disclaimer": "Exposure values are modeled ambient estimates derived from nearby monitoring stations, not direct roadside measurements."
            }
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response)
        }
        
    except Exception as e:
        logger.error(f"Route engine error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
