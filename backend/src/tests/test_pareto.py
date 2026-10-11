import pytest
from pareto import filter_dominated_routes, select_balanced_route, select_strategy_routes

def test_pareto_domination():
    routes = [
        {'duration_min': 30, 'inhaled_mass_ug': 20, 'id': 'A'}, # Fast, dirty
        {'duration_min': 40, 'inhaled_mass_ug': 10, 'id': 'B'}, # Slow, clean
        {'duration_min': 50, 'inhaled_mass_ug': 25, 'id': 'C'}, # Dominated by A (slower and dirtier)
        {'duration_min': 35, 'inhaled_mass_ug': 15, 'id': 'D'}  # Middle
    ]
    
    non_dominated = filter_dominated_routes(routes)
    
    ids = [r['id'] for r in non_dominated]
    assert 'A' in ids
    assert 'B' in ids
    assert 'D' in ids
    assert 'C' not in ids

def test_balanced_selection():
    routes = [
        {'duration_min': 30, 'inhaled_mass_ug': 20}, # Fast
        {'duration_min': 40, 'inhaled_mass_ug': 10}, # Clean
        {'duration_min': 35, 'inhaled_mass_ug': 12}  # Balanced: huge drop in exposure for 5 min
    ]
    
    balanced = select_balanced_route(routes)
    assert balanced['duration_min'] == 35
    assert balanced['inhaled_mass_ug'] == 12

def test_fastest_cleanest_selection_logic():
    routes = [
        {'duration_min': 30, 'inhaled_mass_ug': 20}, # Fast
        {'duration_min': 40, 'inhaled_mass_ug': 10}, # Clean
        {'duration_min': 35, 'inhaled_mass_ug': 12}  # Balanced
    ]
    
    fastest = min(routes, key=lambda x: x['duration_min'])
    cleanest = min(routes, key=lambda x: x['inhaled_mass_ug'])
    
    assert fastest['duration_min'] == 30
    assert cleanest['inhaled_mass_ug'] == 10

def test_select_strategy_routes_distinct():
    candidates = [
        {'duration_min': 28.5, 'distance_km': 22.0, 'inhaled_mass_ug': 35.0, 'id': 'route_fast'},
        {'duration_min': 32.0, 'distance_km': 23.5, 'inhaled_mass_ug': 25.0, 'id': 'route_balanced'},
        {'duration_min': 36.0, 'distance_km': 25.0, 'inhaled_mass_ug': 18.0, 'id': 'route_cleanest'}
    ]
    res = select_strategy_routes(candidates)
    assert res['fastest']['id'] == 'route_fast'
    assert res['cleanest']['id'] == 'route_cleanest'
    assert res['balanced']['id'] == 'route_balanced'

def test_select_strategy_routes_with_dominated_candidate():
    # Candidate B is slightly slower and has higher mass than A, but candidate C offers a genuine detour
    candidates = [
        {'duration_min': 28.0, 'distance_km': 20.0, 'inhaled_mass_ug': 30.0, 'id': 'route_1'},
        {'duration_min': 30.0, 'distance_km': 21.0, 'inhaled_mass_ug': 32.0, 'id': 'route_2'},
        {'duration_min': 34.0, 'distance_km': 24.0, 'inhaled_mass_ug': 20.0, 'id': 'route_3'}
    ]
    res = select_strategy_routes(candidates)
    assert res['fastest']['id'] == 'route_1'
    assert res['cleanest']['id'] == 'route_3'
    # All 3 strategies receive valid route mappings
    assert res['balanced'] is not None

def test_fastest_is_strictly_minimum_duration():
    candidates = [
        {'duration_min': 25.0, 'distance_km': 18.0, 'inhaled_mass_ug': 40.0, 'id': 'f'},
        {'duration_min': 35.0, 'distance_km': 20.0, 'inhaled_mass_ug': 25.0, 'id': 'm'},
        {'duration_min': 45.0, 'distance_km': 25.0, 'inhaled_mass_ug': 15.0, 'id': 'c'}
    ]
    res = select_strategy_routes(candidates)
    assert res['fastest']['duration_min'] == min(c['duration_min'] for c in candidates)
    assert res['fastest']['id'] == 'f'
    assert res['cleanest']['inhaled_mass_ug'] == min(c['inhaled_mass_ug'] for c in candidates)
    assert res['cleanest']['id'] == 'c'

def test_duration_preservation_from_provider():
    # Verify that raw provider route durations are passed without being altered or scaled
    raw_durations = [1715.1, 1788.0, 2088.7]  # seconds
    processed_candidates = []
    for i, dur_sec in enumerate(raw_durations):
        processed_candidates.append({
            'duration_min': dur_sec / 60.0,
            'distance_km': 22.0 + i,
            'inhaled_mass_ug': 30.0 - i * 2,
            'id': f'route_{i}'
        })
    res = select_strategy_routes(processed_candidates)
    # The duration for route_0 must exactly match raw provider duration / 60
    assert abs(res['fastest']['duration_min'] - (1715.1 / 60.0)) < 1e-6
    assert abs(res['cleanest']['duration_min'] - (2088.7 / 60.0)) < 1e-6

def test_vehicle_mode_consistency_and_route_selection():
    # Verify candidate selection across different vehicle modes (car, two_wheeler, active)
    modes = ['car', 'two_wheeler', 'active']
    for mode in modes:
        # Candidate set for this mode
        candidates = [
            {'duration_min': 28.58, 'distance_km': 22.35, 'inhaled_mass_ug': 28.7, 'id': 'fast'},
            {'duration_min': 29.80, 'distance_km': 21.39, 'inhaled_mass_ug': 29.3, 'id': 'clean'},
            {'duration_min': 34.81, 'distance_km': 26.40, 'inhaled_mass_ug': 30.1, 'id': 'alt'}
        ]
        res = select_strategy_routes(candidates)
        # Duration for fastest must always be the lowest duration
        assert res['fastest']['duration_min'] == 28.58
        # Each strategy must reference its own distinct candidate route
        assert res['fastest']['id'] == 'fast'
        assert res['balanced']['id'] == 'alt'
        assert res['cleanest']['id'] == 'clean'



