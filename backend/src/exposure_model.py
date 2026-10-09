# Exposure model for inhaled PM2.5 mass estimation.
# Note: These values are MODEL PARAMETERS, not universal physiological constants.

V0 = 0.48 # m³/hour, base ventilation rate

# Mode multipliers (beta)
BETA_MODES = {
    "active": 2.2,
    "two_wheeler": 1.3,
    "car": 0.7
}

def estimate_inhaled_mass(pm25_concentration: float, duration_minutes: float, mode: str) -> float:
    """
    Estimate inhaled PM2.5 mass in micrograms.
    pm25_concentration: ug/m³
    duration_minutes: minutes
    mode: travel mode (active, two_wheeler, car)
    """
    if mode not in BETA_MODES:
        raise ValueError(f"Unsupported mode: {mode}")

    beta_m = BETA_MODES[mode]
    v_m = beta_m * V0
    
    # Duration in hours
    t_k_hours = duration_minutes / 60.0
    
    # M_R = C_hat_k * V_m * t_k
    inhaled_mass = pm25_concentration * v_m * t_k_hours
    return inhaled_mass
