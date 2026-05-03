import math

def calculate_shear(b: float, d: float, fck: float, fyk: float, VEd: float, As_provided: float, gamma_c: float = 1.5, gamma_s: float = 1.15):
    """
    Shear design per EN 1992-1-1 §6.2
    
    :param b: Web width (mm)
    :param d: Effective depth (mm)
    :param fck: Concrete strength (MPa)
    :param fyk: Yield strength of shear links (MPa)
    :param VEd: Design shear force (kN)
    :param As_provided: Tension steel area provided extending > lbd beyond the section (mm2)
    :return: dict with shear results
    """
    # 1. Shear resistance without reinforcement (VRd,c)
    C_Rdc = 0.18 / gamma_c
    k = min(2.0, 1.0 + math.sqrt(200.0 / d))
    rho_l = min(0.02, As_provided / (b * d))
    
    vmin = 0.035 * k**1.5 * math.sqrt(fck)
    
    v_rdc_1 = C_Rdc * k * (100.0 * rho_l * fck)**(1/3)
    
    VRd_c = max(v_rdc_1, vmin) * b * d / 1000.0 # kN
    
    # 2. Maximum shear resistance (concrete strut crushing VRd,max)
    # Assume theta = 45 degrees, cot(theta) = 1.0, tan(theta) = 1.0
    z = 0.9 * d
    v1 = 0.6 * (1.0 - fck / 250.0)
    alpha_cw = 1.0
    fcd = 1.0 * fck / gamma_c # Note: for shear strut, alpha_cc usually 1.0 according to National Annexes, but we keep it simple.
    
    VRd_max = (alpha_cw * b * z * v1 * fcd) / (1.0 + 1.0) / 1000.0 # kN
    
    status = "OK"
    if VEd > VRd_max:
        return {
            "VRd_c": round(VRd_c, 2),
            "VRd_max": round(VRd_max, 2),
            "status": "FAIL: SECTION_TOO_SMALL",
            "message": f"VEd ({VEd} kN) exceeds maximum shear capacity VRd,max ({VRd_max:.2f} kN). Section needs to be enlarged."
        }
    
    # 3. Required shear reinforcement (Asw / s)
    fywd = fyk / gamma_s
    
    # Required Asw/s (mm2/mm)
    asw_s_req = (VEd * 1000.0) / (z * fywd * 1.0)
    
    # Minimum shear reinforcement
    rho_w_min = 0.08 * math.sqrt(fck) / fyk
    asw_s_min = rho_w_min * b
    
    asw_s_final = max(asw_s_req, asw_s_min)
    
    s_max_longitudinal = 0.75 * d
    
    if VEd <= VRd_c:
        message = "VEd < VRd,c. Only minimum shear links required."
    else:
        message = "VEd > VRd,c. Shear links required."
        
    return {
        "VRd_c": round(VRd_c, 2),
        "VRd_max": round(VRd_max, 2),
        "Asw_s_req": round(asw_s_req, 3),
        "Asw_s_min": round(asw_s_min, 3),
        "Asw_s_final": round(asw_s_final, 3),
        "s_max": round(s_max_longitudinal, 1),
        "status": status,
        "message": message
    }
