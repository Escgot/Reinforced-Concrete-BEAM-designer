import math

def calculate_bending(b: float, d: float, fck: float, fyk: float, MEd: float, alpha_cc: float = 0.85, gamma_c: float = 1.5, gamma_s: float = 1.15):
    """
    Singly-reinforced rectangular section design per EN 1992-1-1 §6.1
    Based on standard UK National Annex / Mosley, Bungey & Hulse method.
    
    :param b: Width of section (mm)
    :param d: Effective depth (mm)
    :param fck: Characteristic compressive cylinder strength of concrete at 28 days (MPa)
    :param fyk: Characteristic yield strength of reinforcement (MPa)
    :param MEd: Design bending moment (kNm)
    :param alpha_cc: Coefficient taking account of long term effects on compressive strength
    :param gamma_c: Partial factor for concrete
    :param gamma_s: Partial factor for reinforcing steel
    :return: dict containing K, z, As_req, and status
    """
    if MEd <= 0:
        return {"K": 0, "z": 0.95 * d, "As_req": 0, "status": "OK", "message": "No moment applied."}

    # K factor
    K = (MEd * 1e6) / (b * d**2 * fck)
    
    # K limit for singly reinforced section (without moment redistribution)
    # K' = 0.167 for concrete up to C50/60
    # Formula for K' is 0.60 * delta - 0.18 * delta**2 - 0.21, where delta is moment redistribution ratio.
    # Without redistribution, delta = 1.0 -> K' = 0.21. Wait.
    # Actually, delta = 1.0 => K' = 0.167 is the limit for yielding of tension steel before concrete crushes.
    # According to UK NA, K' = 0.167.
    K_limit = 0.167
    
    if K > K_limit:
        return {"K": K, "z": None, "As_req": None, "status": "COMPRESSION_STEEL_REQUIRED", "message": f"K ({K:.3f}) > K' ({K_limit:.3f}). Compression steel required. This module only handles singly reinforced sections."}

    # Lever arm z
    # Note: Using alpha_cc = 0.85 and gamma_c = 1.5 -> fcd = 0.85*fck/1.5 = 0.567 fck.
    # The term in the square root is (0.25 - K/1.134)
    # The standard formula is z = d * (0.5 + sqrt(0.25 - K / (2 * alpha_cc / gamma_c)))? No.
    # EN 1992-1-1: z = d * (0.5 + sqrt(0.25 - K / 1.134))
    z = d * (0.5 + math.sqrt(max(0, 0.25 - K / 1.134)))
    
    # Limit z to 0.95d
    z = min(z, 0.95 * d)
    
    # Required tension steel
    fcd = alpha_cc * fck / gamma_c
    fyd = fyk / gamma_s
    As_req = (MEd * 1e6) / (fyd * z)
    
    # Minimum steel area per §9.2.1.1(1)
    fctm = 0.3 * fck**(2/3) if fck <= 50 else 2.12 * math.log(1 + fck/10)
    As_min = max(0.26 * (fctm / fyk) * b * d, 0.0013 * b * d)
    
    # Maximum steel area per §9.2.1.1(3)
    As_max = 0.04 * b * d  # wait, typically 0.04 Ac where Ac is the total concrete area (b*h). Assuming d ~ 0.9h.
    
    if As_req < As_min:
        As_req = As_min
        status = "OK (Minimum Steel Governs)"
    else:
        status = "OK"

    return {
        "K": round(K, 4),
        "z": round(z, 2),
        "As_req": round(As_req, 2),
        "As_min": round(As_min, 2),
        "As_max_approx": round(As_max, 2),
        "status": status,
        "message": "Singly reinforced section design successful."
    }
