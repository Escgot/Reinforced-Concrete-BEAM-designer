import pytest
from engine.bending import calculate_bending

def test_singly_reinforced_bending():
    # Typical example from Mosley, Bungey & Hulse
    b = 250.0
    d = 450.0
    fck = 25.0
    fyk = 500.0
    MEd = 150.0 # kNm
    
    result = calculate_bending(b, d, fck, fyk, MEd)
    
    assert result["status"] == "OK"
    assert abs(result["K"] - 0.1185) < 0.001
    # K = 150e6 / (250 * 450^2 * 25) = 0.1185 => 0.119
    # z = 450 * (0.5 + sqrt(0.25 - 0.1185/1.134)) = 396.6 mm
    assert 395 <= result["z"] <= 398
    
    # As_req = 150e6 / ((500/1.15) * 396.6) = 870 mm2
    assert 865 <= result["As_req"] <= 875

def test_compression_steel_required():
    b = 250.0
    d = 450.0
    fck = 25.0
    fyk = 500.0
    MEd = 300.0 # Very high moment
    
    result = calculate_bending(b, d, fck, fyk, MEd)
    
    assert result["status"] == "COMPRESSION_STEEL_REQUIRED"

def test_minimum_steel_governs():
    b = 250.0
    d = 450.0
    fck = 25.0
    fyk = 500.0
    MEd = 10.0 # Very small moment
    
    result = calculate_bending(b, d, fck, fyk, MEd)
    
    assert result["status"] == "OK (Minimum Steel Governs)"
    assert result["As_req"] == result["As_min"]
