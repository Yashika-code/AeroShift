import json
import logging
from bedrock_summary import generate_route_explanation

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        fastest = body.get('fastest')
        balanced = body.get('balanced')
        
        if not fastest or not balanced:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing fastest or balanced route data'})}
            
        explanation = generate_route_explanation(
            fastest['duration_min'], 
            fastest['inhaled_mass_ug'],
            balanced['duration_min'],
            balanced['inhaled_mass_ug']
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'explanation': explanation})
        }
    except Exception as e:
        logger.error(f"Error explaining route: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
