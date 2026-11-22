import sys
from pathlib import Path

def test_environment():
    print("--- PrepMate AI: Environment Check ---")
    print(f"Active Python Version: {sys.version.split()[0]}")
    
    # Check that root folders exist
    root = Path.cwd()
    folders = ["backend", "frontend", "data"]
    
    print(f"Working Directory: {root}")
    all_ok = True
    for folder in folders:
        folder_path = root / folder
        if folder_path.exists():
            print(f"[OK] Directory found: {folder}")
        else:
            print(f"[MISSING] Directory missing: {folder}")
            all_ok = False
            
    if all_ok:
        print("Result: Project structure and environment verified successfully!")
    else:
        print("Result: One or more folders are missing.")

if __name__ == "__main__":
    test_environment()