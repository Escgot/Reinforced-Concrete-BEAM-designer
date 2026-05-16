import os
import sys
from fpdf import FPDF

class RCReport(FPDF):
    def header(self):
        self.set_font("helvetica", "B", 16)
        self.cell(0, 10, "Test Report", border=0, align="R")
        self.ln(10)

def test_pdf():
    try:
        pdf = RCReport()
        pdf.add_page()
        pdf.set_font("helvetica", "", 12)
        pdf.cell(0, 10, "Hello World")
        output_path = "test_output.pdf"
        pdf.output(output_path)
        print(f"Successfully generated {output_path}")
        if os.path.exists(output_path):
            os.remove(output_path)
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_pdf()
