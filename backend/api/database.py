from sqlalchemy import create_engine, Column, Integer, String, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

default_db = "sqlite:///./rc_designer.db"
if os.getenv("VERCEL"):
    default_db = "sqlite:////tmp/rc_designer.db"

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", default_db)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)

class Beam(Base):
    __tablename__ = "beams"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, index=True)
    name = Column(String, index=True)
    parameters = Column(JSON) # Store all inputs
    results = Column(JSON, nullable=True) # Store results

Base.metadata.create_all(bind=engine)
