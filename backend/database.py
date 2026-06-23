from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./invoices.db")
if DATABASE_URL.startswith("postgres"):
    engine = create_engine(DATABASE_URL)
else:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True)
    client_phone = Column(String)
    client_name = Column(String)
    service = Column(String)
    amount = Column(Float)
    status = Column(String, default="pending")
    note = Column(Text, default="")
    pdf_path = Column(String, default="")
    created_at = Column(DateTime, default=datetime.now)
    due_at = Column(DateTime)
    paid_at = Column(DateTime, nullable=True)
    reminder_count = Column(Integer, default=0)
    recurring_days = Column(Integer, nullable=True)
    parent_id = Column(Integer, nullable=True)
    next_id = Column(Integer, nullable=True)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True)
    description = Column(String)
    amount = Column(Float)
    category = Column(String, default="Autre")
    expense_date = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)

Base.metadata.create_all(bind=engine)
