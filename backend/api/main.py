from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from api.models import BeamDesignRequest, BeamDesignResponse, ProjectCreate, ProjectResponse, BeamCreate, BeamResponse
from api.database import SessionLocal, Project, Beam
from engine.bending import calculate_bending
from engine.shear import calculate_shear
from engine.deflection import calculate_deflection
from engine.cracking import calculate_cracking
from api.report import generate_pdf_report
import math
import os

app = FastAPI(title="RC Beam Designer API", description="EN 1992-1-1 Concrete Beam Design")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard bar diameters available
STANDARD_BARS = [8, 10, 12, 16, 20, 25, 32, 40]


def _build_recommendation(req, bending, shear, As_prov, u_bend, u_shear):
    """Build intelligent recommendation with specific bar suggestions."""
    if u_bend <= 1.0 and u_shear <= 1.0:
        efficiency = u_bend * 100
        if efficiency < 50:
            return {
                "action": "OPTIMIZE",
                "text": f"Design is conservative (η={efficiency:.0f}%). Consider reducing reinforcement for economy.",
                "suggestion": None
            }
        return {
            "action": "MAINTAIN",
            "text": f"Maintain current {req.n_bars}-Ø{int(req.bar_diameter)} configuration for optimal efficiency (η={efficiency:.0f}%).",
            "suggestion": None
        }

    # Steel is insufficient — suggest minimum valid configuration
    if u_bend > 1.0 and bending.get("As_req") is not None:
        req_area = bending["As_req"]
        suggestions = []
        for dia in STANDARD_BARS:
            area_per_bar = math.pi * (dia ** 2) / 4.0
            n_needed = math.ceil(req_area / area_per_bar)
            if n_needed <= 8:
                total = n_needed * area_per_bar
                suggestions.append({
                    "n_bars": n_needed,
                    "diameter": dia,
                    "As_prov": round(total, 1),
                    "utilization": round(req_area / total, 3)
                })
        # Pick best: fewest bars with good utilization
        valid = [s for s in suggestions if 0.7 <= s["utilization"] <= 1.0]
        if not valid:
            valid = suggestions
        best = min(valid, key=lambda s: s["n_bars"]) if valid else None

        if best:
            return {
                "action": "INCREASE_STEEL",
                "text": f"Provided steel insufficient. Use {best['n_bars']}-Ø{best['diameter']} (As={best['As_prov']} mm², η={best['utilization']:.0%}).",
                "suggestion": best
            }
        return {
            "action": "INCREASE_SECTION",
            "text": "Section is too small. Increase beam depth or width.",
            "suggestion": None
        }

    if u_shear > 1.0:
        return {
            "action": "INCREASE_SHEAR",
            "text": "Shear capacity exceeded. Decrease link spacing or increase link diameter.",
            "suggestion": None
        }

    return {"action": "REVIEW", "text": "Review serviceability checks.", "suggestion": None}


