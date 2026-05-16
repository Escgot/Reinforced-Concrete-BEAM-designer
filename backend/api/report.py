from xhtml2pdf import pisa
from jinja2 import Environment, FileSystemLoader
import os
import datetime
import base64

def generate_pdf_report(req_data: dict, res_data: dict, output_path: str):
    """
    Generates a PDF report using xhtml2pdf and a Jinja2 template.
    """
    try:
        template_dir = os.path.dirname(__file__)
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template("report_template.html")
        
        # Encode logo to base64 to avoid path issues on Vercel
        logo_path = os.path.join(template_dir, "logo.png")
        logo_base64 = ""
        if os.path.exists(logo_path):
            with open(logo_path, "rb") as image_file:
                logo_base64 = base64.b64encode(image_file.read()).decode('utf-8')
        
        html_content = template.render(
            req_data=req_data,
            res_data=res_data,
            date=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            logo_base64=logo_base64
        )
        
        # Create the PDF
        with open(output_path, "wb") as f:
            pisa_status = pisa.CreatePDF(html_content, dest=f)
        
        return not pisa_status.err
    except Exception as e:
        print(f"Error in generate_pdf_report: {str(e)}")
        raise e

