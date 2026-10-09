import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Haversine distance between two points in km."""
    R = 6371.0 # Earth radius in km

    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)

    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_idw(target_lat: float, target_lon: float, stations: list, num_stations: int = 5) -> float:
    """
    Calculate PM2.5 using Inverse Distance Weighting (IDW).
    stations: list of dicts with 'latitude', 'longitude', 'pm25'
    """
    if not stations:
        raise ValueError("No valid station data exists.")

    # Calculate distances and filter out invalid PM2.5
    valid_stations = []
    for s in stations:
        if s.get('pm25') is None:
            continue
        dist = haversine_distance(target_lat, target_lon, s['latitude'], s['longitude'])
        # Handle zero distance explicitly
        if dist == 0:
            return s['pm25']
        valid_stations.append((dist, s['pm25']))

    if not valid_stations:
        raise ValueError("No valid station data exists.")

    # Sort by distance and take nearest N
    valid_stations.sort(key=lambda x: x[0])
    nearest = valid_stations[:num_stations]

    numerator = sum((pm25 / (dist ** 2)) for dist, pm25 in nearest)
    denominator = sum((1 / (dist ** 2)) for dist, _ in nearest)

    return numerator / denominator
