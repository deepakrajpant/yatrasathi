"""Package source and QA summaries; exclude internal browser screenshots."""
from pathlib import Path
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
destination = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root.parent / "Sajilo-GK.zip"
destination.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for source in sorted(root.rglob("*")):
        if not source.is_file():
            continue
        relative = source.relative_to(root)
        if any(part in {"node_modules", ".git", "__pycache__"} for part in relative.parts):
            continue
        if source.suffix in {".png", ".pyc", ".zip"} or source.name in {"refine.mjs", "inspect-browser.mjs"}:
            continue
        archive.write(source, relative.as_posix())
print(destination)
