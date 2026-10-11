import logging
import os
import time

import requests
from station_repository import StationRepository

logger = logging.getLogger()
logger.setLevel(logging.INFO)

OPENAQ_BASE_URL = "https://api.openaq.org/v3"
DELHI_LAT = 28.6139
DELHI_LON = 77.2090
SEARCH_RADIUS_METERS = 25000


def get_openaq_headers():
    api_key = os.environ.get("OPENAQ_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAQ_API_KEY is missing from the Lambda environment.")
    return {"X-API-Key": api_key}


def get_openaq_data(headers):
    """Fetch monitoring locations around Delhi-NCR that report PM2.5."""
    response = requests.get(
        f"{OPENAQ_BASE_URL}/locations",
        headers=headers,
        params={
            "coordinates": f"{DELHI_LAT},{DELHI_LON}",
            "radius": SEARCH_RADIUS_METERS,
            "parameters_id": 2,
            "limit": 100,
            "page": 1,
        },
        timeout=15,
    )
    response.raise_for_status()
    return response.json().get("results", [])


def get_pm25_sensor_ids(location):
    """Read PM2.5 sensor IDs from each location's sensor metadata."""
    sensor_ids = set()
    for sensor in location.get("sensors") or []:
        parameter = sensor.get("parameter") or {}
        name = (parameter.get("name") or "").lower().replace(".", "").replace("_", "")
        display_name = (parameter.get("displayName") or "").lower().replace(".", "").replace("_", "")
        if name == "pm25" or display_name == "pm25":
            sensor_id = sensor.get("id")
            if sensor_id is not None:
                sensor_ids.add(sensor_id)
    return sensor_ids


def get_latest_pm25(location_id, pm25_sensor_ids, headers):
    """
    OpenAQ v3 latest records contain sensorsId and value, not a nested
    parameter object. Match each record to the PM2.5 sensor IDs above.
    """
    response = requests.get(
        f"{OPENAQ_BASE_URL}/locations/{location_id}/latest",
        headers=headers,
        params={"limit": 100, "page": 1},
        timeout=15,
    )
    response.raise_for_status()

    for measurement in response.json().get("results", []):
        sensor_id = measurement.get("sensorsId")
        value = measurement.get("value")
        if sensor_id in pm25_sensor_ids and value is not None:
            return float(value)
    return None


def lambda_handler(event, context):
    repo = StationRepository()

    try:
        headers = get_openaq_headers()
        locations = get_openaq_data(headers)

        stations_to_save = []
        now = int(time.time())
        ttl = now + 86400  # 24-hour rolling retention
        locations_with_pm25 = 0

        for loc in locations:
            try:
                coords = loc.get("coordinates") or {}
                latitude = coords.get("latitude")
                longitude = coords.get("longitude")
                location_id = loc.get("id")

                if latitude is None or longitude is None or location_id is None:
                    continue

                pm25_sensor_ids = get_pm25_sensor_ids(loc)
                if not pm25_sensor_ids:
                    continue

                locations_with_pm25 += 1
                pm25_value = get_latest_pm25(location_id, pm25_sensor_ids, headers)
                if pm25_value is None:
                    continue

                stations_to_save.append({
                    "station_id": str(location_id),
                    "name": loc.get("name") or "Unknown",
                    "latitude": float(latitude),
                    "longitude": float(longitude),
                    "pm25": pm25_value,
                    "timestamp": now,
                    "ttl": ttl,
                })

            except requests.RequestException as exc:
                logger.warning(
                    "Latest reading request failed for location %s: %s",
                    loc.get("id", "unknown"),
                    exc,
                )
            except (TypeError, ValueError, KeyError) as exc:
                logger.warning(
                    "Skipping malformed location %s: %s",
                    loc.get("id", "unknown"),
                    exc,
                )

        if stations_to_save:
            repo.save_stations(stations_to_save)

        logger.info(
            "Fetched %s locations; %s had PM2.5 sensors; saved %s locations with latest PM2.5 readings.",
            len(locations),
            locations_with_pm25,
            len(stations_to_save),
        )

        return {
            "statusCode": 200,
            "body": (
                f"Fetched {len(locations)} locations; "
                f"{locations_with_pm25} had PM2.5 sensors; "
                f"ingested {len(stations_to_save)} locations with latest PM2.5 readings"
            ),
        }

    except requests.RequestException as exc:
        logger.exception("OpenAQ request failed")
        return {"statusCode": 502, "body": f"OpenAQ request failed: {exc}"}
    except Exception as exc:
        logger.exception("Station ingestion failed")
        return {"statusCode": 500, "body": str(exc)}
