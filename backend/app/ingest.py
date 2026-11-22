from pathlib import Path
import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_path: str | Path, subject: str = "General") -> list[dict]:
    """
    Extracts text from each page of a PDF document.
    Tags each page with source, page number, and subject metadata.
    """
    pdf_path = Path(pdf_path)
    
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found at: {pdf_path}")
        
    doc = fitz.open(pdf_path)
    extracted_pages = []
    
    for page_idx, page in enumerate(doc):
        text = page.get_text()
        
        extracted_pages.append({
            "source": pdf_path.name,
            "page_number": page_idx + 1,
            "subject": subject.upper(),
            "text": text.strip()
        })
        
    doc.close()
    return extracted_pages

def load_all_documents(documents_dir: str | Path = "data/documents") -> list[dict]:
    """
    Recursively scans the documents folder, auto-detecting the subject
    from the subfolder name, and extracts pages across all PDFs.
    """
    docs_path = Path(documents_dir)
    all_pages = []
    
    pdf_files = list(docs_path.rglob("*.pdf"))
    print(f"Discovered {len(pdf_files)} PDF file(s) across study folders.")
    
    for pdf in pdf_files:
        # Use subfolder name as subject (e.g., 'os' -> 'OS', 'dbms' -> 'DBMS')
        subject = pdf.parent.name if pdf.parent != docs_path else "General"
        pages = extract_text_from_pdf(pdf, subject=subject)
        all_pages.extend(pages)
        print(f"  -> Extracted {len(pages)} pages from {pdf.name} (Subject: {subject.upper()})")
        
    return all_pages

if __name__ == "__main__":
    pages = load_all_documents()
    print(f"\n--- Total Pages Extracted Across Knowledge Base: {len(pages)} ---")
    for p in pages:
        print(f"[{p['subject']}] {p['source']} (Page {p['page_number']}): {p['text'][:60]}...")