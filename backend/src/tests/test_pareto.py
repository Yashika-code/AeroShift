import pytest
from pareto import filter_dominated_routes, select_balanced_route

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
