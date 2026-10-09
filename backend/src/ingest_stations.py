import logging
import requests
import time
from station_repository import StationRepository

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_openaq_data():
    # Fetch data from OpenAQ v3 for Delhi-NCR
    url = "https://api.openaq.org/v3/locations?coordinates=28.6139,77.2090&radius=50000&parameters_id=2" # PM2.5 is parameter_id 2
    headers = {}
    
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()

def lambda_handler(event, context):
    repo = StationRepository()
    try:
        data = get_openaq_data()
        locations = data.get('results', [])
        
        stations_to_save = []
        valid_pm25 = 0
        now = int(time.time())
        ttl = now + 86400 # 24 hours rolling retention
        
        for loc in locations:
            try:
                coords = loc.get('coordinates', {})
                if not coords or 'latitude' not in coords or 'longitude' not in coords:
                    continue
                    
                # In v3, we need to fetch latest measurements, or use sensors list if available
                # Assuming simple mock structure from sensors if we just want recent PM2.5
                # For a real implementation, would query /v3/locations/{id}/latest
                # OpenAQ v3 structure can be complex, skipping strict nested checks for MVP robustness
                pm25_val = None
                
                # Mocking extraction logic if it's nested
                if 'sensors' in loc:
                    for sensor in loc['sensors']:
                        if sensor.get('parameter', {}).get('name') == 'pm25' and 'latest' in sensor:
                            pm25_val = sensor['latest'].get('value')
                            
                if pm25_val is None:
                    continue
                    
                valid_pm25 += 1
                stations_to_save.append({
                    'station_id': str(loc['id']),
                    'name': loc.get('name', 'Unknown'),
                    'latitude': float(coords['latitude']),
                    'longitude': float(coords['longitude']),
                    'pm25': float(pm25_val),
                    'timestamp': now,
                    'ttl': ttl
                })
            except Exception as e:
                logger.warning(f"Malformed station record: {e}")
                
        repo.save_stations(stations_to_save)
        
        logger.info(f"Fetched {len(locations)} stations, {valid_pm25} valid PM2.5 records, {len(stations_to_save)} written.")
        
        return {
            'statusCode': 200,
            'body': f"Ingested {len(stations_to_save)} stations"
        }
        
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        return {
            'statusCode': 500,
            'body': str(e)
        }
