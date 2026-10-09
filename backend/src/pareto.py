def filter_dominated_routes(routes: list) -> list:
    """
    Perform Pareto domination filtering on routes based on duration and inhaled mass.
    Route A is dominated by Route B when:
    T_B <= T_A AND M_B <= M_A
    with at least one strict inequality.
    """
    non_dominated = []
    
    for i, a in enumerate(routes):
        is_dominated = False
        t_a = a['duration_min']
        m_a = a['inhaled_mass_ug']
        
        for j, b in enumerate(routes):
            if i == j:
                continue
            
            t_b = b['duration_min']
            m_b = b['inhaled_mass_ug']
            
            if (t_b <= t_a and m_b <= m_a) and (t_b < t_a or m_b < m_a):
                is_dominated = True
                break
                
        if not is_dominated:
            non_dominated.append(a)
            
    return non_dominated

def select_balanced_route(non_dominated_routes: list):
    """
    Select a reasonable knee candidate.
    Sort by travel time, calculate marginal exposure reduction per additional minute.
    """
    if not non_dominated_routes:
        return None
        
    if len(non_dominated_routes) <= 2:
        # If <= 2, just return the first or something in between if available
        return non_dominated_routes[len(non_dominated_routes) // 2]
        
    sorted_routes = sorted(non_dominated_routes, key=lambda r: r['duration_min'])
    
    best_marginal_reduction = -1
    balanced_idx = 1 # Default to middle/first alternative
    
    for i in range(len(sorted_routes) - 1):
        r1 = sorted_routes[i]
        r2 = sorted_routes[i+1]
        
        dt = r2['duration_min'] - r1['duration_min']
        dm = r1['inhaled_mass_ug'] - r2['inhaled_mass_ug']
        
        if dt > 0:
            marginal = dm / dt
            if marginal > best_marginal_reduction:
                best_marginal_reduction = marginal
                balanced_idx = i + 1
                
    return sorted_routes[balanced_idx]
