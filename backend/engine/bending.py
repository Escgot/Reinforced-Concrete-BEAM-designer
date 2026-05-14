import math

def calculate_bending(b: float, d: float, fck: float, fyk: float, MEd: float, bf: float = None, hf: float = None, d2: float = 50.0, alpha_cc: float = 0.85, gamma_c: float = 1.5, gamma_s: float = 1.15):
    """
    Rectangular and Flanged section design per EN 1992-1-1 §6.1 (Singly & Doubly Reinforced)
    Based on standard UK National Annex / Mosley, Bungey & Hulse method.
    
    :param b: Width of section/web (mm)
    :param d: Effective depth (mm)
    :param fck: Characteristic compressive cylinder strength of concrete at 28 days (MPa)
    :param fyk: Characteristic yield strength of reinforcement (MPa)
    :param MEd: Design bending moment (kNm)
    :param bf: Flange width for T-beams (mm)
    :param hf: Flange thickness for T-beams (mm)
    :param d2: Depth to compression reinforcement (mm)
    :param alpha_cc: Coefficient taking account of long term effects on compressive strength
    :param gamma_c: Partial factor for concrete
    :param gamma_s: Partial factor for reinforcing steel
    :return: dict containing K, z, As_req (tension), As2_req (compression), and status
    """
    if MEd <= 0:
        return {"K": 0, "z": 0.95 * d, "As_req": 0, "As2_req": 0, "status": "OK", "message": "No moment applied."}

    fcd = alpha_cc * fck / gamma_c
    fyd = fyk / gamma_s
    
    # Effective width for calculation
    b_eff = bf if (bf is not None and bf > b) else b
    
    # Initial assumption: acts as rectangular beam of width b_eff
    K = (MEd * 1e6) / (b_eff * d**2 * fck)
    K_limit = 0.167
    
    fcd = alpha_cc * fck / gamma_c
    fyd = fyk / gamma_s
    
    As2_req = 0.0
    status = "OK"
    message = "Singly reinforced section design successful."
    
    # Calculate neutral axis if it was a rectangular beam of b_eff
    z_rect = d * (0.5 + math.sqrt(max(0, 0.25 - min(K, K_limit) / 1.134)))
    x_rect = (d - z_rect) / 0.4
    x_d = x_rect / d

    
    is_true_t_beam = False
    if bf is not None and hf is not None and bf > b:
        # Check if stress block is within flange (0.8 * x <= hf)
        if 0.8 * x_rect > hf:
            is_true_t_beam = True
            
    if is_true_t_beam:
        message = "True T-beam design (Neutral axis in web)."
        # Moment resisted by flange wings
        M_f = fcd * (bf - b) * hf * (d - 0.5 * hf) / 1e6
        M_w = MEd - M_f
        
        K_w = (M_w * 1e6) / (b * d**2 * fck)
        
        if K_w <= K_limit:
            z_w = d * (0.5 + math.sqrt(max(0, 0.25 - K_w / 1.134)))
            z_w = min(z_w, 0.95 * d)
            As_req = (M_f * 1e6) / (fyd * (d - 0.5 * hf)) + (M_w * 1e6) / (fyd * z_w)
            z = z_w # approximate z for reporting
        else:
            status = "OK (DOUBLY REINFORCED)"
            message = f"True T-beam. K_w ({K_w:.3f}) > K' ({K_limit:.3f}). Compression steel required."
            M_prime = K_limit * b * d**2 * fck / 1e6
            delta_M = M_w - M_prime
            z_limit = d * (0.5 + math.sqrt(0.25 - K_limit / 1.134))
            x = (d - z_limit) / 0.4
            x_d = x / d
            eps_sc = 0.0035 * (x - d2) / x
            Es = 200000.0
            fsc = eps_sc * Es
            if fsc > fyd: fsc = fyd
            if fsc <= 0:
                return {"K": round(K_w, 4), "z": None, "As_req": None, "As2_req": None, "status": "FAIL", "message": "Neutral axis is above compression steel. Increase section depth."}
            As2_req = (delta_M * 1e6) / (fsc * (d - d2))
            As_req = (M_f * 1e6) / (fyd * (d - 0.5 * hf)) + (M_prime * 1e6) / (fyd * z_limit) + (delta_M * 1e6) / (fyd * (d - d2))
            z = z_limit
    else:
        # Acts as rectangular section of width b_eff
        if K <= K_limit:
            # Singly reinforced
            z = z_rect
            z = min(z, 0.95 * d)
            As_req = (MEd * 1e6) / (fyd * z)
        else:
            # Doubly reinforced
            status = "OK (DOUBLY REINFORCED)"
            message = f"K ({K:.3f}) > K' ({K_limit:.3f}). Compression steel required."
            M_prime = K_limit * b_eff * d**2 * fck / 1e6  # kNm
            delta_M = MEd - M_prime
            z_limit = d * (0.5 + math.sqrt(0.25 - K_limit / 1.134))
            x = (d - z_limit) / 0.4
            x_d = x / d
            
            # Strain in compression steel
            # eps_cu3 = 0.0035 for concrete fck <= 50
            eps_sc = 0.0035 * (x - d2) / x
            
            # Stress in compression steel
            Es = 200000.0  # MPa
            fsc = eps_sc * Es
            if fsc > fyd:
                fsc = fyd
                
            if fsc <= 0:
                return {"K": round(K, 4), "z": None, "As_req": None, "As2_req": None, "status": "FAIL", "message": "Neutral axis is above compression steel. Increase section depth."}
                
            # Required compression steel
            As2_req = (delta_M * 1e6) / (fsc * (d - d2))
            
            # Total required tension steel
            As_req = ((M_prime * 1e6) / (fyd * z_limit)) + ((delta_M * 1e6) / (fyd * (d - d2)))
            
            z = z_limit  # Lever arm for the concrete compression block part

    # Minimum tension steel area per §9.2.1.1(1)
    fctm = 0.3 * fck**(2/3) if fck <= 50 else 2.12 * math.log(1 + fck/10)
    As_min = max(0.26 * (fctm / fyk) * b * d, 0.0013 * b * d)
    
    # Maximum steel area per §9.2.1.1(3)
    As_max = 0.04 * b * d
    
    if As_req < As_min:
        As_req = As_min
        status = "OK (Minimum Steel Governs)"

    return {
        "clause": "EN 1992-1-1 §6.1",
        "K": round(K, 4),
        "K_limit": K_limit,
        "z": round(z, 2),
        "x_d": round(x_d, 3),
        "fcd": round(fcd, 2),
        "fyd": round(fyd, 2),
        "b_eff": round(b_eff, 1),
        "As_req": round(As_req, 2),
        "As2_req": round(As2_req, 2),
        "As_min": round(As_min, 2),
        "As_max_approx": round(As_max, 2),
        "fctm": round(fctm, 3),
        "status": status,
        "message": message
    }
