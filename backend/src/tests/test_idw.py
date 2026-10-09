import pytest
from idw import haversine_distance, calculate_idw

def test_haversine_distance():
    # Delhi to Gurgaon
    dist = haversine_distance(28.6139, 77.2090, 28.4595, 77.0266)
    assert 20 < dist < 30 # roughly 25km

def test_idw_calculation():
    stations = [
        {'latitude': 28.6, 'longitude': 77.2, 'pm25': 100},
        {'latitude': 28.7, 'longitude': 77.3, 'pm25': 50}
    ]
    # exactly halfway roughly
    pm25 = calculate_idw(28.65, 77.25, stations)
    assert 50 < pm25 < 100

def test_zero_distance_idw():
    stations = [
        {'latitude': 28.6, 'longitude': 77.2, 'pm25': 100},
        {'latitude': 28.7, 'longitude': 77.3, 'pm25': 50}
    ]
    pm25 = calculate_idw(28.6, 77.2, stations)
    assert pm25 == 100

def test_missing_station_data():
    with pytest.raises(ValueError, match="No valid station data exists."):
        calculate_idw(28.6, 77.2, [])
        
    with pytest.raises(ValueError, match="No valid station data exists."):
        calculate_idw(28.6, 77.2, [{'latitude': 28.6, 'longitude': 77.2, 'pm25': None}])
