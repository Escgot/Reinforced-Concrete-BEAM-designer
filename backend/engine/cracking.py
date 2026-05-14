def calculate_cracking(fyk: float, As_req: float, As_prov: float, bar_spacing: float, bar_diameter: float, wk_limit: float = 0.3):
    """
    Simplified crack width check per EN 1992-1-1 §7.3.3
    
    :param fyk: Steel yield strength (MPa)
    :param As_req: Required tension steel (mm2)
    :param As_prov: Provided tension steel (mm2)
    :param bar_spacing: Actual spacing of tension bars (mm)
    :param bar_diameter: Diameter of tension bars (mm)
    :param wk_limit: Allowable crack width (mm) (usually 0.3 or 0.4)
    :return: dict with cracking results
    """
    # Estimate quasi-permanent steel stress
    # Assuming M_quasi_permanent / M_Ed ~ 0.6
    # sigma_s = (fyk / 1.15) * (As_req / As_prov) * 0.6 = approx 260 * (As_req / As_prov) for fyk=500
    # A more common assumption is sigma_s = 310 * (fyk/500) * (As_req/As_prov)
    sigma_s = 310.0 * (fyk / 500.0) * (As_req / As_prov) if As_prov > 0 else 999.0
    
    # Table 7.3N for max bar spacing (wk = 0.3mm)
    # sigma_s: 160 -> 300, 200 -> 250, 240 -> 200, 280 -> 150, 320 -> 100, 360 -> 50
    table_03 = [
        (160, 300), (200, 250), (240, 200), (280, 150), (320, 100), (360, 50)
    ]
    
    # Table 7.3N for max bar spacing (wk = 0.4mm)
    # sigma_s: 160 -> 300, 200 -> 300, 240 -> 250, 280 -> 200, 320 -> 150, 360 -> 100
    table_04 = [
        (160, 300), (200, 300), (240, 250), (280, 200), (320, 150), (360, 100)
    ]
    
    table = table_03 if wk_limit <= 0.3 else table_04
    
    max_spacing = 0.0
    
    if sigma_s <= table[0][0]:
        max_spacing = table[0][1]
    elif sigma_s >= table[-1][0]:
        max_spacing = table[-1][1]
    else:
        # Interpolate
        for i in range(len(table) - 1):
            s1, sp1 = table[i]
            s2, sp2 = table[i+1]
            if s1 <= sigma_s <= s2:
                # Linear interpolation
                max_spacing = sp1 + (sp2 - sp1) * (sigma_s - s1) / (s2 - s1)
                break
                
    status = "OK" if bar_spacing <= max_spacing else "FAIL"
    
    return {
        "clause": "EN 1992-1-1 §7.3.3",
        "sigma_s": round(sigma_s, 1),
        "max_allowable_spacing": round(max_spacing, 1),
        "actual_spacing": round(bar_spacing, 1),
        "wk_limit": wk_limit,
        "status": status,
        "message": f"Bar spacing check: {'OK' if status == 'OK' else 'FAIL'}. {bar_spacing}mm vs {max_spacing:.1f}mm limit."
    }
