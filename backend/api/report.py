from xhtml2pdf import pisa
from jinja2 import Environment, FileSystemLoader
import datetime
import os

def generate_pdf_report(req_data: dict, res_data: dict, output_path: str):
    # Set up Jinja2 environment
    template_dir = os.path.dirname(os.path.abspath(__file__))
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template('report_template.html')
    
    # Render HTML with data
    date_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    rendered_html = template.render(
        req_data=req_data,
        res_data=res_data,
        date=date_str,
        base_dir=template_dir
    )
    
    # Generate PDF using xhtml2pdf
    with open(output_path, "w+b") as result_file:
        pisa_status = pisa.CreatePDF(
            rendered_html,                # the HTML to convert
            dest=result_file             # file handle to recieve result
        )
    
    return not pisa_status.err