def _build_formula_steps(req, d, bending, shear, deflection, cracking, As_prov):
    """Build formula trace steps for each design check."""

    bending_steps = [
        {
            "description": "Effective depth",
            "formula": "d = h − c_nom − φ_link − φ_bar/2",
            "substitution": f"d = {req.h} − {req.cover} − {req.link_diameter} − {req.bar_diameter}/2",
            "result": f"{d:.1f} mm"
        },
        {
            "description": "Design concrete strength",
            "formula": "f_cd = α_cc · f_ck / γ_c",
            "substitution": f"f_cd = {req.alpha_cc} × {req.fck} / {req.gamma_c}",
            "result": f"{bending.get('fcd', 0):.2f} MPa"
        },
        {
            "description": "Design steel strength",
            "formula": "f_yd = f_yk / γ_s",
            "substitution": f"f_yd = {req.fyk} / {req.gamma_s}",
            "result": f"{bending.get('fyd', 0):.2f} MPa"
        },
        {
            "description": "K-factor",
            "formula": "K = M_Ed / (b_eff · d² · f_ck)",
            "substitution": f"K = {req.MEd}×10⁶ / ({bending.get('b_eff', req.b)} × {d:.1f}² × {req.fck})",
            "result": f"{bending.get('K', 0):.4f}  (K' = {bending.get('K_limit', 0.167):.3f})"
        },
        {
            "description": "Lever arm",
            "formula": "z = d · (0.5 + √(0.25 − K/1.134))",
            "substitution": f"z = {d:.1f} × (0.5 + √(0.25 − {bending.get('K', 0):.4f}/1.134))",
            "result": f"{bending.get('z', 0):.2f} mm"
        },
        {
            "description": "Required tension steel",
            "formula": "A_s,req = M_Ed / (f_yd · z)",
            "substitution": f"A_s,req = {req.MEd}×10⁶ / ({bending.get('fyd', 0):.2f} × {bending.get('z', 0):.2f})",
            "result": f"{bending.get('As_req', 0):.2f} mm²"
        },
        {
            "description": "Provided tension steel",
            "formula": "A_s,prov = n · π·φ²/4",
            "substitution": f"A_s,prov = {req.n_bars} × π×{req.bar_diameter}²/4",
            "result": f"{As_prov:.2f} mm²"
        },
    ]

    shear_steps = [
        {
            "description": "Size factor",
            "formula": "k = min(2.0, 1 + √(200/d))",
            "substitution": f"k = 1 + √(200/{d:.1f})",
            "result": f"{shear.get('k', 0):.3f}"
        },
        {
            "description": "Concrete shear resistance",
            "formula": "V_Rd,c = [C_Rd,c · k · (100·ρ_l·f_ck)^(1/3)] · b_w · d",
            "substitution": f"ρ_l = {shear.get('rho_l', 0):.5f}",
            "result": f"{shear.get('VRd_c', 0):.2f} kN"
        },
        {
            "description": "Max strut capacity",
            "formula": "V_Rd,max = α_cw·b_w·z·ν₁·f_cd / (cotθ + tanθ)",
            "substitution": f"θ = {shear.get('theta', 0):.1f}°, cotθ = {shear.get('cot_theta', 0):.2f}",
            "result": f"{shear.get('VRd_max', 0):.2f} kN"
        },
        {
            "description": "Required shear reinforcement",
            "formula": "A_sw/s = V_Ed / (z · f_ywd · cotθ)",
            "substitution": f"A_sw/s = {req.VEd}×10³ / ({0.9*d:.1f} × {req.fywd/req.gamma_s:.1f} × {shear.get('cot_theta', 0):.2f})",
            "result": f"{shear.get('Asw_s_final', 0):.3f} mm²/mm"
        },
    ]

    deflection_steps = [
        {
            "description": "Reference reinforcement ratio",
            "formula": "ρ₀ = √f_ck × 10⁻³",
            "substitution": f"ρ₀ = √{req.fck} × 10⁻³",
            "result": f"{deflection.get('rho_0', 0):.5f}"
        },
        {
            "description": "Actual reinforcement ratio",
            "formula": "ρ = A_s,req / (b · d)",
            "substitution": f"ρ = {bending.get('As_req', 0)} / ({req.b} × {d:.1f})",
            "result": f"{deflection.get('rho', 0):.5f}"
        },
        {
            "description": "Basic span/depth ratio",
            "formula": "L/d_basic = K · [11 + 1.5√f_ck·ρ₀/ρ + ...]",
            "substitution": f"K_sys = {req.k_sys}",
            "result": f"{deflection.get('basic_l_d', 0):.2f}"
        },
        {
            "description": "Modification factor",
            "formula": "Factor = (500/f_yk) · (A_s,prov/A_s,req) ≤ 1.5",
            "substitution": f"Factor = (500/{req.fyk}) × ({As_prov:.1f}/{bending.get('As_req', 1):.1f})",
            "result": f"{deflection.get('modification_factor', 0):.3f}"
        },
        {
            "description": "Allowable span/depth",
            "formula": "L/d_allow = L/d_basic × Factor",
            "substitution": f"{deflection.get('basic_l_d', 0):.2f} × {deflection.get('modification_factor', 0):.3f}",
            "result": f"{deflection.get('allowable_l_d', 0):.2f}"
        },
        {
            "description": "Actual span/depth",
            "formula": "L/d_actual = L / d",
            "substitution": f"{req.span} / {d:.1f}",
            "result": f"{deflection.get('actual_l_d', 0):.2f}"
        },
    ]

    cracking_steps = [
        {
            "description": "Estimated steel stress",
            "formula": "σ_s = 310 · (f_yk/500) · (A_s,req/A_s,prov)",
            "substitution": f"σ_s = 310 × ({req.fyk}/500) × ({bending.get('As_req', 0):.1f}/{As_prov:.1f})",
            "result": f"{cracking.get('sigma_s', 0):.1f} MPa"
        },
        {
            "description": "Max allowable spacing",
            "formula": "From Table 7.3N for w_k = {:.1f} mm".format(cracking.get('wk_limit', 0.3)),
            "substitution": f"σ_s = {cracking.get('sigma_s', 0):.1f} MPa → interpolate",
            "result": f"{cracking.get('max_allowable_spacing', 0):.1f} mm"
        },
        {
            "description": "Actual bar spacing",
            "formula": "s = (b − 2c − 2φ_link − n·φ_bar) / (n−1) + φ_bar",
            "substitution": f"n = {req.n_bars}, φ = {req.bar_diameter} mm",
            "result": f"{cracking.get('actual_spacing', 0):.1f} mm"
        },
    ]

    return {
        "bending": bending_steps,
        "shear": shear_steps,
        "deflection": deflection_steps,
        "cracking": cracking_steps
    }


