from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pdfplumber
import pandas as pd
import io
from database import get_db
from utils import update_database_with_dataframe

update_database_router = APIRouter(
    prefix="/api",
    tags=["update_database"]
)


@update_database_router.post("/update-database")
def update_database(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type")

    try:
        pdf_bytes = file.file.read()
        pdf_file = io.BytesIO(pdf_bytes)

        with pdfplumber.open(pdf_file) as pdf:
            all_tables = []
            print("Extracting data...")
            for page_num, page in enumerate(pdf.pages, start=1):
                tables = page.extract_tables()
                for table in tables:
                    if len(table) < 2:
                        continue  # Skip empty tables
                    # Assuming first row is header
                    df = pd.DataFrame(table[1:], columns=table[0])
                    all_tables.append(df)
        # Combine all dataframes
        print("Combining data...")
        if not all_tables:
            raise HTTPException(
                status_code=400, detail="No tables found in PDF")
        data = pd.concat(all_tables, ignore_index=True)
        # Clean and process data
        data = data.rename(columns=lambda x: x.strip())
        data = data.dropna(subset=['Course'])
        # Process data and store in database
        print("Writing to db...")
        update_database_with_dataframe(data, db)
        return {"message": "Database updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
