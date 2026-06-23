from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime, timedelta
from database import SessionLocal, Invoice
from invoice_generator import generate_invoice
import os
import uvicorn

app = FastAPI()
app.mount("/dashboard", StaticFiles(directory="../dashboard", html=True), name="dashboard")
app.mount("/invoices", StaticFiles(directory="../invoices"), name="invoices")

class InvoiceRequest(BaseModel):
    client_phone: str
    client_name: str
    service: str
    amount: float
    note: str = ""
    recurring_days: int | None = None

@app.post("/api/invoice/create")
def create_invoice(req: InvoiceRequest):
    db = SessionLocal()
    try:
        now = datetime.now()
        due = now + timedelta(days=15 if not req.recurring_days else req.recurring_days)
        inv = Invoice(
            client_phone=req.client_phone,
            client_name=req.client_name,
            service=req.service,
            amount=req.amount,
            note=req.note,
            created_at=now,
            due_at=due,
            recurring_days=req.recurring_days,
        )
        db.add(inv)
        db.commit()
        db.refresh(inv)

        pdf = generate_invoice(inv.id, req.client_name, req.client_phone,
            req.service, req.amount,
            now.strftime("%d/%m/%Y"), due.strftime("%d/%m/%Y"))
        inv.pdf_path = pdf
        db.commit()

        return {
            "invoice_id": inv.id, "pdf": pdf,
            "due_at": due.isoformat(),
            "recurring": inv.recurring_days is not None,
            "recurring_days": inv.recurring_days,
        }
    finally:
        db.close()

@app.get("/api/invoice/{invoice_id}")
def get_invoice(invoice_id: int):
    db = SessionLocal()
    try:
        inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not inv:
            raise HTTPException(404, "Invoice not found")
        return {
            "id": inv.id, "client_name": inv.client_name,
            "client_phone": inv.client_phone, "service": inv.service,
            "amount": inv.amount, "status": inv.status,
            "note": inv.note,
            "created_at": inv.created_at.isoformat(),
            "due_at": inv.due_at.isoformat(),
            "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
            "pdf_path": inv.pdf_path,
            "recurring_days": inv.recurring_days,
            "parent_id": inv.parent_id,
            "next_id": inv.next_id,
        }
    finally:
        db.close()

@app.get("/api/invoice/{invoice_id}/pdf")
def download_pdf(invoice_id: int):
    db = SessionLocal()
    try:
        inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not inv or not inv.pdf_path:
            raise HTTPException(404, "PDF not found")
        return FileResponse(inv.pdf_path, media_type="application/pdf",
            filename=f"facture_{inv.id}.pdf")
    finally:
        db.close()

@app.post("/api/invoice/{invoice_id}/pay")
def mark_paid(invoice_id: int):
    db = SessionLocal()
    try:
        inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not inv:
            raise HTTPException(404, "Invoice not found")
        inv.status = "paid"
        inv.paid_at = datetime.now()
        if inv.recurring_days and not inv.next_id:
            now = datetime.now()
            due = now + timedelta(days=inv.recurring_days)
            new_inv = Invoice(
                client_phone=inv.client_phone,
                client_name=inv.client_name,
                service=inv.service,
                amount=inv.amount,
                note=inv.note,
                created_at=now,
                due_at=due,
                recurring_days=inv.recurring_days,
                parent_id=inv.id,
            )
            db.add(new_inv)
            db.flush()
            pdf = generate_invoice(new_inv.id, inv.client_name, inv.client_phone,
                inv.service, inv.amount,
                now.strftime("%d/%m/%Y"), due.strftime("%d/%m/%Y"))
            new_inv.pdf_path = pdf
            inv.next_id = new_inv.id
        db.commit()
        return {"status": "paid", "next_id": inv.next_id}
    finally:
        db.close()

@app.post("/api/invoice/{invoice_id}/remind")
def send_reminder(invoice_id: int):
    db = SessionLocal()
    try:
        inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not inv:
            raise HTTPException(404, "Invoice not found")
        inv.reminder_count += 1
        db.commit()
        return {"reminder_count": inv.reminder_count}
    finally:
        db.close()

@app.get("/api/invoices")
def list_invoices(status: str = None, phone: str = None, recurring: bool = None):
    db = SessionLocal()
    try:
        q = db.query(Invoice)
        if status:
            q = q.filter(Invoice.status == status)
        if phone:
            q = q.filter(Invoice.client_phone == phone)
        if recurring is True:
            q = q.filter(Invoice.recurring_days.isnot(None))
        elif recurring is False:
            q = q.filter(Invoice.recurring_days.is_(None))
        invoices = q.order_by(Invoice.created_at.desc()).all()
        return [{
            "id": i.id, "client_name": i.client_name,
            "client_phone": i.client_phone, "service": i.service,
            "amount": i.amount, "status": i.status,
            "created_at": i.created_at.isoformat(),
            "due_at": i.due_at.isoformat(),
            "recurring_days": i.recurring_days,
            "parent_id": i.parent_id,
            "next_id": i.next_id,
        } for i in invoices]
    finally:
        db.close()

@app.get("/api/stats")
def get_stats():
    db = SessionLocal()
    try:
        total = db.query(Invoice).count()
        paid = db.query(Invoice).filter(Invoice.status == "paid").count()
        pending = db.query(Invoice).filter(Invoice.status == "pending").count()
        recurring = db.query(Invoice).filter(Invoice.recurring_days.isnot(None)).count()
        amounts = db.query(Invoice).all()
        total_amount = sum(i.amount for i in amounts)
        collected = sum(i.amount for i in amounts if i.status == "paid")
        return {
            "total": total, "paid": paid, "pending": pending,
            "recurring": recurring,
            "total_amount": total_amount, "collected": collected,
        }
    finally:
        db.close()

@app.get("/", response_class=HTMLResponse)
def root():
    return """<html><head><meta http-equiv="refresh" content="0;url=/dashboard/index.html"></head></html>"""

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