@app.post("/design", response_model=BeamDesignResponse)
def design_beam(req: BeamDesignRequest):
    # Calculate effective depth d
    d = req.h - req.cover - req.link_diameter - (req.bar_diameter / 2.0)
    
    if d <= 0:
        raise HTTPException(status_code=400, detail="Invalid geometry: effective depth <= 0")

    # 1. Bending
    bending = calculate_bending(
        req.b, d, req.fck, req.fyk, req.MEd, 
        bf=req.bf, hf=req.hf, 
        alpha_cc=req.alpha_cc, gamma_c=req.gamma_c, gamma_s=req.gamma_s
    )
    
    # Calculate provided steel
    area_per_bar = math.pi * (req.bar_diameter**2) / 4.0
    As_prov = req.n_bars * area_per_bar
    
    # Check if provided steel is enough
    bending["As_provided"] = round(As_prov, 2)
    if bending["As_req"] is not None and As_prov < bending["As_req"]:
        bending["status"] = "FAIL: INSUFFICIENT_STEEL"
        bending["message"] = f"Provided steel ({As_prov:.1f} mm²) < Required ({bending['As_req']:.1f} mm²)"
    
    # Calculate moment capacity MRd
    fyd = bending.get("fyd", req.fyk / req.gamma_s)
    z = bending.get("z", 0.9 * d)
    MRd = As_prov * fyd * z / 1e6 if z else 0
    bending["MRd"] = round(MRd, 2)

    # 2. Shear
    shear = calculate_shear(
        req.b, d, req.fck, req.fywd, req.VEd, As_prov, 
        gamma_c=req.gamma_c, gamma_s=req.gamma_s
    )
    
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
    if req.n_bars > 1:
        clear_spacing = (req.b - 2 * req.cover - 2 * req.link_diameter - req.n_bars * req.bar_diameter) / (req.n_bars - 1)
        actual_bar_spacing = clear_spacing + req.bar_diameter
    else:
        actual_bar_spacing = 0 # N/A
        
    cracking = calculate_cracking(req.fyk, bending.get("As_req", 0), As_prov, actual_bar_spacing, req.bar_diameter, req.wk_limit)
    
    # 5. Utilization Calculations
    # Bending utilization: MEd / MRd
    if MRd > 0:
        u_bend = req.MEd / MRd
    elif bending.get("As_req") is not None and As_prov > 0:
        u_bend = bending["As_req"] / As_prov
    else:
        u_bend = 1.0 if bending.get("As_req") else 0.0
    bending["utilization"] = round(min(u_bend, 9.99), 3)

    # Shear utilization (VRd_max check + reinforcement check)
    u_shear_concrete = req.VEd / shear["VRd_max"] if shear.get("VRd_max") and shear["VRd_max"] > 0 else 1.0
    Asw_s_provided = Asw_provided / shear.get("s_max", 1) if shear.get("s_max") else 0
    u_shear_links = shear.get("Asw_s_req", 0) / Asw_s_provided if Asw_s_provided > 0 else 1.0
    u_shear = max(u_shear_concrete, u_shear_links)
    shear["utilization"] = round(min(u_shear, 9.99), 3)

    # Deflection utilization
    u_deflection = deflection["actual_l_d"] / deflection["allowable_l_d"] if deflection.get("allowable_l_d") and deflection["allowable_l_d"] > 0 else 1.0
    deflection["utilization"] = round(min(u_deflection, 9.99), 3)

    # Cracking utilization
    u_cracking = cracking["actual_spacing"] / cracking["max_allowable_spacing"] if cracking.get("max_allowable_spacing") and cracking["max_allowable_spacing"] > 0 else 1.0
    cracking["utilization"] = round(min(u_cracking, 9.99), 3)

    utilization_max = round(max(u_bend, u_shear, u_deflection, u_cracking), 3)

    # 6. Overall status and recommendation
    overall_status = "PASS"
    summary = "Design successful."
    
    if "FAIL" in bending.get("status", "") or "FAIL" in shear.get("status", "") or deflection["status"] == "FAIL" or cracking["status"] == "FAIL":
        overall_status = "FAIL"
        summary = "Design contains failures. Please review the warnings."

    recommendation = _build_recommendation(req, bending, shear, As_prov, u_bend, u_shear)

    # 7. Formula steps for traceable output
    formula_steps = _build_formula_steps(req, d, bending, shear, deflection, cracking, As_prov)

    return BeamDesignResponse(
        status=overall_status,
        utilization_max=utilization_max,
        effective_depth=round(d, 1),
        bending_results=bending,
        shear_results=shear,
        deflection_results=deflection,
        cracking_results=cracking,
        formula_steps=formula_steps,
        summary=summary,
        recommendation=recommendation
    )

