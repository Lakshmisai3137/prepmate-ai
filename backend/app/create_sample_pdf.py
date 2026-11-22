import fitz  # PyMuPDF
from pathlib import Path

def generate_sample_pdf():
    # Target folder: data/documents/
    output_dir = Path("data/documents")
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = output_dir / "os_notes.pdf"

    # Create a new blank PDF
    doc = fitz.open()

    # --- Page 1: Processes and Threads ---
    page1 = doc.new_page()
    text_page1 = (
        "Operating Systems Placement Notes\n\n"
        "1. Process vs Thread\n"
        "A process is an executing program with its own dedicated memory space, address space, "
        "and system resources. Processes have higher overhead and communication between processes "
        "requires Inter-Process Communication (IPC).\n\n"
        "A thread is a lightweight unit of execution within a process. Multiple threads of the "
        "same process share memory, open files, and address space. Context switching between threads "
        "is much faster than between processes.\n\n"
        "Key Differences:\n"
        "- Memory: Processes have independent memory; threads share process memory.\n"
        "- Overhead: Processes have high creation and termination overhead; threads are lightweight.\n"
        "- Communication: Processes need IPC (pipes, sockets); threads communicate directly via shared memory."
    )
    page1.insert_text(fitz.Point(50, 72), text_page1, fontsize=11)

    # --- Page 2: Deadlocks ---
    page2 = doc.new_page()
    text_page2 = (
        "Operating Systems Placement Notes\n\n"
        "2. Deadlocks\n"
        "A deadlock is a situation where a set of processes are blocked because each process is "
        "holding a resource and waiting for another resource held by some other process.\n\n"
        "The Four Coffman Conditions for Deadlock:\n"
        "1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.\n"
        "2. Hold and Wait: A process must be holding a resource and waiting to acquire additional resources.\n"
        "3. No Preemption: Resources cannot be forcibly taken from a process; they must be released voluntarily.\n"
        "4. Circular Wait: A closed chain of processes exists such that each process holds at least one resource "
        "needed by the next process in the chain.\n\n"
        "Deadlock Handling Strategies:\n"
        "- Deadlock Prevention: Invalidate one of the four Coffman conditions.\n"
        "- Deadlock Avoidance: Banker's Algorithm dynamically checks for a safe state.\n"
        "- Deadlock Detection and Recovery: Allow deadlocks, detect them via resource allocation graphs, and recover."
    )
    page2.insert_text(fitz.Point(50, 72), text_page2, fontsize=11)

    # Save to disk
    doc.save(str(pdf_path))
    doc.close()
    print(f"Sample PDF created successfully at: {pdf_path}")

if __name__ == "__main__":
    generate_sample_pdf()