"""Build the initial searchable page index from the four bundled PDFs.

Requires the system's pdftotext (Poppler). Uploaded replacements are indexed
in the browser and stored by the authenticated server instead.
"""

import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
files = {
    "belgium": "wnv-belgique-25-09-2026.pdf",
    "wnv": "wnv-regions-23-09-2026.pdf",
    "dengue": "dengue-chikungunya-23-09-2026.pdf",
    "travel": "voyages-risques-v6.pdf",
}

index = {}
for key, filename in files.items():
    pdf = root / "public" / "documents" / filename
    text = subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"]).decode("utf-8")
    pages = [page.strip() for page in text.split("\f") if page.strip()]
    if not pages:
        raise ValueError(f"No selectable text in {pdf}")
    index[key] = pages

output = root / "src" / "document-index.json"
output.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Indexed " + ", ".join(f"{key}: {len(pages)} pages" for key, pages in index.items()))
