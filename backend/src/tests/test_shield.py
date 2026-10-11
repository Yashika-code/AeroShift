import json
from shield_handler import lambda_handler

def test_shield_handler_with_custom_trends():
    event = {
        "body": json.dumps({
            "facility_name": "Central School District",
            "pm25_trend": [
                {"timestamp": "2026-10-11T10:00:00Z", "pm25": 140.0},
                {"timestamp": "2026-10-11T11:00:00Z", "pm25": 160.0},
                {"timestamp": "2026-10-11T12:00:00Z", "pm25": 180.0}
            ]
        })
    }
    
    response = lambda_handler(event, None)
    assert response["statusCode"] == 200
    data = json.loads(response["body"])
    assert data["facility_name"] == "Central School District"
    assert data["latest_pm25"] == 180.0
    assert data["max_pm25"] == 180.0
    assert data["min_pm25"] == 140.0
    assert data["trend_direction"] == "increasing"
    assert "advisory" in data
    assert "risk_level" in data["advisory"]
    assert "recommended_actions" in data["advisory"]
    assert len(data["advisory"]["recommended_actions"]) > 0

def test_shield_handler_empty_body_fallback():
    # Empty body or missing pm25_trend should fall back gracefully without 500 error
    event = {"body": "{}"}
    response = lambda_handler(event, None)
    assert response["statusCode"] == 200
    data = json.loads(response["body"])
    assert "advisory" in data
    assert data["advisory"]["risk_level"] in ["Low", "Medium", "High", "Critical"]
    assert len(data["advisory"]["recommended_actions"]) > 0