@app.post("/report")
def get_report(req: BeamDesignRequest):
    # Run design
    result = design_beam(req)
    
    # Generate PDF in a temporary file
    import tempfile
    fd, pdf_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    try:
        success = generate_pdf_report(req.model_dump(), result.model_dump(), pdf_path)
        if not success:
            raise Exception("xhtml2pdf failed to generate PDF")
            
        return FileResponse(
            path=pdf_path, 
            filename="RC_Beam_Calculation.pdf", 
            media_type='application/pdf',
            background=None # FileResponse handles cleanup if we use a background task, 
                             # but for simplicity we'll just return it.
                             # Actually, we should ideally delete it after sending.
        )
    except Exception as e:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")


# Database Endpoints
@app.post("/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(name=project.name, description=project.description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/projects", response_model=list[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()

@app.post("/projects/{project_id}/beams", response_model=BeamResponse)
def create_beam(project_id: int, beam: BeamCreate, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    result = design_beam(beam.parameters)
    db_beam = Beam(
        project_id=project_id,
        name=beam.name,
        parameters=beam.parameters.model_dump(),
        results=result.model_dump()
    )
    db.add(db_beam)
    db.commit()
    db.refresh(db_beam)
    return db_beam

@app.get("/projects/{project_id}/beams", response_model=list[BeamResponse])
def get_beams(project_id: int, db: Session = Depends(get_db)):
    return db.query(Beam).filter(Beam.project_id == project_id).all()
