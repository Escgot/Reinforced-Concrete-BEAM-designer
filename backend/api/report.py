from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import datetime

def generate_pdf_report(req_data: dict, res_data: dict, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=1, spaceAfter=20)
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'], spaceBefore=15, spaceAfter=10)
    normal_style = styles['Normal']
    
    elements = []
    
    # Header
    elements.append(Paragraph("Reinforced Concrete Beam Design Calculation", title_style))
    elements.append(Paragraph(f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    elements.append(Paragraph("Design Standard: EN 1992-1-1 (Eurocode 2)", normal_style))
    elements.append(Spacer(1, 20))
    
    # Summary
    status_color = colors.green if "successful" in res_data['summary'] else colors.red
    summary_style = ParagraphStyle('Summary', parent=normal_style, textColor=status_color, fontSize=12, spaceAfter=20)
    elements.append(Paragraph(f"Status: {res_data['summary']}", summary_style))
    
    # 1. Inputs Table
    elements.append(Paragraph("1. Design Inputs", h2_style))
    input_data = [
        ["Parameter", "Value", "Unit"],
        ["Width (b)", str(req_data['b']), "mm"],
        ["Height (h)", str(req_data['h']), "mm"],
        ["Span", str(req_data['span']), "mm"],
        ["Concrete Strength (fck)", str(req_data['fck']), "MPa"],
        ["Steel Strength (fyk)", str(req_data['fyk']), "MPa"],
        ["Design Moment (MEd)", str(req_data['MEd']), "kNm"],
        ["Design Shear (VEd)", str(req_data['VEd']), "kN"]
    ]
    t1 = Table(input_data, colWidths=[200, 100, 100])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(t1)
    
    # 2. Bending Results
    elements.append(Paragraph("2. Bending Design (§6.1)", h2_style))
    b_res = res_data['bending_results']
    b_data = [
        ["Parameter", "Value"],
        ["Status", b_res.get('status', '')],
        ["K factor", str(b_res.get('K', ''))],
        ["Lever arm (z)", f"{b_res.get('z', '')} mm"],
        ["Required Tension Steel (As,req)", f"{b_res.get('As_req', '')} mm2"],
        ["Provided Tension Steel", f"{b_res.get('As_provided', '')} mm2"],
        ["Minimum Steel (As,min)", f"{b_res.get('As_min', '')} mm2"]
    ]
    t2 = Table(b_data, colWidths=[250, 150])
    t2.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 1, colors.black), ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey)]))
    elements.append(t2)
    
    # 3. Shear Results
    elements.append(Paragraph("3. Shear Design (§6.2)", h2_style))
    s_res = res_data['shear_results']
    s_data = [
        ["Parameter", "Value"],
        ["Status", s_res.get('status', '')],
        ["Concrete capacity (VRd,c)", f"{s_res.get('VRd_c', '')} kN"],
        ["Max capacity (VRd,max)", f"{s_res.get('VRd_max', '')} kN"],
        ["Required Asw/s", f"{s_res.get('Asw_s_req', '')} mm2/mm"],
        ["Final Asw/s (incl. min)", f"{s_res.get('Asw_s_final', '')} mm2/mm"],
        ["Max link spacing", f"{s_res.get('max_spacing_required', s_res.get('s_max', ''))} mm"]
    ]
    t3 = Table(s_data, colWidths=[250, 150])
    t3.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 1, colors.black), ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey)]))
    elements.append(t3)
    
    # 4. Deflection
    elements.append(Paragraph("4. Deflection Check (§7.4)", h2_style))
    d_res = res_data['deflection_results']
    d_data = [
        ["Parameter", "Value"],
        ["Status", d_res.get('status', '')],
        ["Actual L/d", str(d_res.get('actual_l_d', ''))],
        ["Allowable L/d", str(d_res.get('allowable_l_d', ''))]
    ]
    t4 = Table(d_data, colWidths=[250, 150])
    t4.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 1, colors.black), ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey)]))
    elements.append(t4)
    
    # 5. Cracking
    elements.append(Paragraph("5. Crack Width Check (§7.3)", h2_style))
    c_res = res_data['cracking_results']
    c_data = [
        ["Parameter", "Value"],
        ["Status", c_res.get('status', '')],
        ["Est. Steel Stress", f"{c_res.get('sigma_s', '')} MPa"],
        ["Actual Bar Spacing", f"{c_res.get('actual_spacing', '')} mm"],
        ["Max Allowable Spacing", f"{c_res.get('max_allowable_spacing', '')} mm"]
    ]
    t5 = Table(c_data, colWidths=[250, 150])
    t5.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 1, colors.black), ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey)]))
    elements.append(t5)
    
    doc.build(elements)
