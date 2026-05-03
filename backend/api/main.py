from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from api.models import BeamDesignRequest, BeamDesignResponse
from engine.bending import calculate_bending
from engine.shear import calculate_shear
from engine.deflection import calculate_deflection
from engine.cracking import calculate_cracking
from api.report import generate_pdf_report
import math
import os

app = FastAPI(title="RC Beam Designer API", description="EN 1992-1-1 Concrete Beam Design")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/design", response_model=BeamDesignResponse)
def design_beam(req: BeamDesignRequest):
    # Calculate effective depth d
    # d = h - cover - link_diameter - bar_diameter/2
    d = req.h - req.cover - req.link_diameter - (req.bar_diameter / 2.0)
    
    if d <= 0:
        raise HTTPException(status_code=400, detail="Invalid geometry: effective depth <= 0")

    # 1. Bending
    bending = calculate_bending(req.b, d, req.fck, req.fyk, req.MEd)
    
    # Calculate provided steel
    area_per_bar = math.pi * (req.bar_diameter**2) / 4.0
    As_prov = req.n_bars * area_per_bar
    
    # Check if provided steel is enough
    bending["As_provided"] = round(As_prov, 2)
    if bending["As_req"] is not None and As_prov < bending["As_req"]:
        bending["status"] = "FAIL: INSUFFICIENT_STEEL"
        bending["message"] = f"Provided steel ({As_prov:.1f} mm2) < Required ({bending['As_req']:.1f} mm2)"
    
    # 2. Shear
    shear = calculate_shear(req.b, d, req.fck, req.fywd, req.VEd, As_prov)
    # Check provided shear links
    area_per_link_leg = math.pi * (req.link_diameter**2) / 4.0
    Asw_provided = req.n_legs * area_per_link_leg
    # We can determine the required spacing
    if shear.get("Asw_s_final"):
        req_spacing = Asw_provided / shear["Asw_s_final"]
        shear["max_spacing_required"] = round(min(req_spacing, shear["s_max"]), 1)
    
    # 3. Deflection
    deflection = calculate_deflection(req.span, d, req.b, req.fck, req.fyk, bending.get("As_req", 0), As_prov, req.k_sys)
    
    # 4. Cracking
    # Calculate bar spacing
    # spacing = (b - 2*cover - 2*link - n*diam) / (n-1)
    if req.n_bars > 1:
        clear_spacing = (req.b - 2 * req.cover - 2 * req.link_diameter - req.n_bars * req.bar_diameter) / (req.n_bars - 1)
        actual_bar_spacing = clear_spacing + req.bar_diameter
    else:
        actual_bar_spacing = 0 # N/A
        
    cracking = calculate_cracking(req.fyk, bending.get("As_req", 0), As_prov, actual_bar_spacing, req.bar_diameter, req.wk_limit)
    
    summary = "Design successful."
    if "FAIL" in bending.get("status", "") or "FAIL" in shear.get("status", "") or deflection["status"] == "FAIL" or cracking["status"] == "FAIL":
        summary = "Design contains failures. Please review the warnings."

    return BeamDesignResponse(
        bending_results=bending,
        shear_results=shear,
        deflection_results=deflection,
        cracking_results=cracking,
        summary=summary
    )

@app.post("/report")
def get_report(req: BeamDesignRequest):
    # Run design
    result = design_beam(req)
    
    # Generate PDF
    pdf_path = "report.pdf"
    generate_pdf_report(req.model_dump(), result.model_dump(), pdf_path)
    
    return FileResponse(path=pdf_path, filename="Calculation_Sheet.pdf", media_type='application/pdf')
