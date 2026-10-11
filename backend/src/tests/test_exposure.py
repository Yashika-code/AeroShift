import pytest
from exposure_model import estimate_inhaled_mass

def test_exposure_unit_calculation():
    # 100 ug/m3, 60 minutes (1 hour), mode: active (beta=2.2)
    # mass = 100 * (2.2 * 0.48) * 1 = 105.6
    mass = estimate_inhaled_mass(100.0, 60.0, "active")
    assert abs(mass - 105.6) < 0.01
    
    # mode: car (beta=0.7)
    # mass = 100 * (0.7 * 0.48) * 1 = 33.6
    mass = estimate_inhaled_mass(100.0, 60.0, "car")
    assert abs(mass - 33.6) < 0.01

def test_invalid_mode():
    with pytest.raises(ValueError, match="Unsupported mode: invalid"):
        estimate_inhaled_mass(100.0, 60.0, "invalid")

def test_two_wheeler_mode_calculation():
    # 50 ug/m3, 30 minutes (0.5 hour), mode: two_wheeler (beta=1.3)
    # mass = 50 * (1.3 * 0.48) * 0.5 = 15.6
    mass = estimate_inhaled_mass(50.0, 30.0, "two_wheeler")
    assert abs(mass - 15.6) < 0.01

def test_vehicle_modes_do_not_distort_duration():
    # Ventilation rates vary by mode, but baseline travel duration is preserved
    concentration = 80.0
    duration_min = 45.0
    
    mass_car = estimate_inhaled_mass(concentration, duration_min, "car")
    mass_bike = estimate_inhaled_mass(concentration, duration_min, "two_wheeler")
    mass_active = estimate_inhaled_mass(concentration, duration_min, "active")
    
    # car < two_wheeler < active ventilation
    assert mass_car < mass_bike < mass_active

