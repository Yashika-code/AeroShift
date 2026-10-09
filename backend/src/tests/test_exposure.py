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
