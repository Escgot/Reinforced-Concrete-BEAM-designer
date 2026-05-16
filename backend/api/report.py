from xhtml2pdf import pisa
from jinja2 import Environment, FileSystemLoader
import os
import datetime

def generate_pdf_report(req_data: dict, res_data: dict, output_path: str):
    """
    Generates a PDF report using xhtml2pdf and a Jinja2 template.
    """
    template_dir = os.path.dirname(__file__)
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("report_template.html")
    
    # Prepare data for the template
    # Ensure base_dir uses forward slashes for HTML/CSS compatibility
    base_dir = template_dir.replace("\\", "/")
    
    html_content = template.render(
        req_data=req_data,
        res_data=res_data,
        date=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        base_dir=base_dir
    )
    
    # Create the PDF
    with open(output_path, "wb") as f:
        pisa_status = pisa.CreatePDF(html_content, dest=f)
    
    # Return True if successful, False otherwise
    return not pisa_status.err
