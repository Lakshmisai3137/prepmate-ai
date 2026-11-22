"""Restore the curated study PDFs listed in data/documents/sources.csv."""

import csv
import hashlib
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.request import Request, urlopen

import fitz


DOCUMENTS = Path(__file__).resolve().parents[1] / "data" / "documents"


def restore(entry):
    dest = DOCUMENTS / entry["file"]
    if dest.exists():
        if hashlib.sha256(dest.read_bytes()).hexdigest() != entry["sha256"]:
            raise ValueError(f"{dest.name} differs from the catalog. Your local copy was preserved.")
        return

    request = Request(entry["url"], headers={"User-Agent": "Mozilla/5.0 (PrepMate study notes)"})
    with urlopen(request, timeout=60) as response:
        content = response.read()
    if not content.startswith(b"%PDF") or hashlib.sha256(content).hexdigest() != entry["sha256"]:
        raise ValueError(f"Source changed for {dest.name}. Review the publisher's current PDF.")
    with fitz.open(stream=content, filetype="pdf") as doc:
        if doc.is_repaired or doc.needs_pass or len(doc) != int(entry["pages"]):
            raise ValueError(f"Invalid PDF for {dest.name}")

    dest.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=dest.parent, delete=False) as temp:
        staged = Path(temp.name)
    try:
        staged.write_bytes(content)
        staged.replace(dest)
    finally:
        staged.unlink(missing_ok=True)


if __name__ == "__main__":
    failures = []
    with (DOCUMENTS / "sources.csv").open(encoding="utf-8", newline="") as catalog:
        for entry in csv.DictReader(catalog):
            try:
                restore(entry)
                print(f"Ready: {entry['file']}")
            except (OSError, ValueError, RuntimeError) as exc:
                failures.append(entry["file"])
                print(f"Failed: {entry['file']} ({exc})")
    if failures:
        raise SystemExit(f"Could not restore {len(failures)} PDF(s). See the source catalog.")
