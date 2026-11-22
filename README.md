# PrepMate AI

PrepMate answers technical and behavioral interview questions from a local library of PDF notes. Select a subject, ask a question, and use the filename and page number beneath the answer to check it against the original material.

## What it does

- **Multi-subject search.** Study operating systems, database systems, networks, algorithms, Java, Python, object-oriented programming and behavioral interviews. **All Subjects** searches the entire library.
- **Metadata filtering.** The PDF's parent folder supplies its subject. Selecting a subject limits the Chroma query before the nearest passages are retrieved.
- **Page-level citations.** Each passage retains its filename and one-based PDF page number. The answer panel shows the retrieved source pages. The model is instructed to acknowledge gaps in the passages.
- **Local and private execution.** The browser calls a loopback FastAPI server. Ollama embeds questions and generates answers locally, Chroma stores vectors on disk with anonymized telemetry disabled, and the UI uses system fonts. Internet access is used during setup for dependencies, models and source PDFs. Inference requires no account or paid API key.

## Architecture

**Document ingestion**

```text
data/documents/<subject>/*.pdf
  --> PyMuPDF extracts text from each page and tags its subject
  --> Python splits pages into 1,000-character chunks with 100-character overlap
  --> Ollama /api/embed embeds batches of up to 50 with nomic-embed-text
  --> Chroma persists vectors, text, source, page_number and subject
      in data/chroma_db/ (collection prepmate_notes, cosine distance)
```

**User query**

```text
React study desk --> FastAPI POST /api/ask --> Ollama embeds question
  --> Chroma searches nearest chunks (optional subject filter, default top_k = 2)
  --> Python builds a prompt from the retrieved text and page references
  --> Ollama /api/generate runs the selected text-generation model
  --> FastAPI returns answer + sources --> React renders answer and citation cards
```

## Stack

| Layer | Technology |
| --- | --- |
| Web client | React, Vite |
| HTTP API | Python 3.12, FastAPI, Uvicorn, HTTPX |
| Extraction and chunking | PyMuPDF and page-preserving Python functions |
| Embeddings and generation | Ollama with `nomic-embed-text` for retrieval and a configurable text-generation model |
| Vector storage | Persistent ChromaDB with cosine similarity |

## Project layout

```text
backend/app/
  ingest.py          # Recursive PDF discovery and page extraction
  chunking.py        # Overlapping chunks and page metadata
  embeddings.py      # Local Ollama embedding client
  vector_db.py       # Chroma collection and batch upserts
  populate_db.py     # Build or refresh the local index
  retrieve.py        # Cosine search with an optional metadata filter
  generator.py       # Retrieved context, local generation and citations
  main.py            # FastAPI endpoints
frontend/
  src/App.jsx        # Subject filters, sample questions and answers
  src/App.css        # Study desk layout
data/
  documents/
    sources.csv      # Original PDF URLs, filenames, page counts and SHA-256 hashes
    os/  dbms/  cn/  dsa/  java/  python/  oop/  hr/
  chroma_db/         # Generated locally
scripts/restore_notes.py
requirements.txt
```

## Study library

The curated library contains 16 PDFs and 620 pages. The four MIT OpenCourseWare DSA lectures are bundled. The restore command below fetches the remaining 12 PDFs from their sources and verifies their checksums. Each document retains its original attribution. The MIT materials are by Erik Demaine, Jason Ku and Justin Solomon, Spring 2020. [MIT OCW terms](https://ocw.mit.edu/terms/) · [Complete source catalog](data/documents/sources.csv)

| Folder | Material | Pages |
| --- | --- | ---: |
| `os/` | A. Sandeep, operating systems lecture notes | 92 |
| `dbms/` | Malla Reddy College of Engineering & Technology, database management systems | 329 |
| `cn/` | Rémi Emonet, network models, application protocols and IP routing | 31 |
| `dsa/` | MIT 6.006, arrays, binary trees, breadth-first search and dynamic programming | 25 |
| `java/` | UC San Diego on Java and the JVM, Cornell on collections, Virginia Tech on threads | 72 |
| `python/` | TechBeamers interview questions on Python data structures, generators, decorators and memory | 9 |
| `oop/` | Gordon College on encapsulation and polymorphism, University of Padua on SOLID | 47 |
| `hr/` | University of Maryland Engineering Career Services, interview questions and worked STAR responses | 15 |

## Run locally

The commands below use PowerShell from the repository root. Install Python 3.12, Node.js 22.12 or later with npm, and Ollama. On macOS or Linux, create the environment with `python3.12 -m venv .venv` and activate it with `source .venv/bin/activate`.

**1. Choose a generation model.** PrepMate can use any local text-generation model that Ollama can serve through its [generate endpoint](https://docs.ollama.com/api/generate). The app was tested end to end with `llama3.1:latest`, which is the default. Switching the generation model reuses the existing PDF index because retrieval uses a separate embedding model, `nomic-embed-text`.

Start the Ollama desktop app, or run `ollama serve` in its own terminal. In the PowerShell terminal where you will start FastAPI, set `PREPMATE_GENERATION_MODEL` to your chosen Ollama tag. The commands below use the tested model.

```powershell
ollama pull nomic-embed-text
$env:PREPMATE_GENERATION_MODEL = "llama3.1:latest"
ollama pull $env:PREPMATE_GENERATION_MODEL
ollama list
```

If FastAPI is already running, restart it from the terminal with the new setting. On macOS or Linux, use `export PREPMATE_GENERATION_MODEL='your-model:tag'` to set the variable.

**2. Install the backend dependencies and restore the notes.**

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts/restore_notes.py
```

To use your own notes, place text-readable PDFs in the appropriate subject folder under `data/documents/`. For example, `data/documents/cn/routing.pdf` is indexed as `CN`. Image-only scans need a searchable text layer. Additional personal PDFs stay out of Git by default.

**3. Build the index, then start the API.** Run these commands from the repository root so the CLI and API use the same storage path.

```powershell
python backend/app/populate_db.py
uvicorn main:app --app-dir backend/app --reload --port 8000
```

Wait for the final chunk count before querying. After changing the PDFs, stop the API, rerun the population command once, and restart the API. A successful refresh removes superseded chunks from this collection. [API health](http://127.0.0.1:8000/) · [Local API schema](http://127.0.0.1:8000/openapi.json)

**4. Start the frontend** in a second terminal.

```powershell
cd frontend
npm ci
npm run dev -- --port 5173 --strictPort
```

Open the study desk, select **CN**, choose the DNS question and submit it. Use the source cards to find the supporting passages in the matching local PDF. [Open the study desk](http://localhost:5173)

## Check the API and frontend

```powershell
Invoke-RestMethod http://127.0.0.1:8000/
$body = @{ question = 'What is DNS?'; subject = 'CN'; top_k = 2 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/ask -ContentType 'application/json' -Body $body
```

Each answer includes a `sources` array with `source`, `page_number` and `subject`. Set `subject` to `$null` in PowerShell or `null` in JSON to search across subjects.

```powershell
python -m pytest backend/app -q
npm --prefix frontend run lint
npm --prefix frontend run build
```
