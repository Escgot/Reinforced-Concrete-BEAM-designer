from pydantic import BaseModel, Field
from typing import Optional

class BeamDesignRequest(BaseModel):
    # Geometry
    b: float = Field(..., gt=0, description="Web width (mm)")
    h: float = Field(..., gt=0, description="Total height (mm)")
    cover: float = Field(..., gt=0, description="Nominal cover to links (mm)")
    span: float = Field(..., gt=0, description="Span length (mm)")
    
    # Material
    fck: float = Field(..., gt=0, description="Concrete compressive strength (MPa)")
    fyk: float = Field(..., gt=0, description="Main reinforcement yield strength (MPa)")
    fywd: float = Field(..., gt=0, description="Shear reinforcement yield strength (MPa)")
    
    # Loading
    MEd: float = Field(..., description="Design bending moment (kNm)")
    VEd: float = Field(..., description="Design shear force (kN)")
    
    # Reinforcement choices
    bar_diameter: float = Field(..., gt=0, description="Main tension bar diameter (mm)")
    link_diameter: float = Field(..., gt=0, description="Shear link diameter (mm)")
    n_bars: int = Field(..., gt=0, description="Number of tension bars")
    n_legs: int = Field(2, gt=0, description="Number of shear link legs")
    
    # Detailing
    wk_limit: float = Field(0.3, description="Crack width limit (mm)")
    k_sys: float = Field(1.0, description="Structural system factor for deflection")

class BeamDesignResponse(BaseModel):
    bending_results: dict
    shear_results: dict
    deflection_results: dict
    cracking_results: dict
    summary: str
