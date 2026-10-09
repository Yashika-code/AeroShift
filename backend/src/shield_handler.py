import json
import logging
from bedrock_summary import generate_shield_advisory

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        facility_name = body.get('facility_name', 'Unknown Facility')
        trend_data = body.get('pm25_trend', [])
        
        if not trend_data or len(trend_data) < 1:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    "risk_level": "Unknown",
                    "observed_window": "Insufficient",
                    "recommended_actions": [],
                    "basis": "Insufficient monitoring data for a confident operational recommendation."
                })
            }
            
        pm25_values = [item['pm25'] for item in trend_data]
        latest_pm25 = pm25_values[-1]
        max_pm25 = max(pm25_values)
        min_pm25 = min(pm25_values)
        
        trend_direction = "stable"
        if len(pm25_values) >= 2:
            if pm25_values[-1] > pm25_values[0] * 1.1:
                trend_direction = "increasing"
            elif pm25_values[-1] < pm25_values[0] * 0.9:
                trend_direction = "decreasing"
                
        advisory = generate_shield_advisory(facility_name, latest_pm25, max_pm25, min_pm25, trend_direction)
        
        response = {
            "facility_name": facility_name,
            "latest_pm25": latest_pm25,
            "max_pm25": max_pm25,
            "min_pm25": min_pm25,
            "trend_direction": trend_direction,
            "advisory": advisory
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response)
        }
    except Exception as e:
        logger.error(f"Error generating shield advisory: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
