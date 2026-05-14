import math

def calculate_deflection(span: float, d: float, b: float, fck: float, fyk: float, As_req: float, As_prov: float, K_sys: float = 1.0):
    """
    Simplified span/effective depth check for deflection per EN 1992-1-1 §7.4.2
    
    :param span: Span of the beam (mm)
    :param d: Effective depth (mm)
    :param b: Web width (mm)
    :param fck: Concrete strength (MPa)
    :param fyk: Steel yield strength (MPa)
    :param As_req: Required tension steel (mm2)
    :param As_prov: Provided tension steel (mm2)
    :param K_sys: Structural system factor (e.g., 1.0 for simply supported, 1.3 for continuous, 1.5 for interior span, 0.4 for cantilever)
    :return: dict with deflection results
    """
    actual_l_d = span / d
    
    rho = As_req / (b * d)
    rho_0 = math.sqrt(fck) * 1e-3
    
    if rho <= rho_0:
        basic_l_d = K_sys * (11.0 + 1.5 * math.sqrt(fck) * (rho_0 / rho) + 3.2 * math.sqrt(fck) * ((rho_0 / rho) - 1)**1.5)
    else:
        # Assuming no compression steel (rho_prime = 0)
        basic_l_d = K_sys * (11.0 + 1.5 * math.sqrt(fck) * (rho_0 / rho))
        
    # Stress modification factor (approx 310 / sigma_s)
    # sigma_s approx = 310 * (fyk / 500) * (As_req / As_prov)
    # Factor = 500 / fyk * As_prov / As_req
    factor = (500.0 / fyk) * (As_prov / As_req) if As_req > 0 else 1.0
    
    # Upper limit for factor is 1.5
    factor = min(1.5, factor)
    
    allowable_l_d = basic_l_d * factor
    
    # Additional limit for spans > 7m (except for flat slabs)
    if span > 7000:
        allowable_l_d *= (7000.0 / span)
        
    status = "OK" if actual_l_d <= allowable_l_d else "FAIL"
    
    return {
        "clause": "EN 1992-1-1 §7.4.2",
        "actual_l_d": round(actual_l_d, 2),
        "allowable_l_d": round(allowable_l_d, 2),
        "basic_l_d": round(basic_l_d, 2),
        "rho": round(rho, 5),
        "rho_0": round(rho_0, 5),
        "modification_factor": round(factor, 3),
        "status": status,
        "message": f"Deflection is {'acceptable' if status == 'OK' else 'unacceptable'}. L/d ratio {actual_l_d:.2f} vs allowable {allowable_l_d:.2f}."
    }
