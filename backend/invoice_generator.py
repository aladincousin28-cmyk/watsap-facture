import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

GOLD = HexColor("#C9A24C")
DARK = HexColor("#1a1a2e")
WHITE = HexColor("#FFFFFF")
GRAY = HexColor("#888888")
LIGHT_GRAY = HexColor("#f5f5f5")

INVOICES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "invoices")

def generate_invoice(invoice_id, client_name, client_phone, service, amount, created_at, due_at):
    os.makedirs(INVOICES_DIR, exist_ok=True)
    filename = f"facture_{invoice_id}.pdf"
    filepath = os.path.join(INVOICES_DIR, filename)
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4

    c.setFillColor(DARK)
    c.rect(0, height - 120, width, 120, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(40, height - 75, "FACTURE")
    c.setFont("Helvetica", 10)
    c.drawString(40, height - 105, f"Facture #{invoice_id}")

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - 40, height - 60, "Watsap Facture")
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 8)
    c.drawRightString(width - 40, height - 80, "Tunisia")
    c.drawRightString(width - 40, height - 95, f"Date: {created_at}")

    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, height - 160, "Client")
    c.setStrokeColor(DARK)
    c.line(40, height - 168, 250, height - 168)
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#333333"))
    c.drawString(40, height - 185, f"Nom: {client_name}")
    c.drawString(40, height - 200, f"Tel: {client_phone}")

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(DARK)
    c.drawString(300, height - 160, "Détails")
    c.setStrokeColor(DARK)
    c.line(300, height - 168, width - 40, height - 168)

    table_top = height - 220
    c.setFillColor(LIGHT_GRAY)
    c.rect(40, table_top - 20, width - 80, 20, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, table_top - 15, "Service")
    c.drawRightString(width - 130, table_top - 15, "Montant")
    c.setStrokeColor(HexColor("#dddddd"))
    c.line(40, table_top - 20, width - 40, table_top - 20)

    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#333333"))
    c.drawString(50, table_top - 40, service)
    c.drawRightString(width - 130, table_top - 40, f"{amount:.2f} TND")

    c.setStrokeColor(HexColor("#dddddd"))
    c.line(40, table_top - 50, width - 40, table_top - 50)

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(DARK)
    c.drawRightString(width - 130, table_top - 75, "Total:")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(width - 40, table_top - 75, f"{amount:.2f} TND")

    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.line(width - 220, table_top - 82, width - 40, table_top - 82)

    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9)
    c.drawString(40, table_top - 110, f"Date d'échéance: {due_at}")
    c.drawString(40, table_top - 125, "Mode de paiement: Virement bancaire / Flouci / D17")

    c.setFillColor(LIGHT_GRAY)
    c.rect(40, 60, width - 80, 40, fill=1, stroke=0)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    c.drawCentredString(width / 2, 80, "Watsap Facture - Votre facture professionnelle en un clic")
    c.drawCentredString(width / 2, 68, f"Generée le {datetime.now().strftime('%d/%m/%Y %H:%M')}")

    c.save()
    return filepath
