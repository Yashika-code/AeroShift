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
        
    if len(non_dominated_routes) == 1:
        return non_dominated_routes[0]
        
    if len(non_dominated_routes) == 2:
        return non_dominated_routes[1]
        
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


def select_strategy_routes(candidates: list) -> dict:
    """
    Given a list of processed candidate routes:
    1. Filter dominated routes using Pareto efficiency (duration vs inhaled PM2.5 mass).
    2. Select:
       - fastest: lowest duration (from non-dominated or all candidates)
       - cleanest: lowest inhaled mass (from non-dominated or all candidates)
       - balanced: optimal trade-off knee point
    3. If Pareto set has only 1 or 2 routes but more distinct candidates exist,
       provide the best distinct candidate for the remaining strategies so that
       Fast, Cleanest, and Balanced offer distinct genuine path options to the user.
    """
    if not candidates:
        return {'fastest': None, 'balanced': None, 'cleanest': None}

    # Deduplicate candidates with nearly identical duration and distance
    unique_candidates = []
    seen = set()
    for c in candidates:
        key = (round(c['duration_min'], 2), round(c['distance_km'], 2))
        if key not in seen:
            seen.add(key)
            unique_candidates.append(c)

    if not unique_candidates:
        unique_candidates = candidates

    non_dominated = filter_dominated_routes(unique_candidates)
    if not non_dominated:
        non_dominated = unique_candidates

    # Sort candidates
    by_time = sorted(unique_candidates, key=lambda x: x['duration_min'])
    by_clean = sorted(unique_candidates, key=lambda x: x['inhaled_mass_ug'])

    fastest = min(non_dominated, key=lambda x: x['duration_min'])
    cleanest = min(non_dominated, key=lambda x: x['inhaled_mass_ug'])

    # Balanced selection
    if len(non_dominated) >= 3:
        balanced = select_balanced_route(non_dominated)
    elif len(unique_candidates) >= 3:
        # If Pareto set is small because a fast route dominated, find a route between fastest and cleanest
        remaining = [c for c in unique_candidates if c != fastest and c != cleanest]
        if remaining:
            # Pick candidate with balanced composite score
            # Normalize duration and inhaled mass
            min_t, max_t = by_time[0]['duration_min'], by_time[-1]['duration_min']
            min_m, max_m = by_clean[0]['inhaled_mass_ug'], by_clean[-1]['inhaled_mass_ug']
            span_t = max(max_t - min_t, 1e-6)
            span_m = max(max_m - min_m, 1e-6)
            
            balanced = min(
                remaining,
                key=lambda x: 0.5 * ((x['duration_min'] - min_t) / span_t) + 0.5 * ((x['inhaled_mass_ug'] - min_m) / span_m)
            )
        else:
            balanced = select_balanced_route(non_dominated)
    else:
        balanced = select_balanced_route(non_dominated)

    # Ensure cleanest is truly cleanest among unique candidates if non_dominated picked fastest
    if cleanest == fastest and len(by_clean) > 1:
        # If the non-dominated set had only 1 route (e.g. fastest is cleaner than slower direct alt),
        # but there is another candidate route with higher time or different path:
        # Check if there is any candidate with lower inhaled mass
        actual_lowest_mass = by_clean[0]
        if actual_lowest_mass['inhaled_mass_ug'] < fastest['inhaled_mass_ug']:
            cleanest = actual_lowest_mass

    # If cleanest and fastest are still the same route and we have alternative routes:
    if cleanest == fastest and len(unique_candidates) > 1:
        # The alternative candidate offers a different detour / route option
        # assign second candidate to cleanest or balanced to give user a choice
        cleanest = unique_candidates[1]

    if balanced == fastest and len(unique_candidates) > 2:
        other = [c for c in unique_candidates if c != fastest and c != cleanest]
        if other:
            balanced = other[0]
    elif balanced == cleanest and len(unique_candidates) > 2:
        other = [c for c in unique_candidates if c != fastest and c != cleanest]
        if other:
            balanced = other[0]

    return {
        'fastest': fastest,
        'balanced': balanced or fastest,
        'cleanest': cleanest or fastest
    }

