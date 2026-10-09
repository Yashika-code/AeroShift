import os
import json
import boto3

BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.titan-text-lite-v1')

def invoke_bedrock(prompt: str) -> str:
    client = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
    
    try:
        response = client.converse(
            modelId=BEDROCK_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ]
        )
        return response['output']['message']['content'][0]['text']
    except Exception as e:
        print(f"Bedrock invocation error: {e}")
        return "Model invocation failed or not configured."

def generate_route_explanation(fastest_duration, fastest_mass, balanced_duration, balanced_mass):
    time_diff = balanced_duration - fastest_duration
    if fastest_mass > 0:
        percent_diff = ((fastest_mass - balanced_mass) / fastest_mass) * 100
    else:
        percent_diff = 0
        
    prompt = f"""
    The fastest route takes {fastest_duration:.1f} minutes with a modeled inhaled PM2.5 mass of {fastest_mass:.1f} ug.
    The balanced route takes {balanced_duration:.1f} minutes (an additional {time_diff:.1f} minutes) but reduces the modeled inhaled PM2.5 mass to {balanced_mass:.1f} ug (a {percent_diff:.1f}% reduction).
    
    Write a maximum 2 sentence factual summary comparing these routes.
    Do not invent road characteristics, do not make medical claims, do not claim it is actually healthier.
    Explicitly use the phrase 'modeled exposure'.
    """
    
    return invoke_bedrock(prompt)

def generate_shield_advisory(facility_name, latest_pm25, max_pm25, min_pm25, trend_direction):
    prompt = f"""
    Facility: {facility_name}
    Latest PM2.5: {latest_pm25}
    Recent Max: {max_pm25}
    Recent Min: {min_pm25}
    Trend: {trend_direction}
    
    Generate an operational bulletin with the following JSON structure exactly, and nothing else.
    {{
      "risk_level": "Low/Medium/High based on PM2.5",
      "observed_window": "Recent observations",
      "recommended_actions": ["action 1", "action 2"],
      "basis": "Based on recent monitoring observations supplied to the system."
    }}
    Do not diagnose health conditions. Do not invent meteorological inversions. Do not fabricate a peak window.
    """
    
    result = invoke_bedrock(prompt)
    try:
        start_idx = result.find('{')
        end_idx = result.rfind('}') + 1
        if start_idx != -1 and end_idx != -1:
            return json.loads(result[start_idx:end_idx])
        return json.loads(result)
    except:
        return {
            "risk_level": "Unknown",
            "observed_window": "Recent",
            "recommended_actions": ["Parse error for generated advisory."],
            "basis": "Based on recent monitoring observations supplied to the system."
        }
