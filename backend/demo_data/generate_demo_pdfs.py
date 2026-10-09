from pathlib import Path

def create_simple_pdf(filename: Path, title: str, sections: list):
    """
    Creates a valid, lightweight PDF file containing research text without external heavy libraries.
    """
    # Stream content
    content_lines = []
    content_lines.append("BT")
    content_lines.append("/F1 18 Tf")
    content_lines.append("50 750 Td")
    content_lines.append(f"({title[:60]}) Tj")
    content_lines.append("/F1 11 Tf")
    content_lines.append("0 -30 Td")
    
    y = 720
    for section_title, text in sections:
        content_lines.append("/F1 13 Tf")
        content_lines.append(f"({section_title}) Tj")
        content_lines.append("0 -18 Td")
        content_lines.append("/F1 10 Tf")
        
        # Word wrap text approx 80 chars
        words = text.split()
        line = ""
        for w in words:
            # Escape parentheses for PDF
            w_esc = w.replace("(", "\\(").replace(")", "\\)")
            if len(line) + len(w_esc) + 1 < 75:
                line += (" " if line else "") + w_esc
            else:
                content_lines.append(f"({line}) Tj")
                content_lines.append("0 -14 Td")
                line = w_esc
        if line:
            content_lines.append(f"({line}) Tj")
            content_lines.append("0 -20 Td")

    content_lines.append("ET")
    stream_data = "\n".join(content_lines).encode("latin-1", "replace")
    stream_len = len(stream_data)

    objects = []
    # 1: Catalog
    objects.append("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    # 2: Pages
    objects.append("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    # 3: Page
    objects.append("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n")
    # 4: Contents stream
    objects.append(f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode("latin-1") + stream_data + b"\nendstream\nendobj\n")
    # 5: Font
    objects.append("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    # Assemble and build xref
    pdf_bytes = bytearray(b"%PDF-1.4\n")
    offsets = []

    for obj in objects:
        offsets.append(len(pdf_bytes))
        if isinstance(obj, str):
            pdf_bytes.extend(obj.encode("latin-1"))
        else:
            pdf_bytes.extend(obj)

    xref_pos = len(pdf_bytes)
    xref = f"xref\n0 {len(offsets) + 1}\n0000000000 65535 f \n"
    for off in offsets:
        xref += f"{off:010d} 00000 n \n"
    pdf_bytes.extend(xref.encode("latin-1"))
    
    trailer = f"trailer\n<< /Size {len(offsets) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n"
    pdf_bytes.extend(trailer.encode("latin-1"))

    with open(filename, "wb") as f:
        f.write(pdf_bytes)

def generate_sample_research_pdfs(target_dir: Path):
    target_dir.mkdir(parents=True, exist_ok=True)

    p1 = target_dir / "Paper_1_Blue_Light_Photobiology.pdf"
    create_simple_pdf(
        p1,
        "Photobiological Suppression of Melatonin by Evening Screen Exposure",
        [
            ("Abstract", "Digital screens emit short-wavelength blue light peaking between 450nm and 480nm. Intrinsically photosensitive retinal ganglion cells transmit these photic signals directly to the suprachiasmatic nucleus. In a randomized controlled trial of 48 participants, two hours of unfiltered evening screen exposure suppressed endogenous salivary melatonin secretion by an average of 54.8 percent."),
            ("Key Findings", "Light emissions above 100 lux caused significant phase delays in circadian timing. Participants wearing amber optical filtering spectacles exhibited preserved melatonin concentrations and normalized nocturnal circadian curves.")
        ]
    )

    p2 = target_dir / "Paper_2_Sleep_Latency_and_Architecture.pdf"
    create_simple_pdf(
        p2,
        "Sleep Architecture Disruption and Prolonged Sleep Latency",
        [
            ("Abstract", "Suppression of nocturnal melatonin directly delays sleep onset latency. Polysomnographic electroencephalography recordings revealed that delayed sleep latency is accompanied by a severe reduction in Stage N3 slow-wave sleep and fragmented rapid eye movement periods."),
            ("Key Findings", "A 40-minute delay in sleep onset latency reduced deep slow-wave delta power by 31 percent. Disrupted sleep architecture resulted in subjective fatigue and elevated morning cortisol levels.")
        ]
    )

    p3 = target_dir / "Paper_3_Sleep_Quality_and_Cognitive_Performance.pdf"
    create_simple_pdf(
        p3,
        "Prefrontal Cortex Activation and Executive Cognitive Performance",
        [
            ("Abstract", "Restorative slow-wave sleep is essential for synaptic homeostasis in the dorsolateral prefrontal cortex. We evaluated working memory, psychomotor vigilance, and executive function in sleep-fragmented subjects."),
            ("Key Findings", "Reduced slow-wave sleep was significantly associated with a 24 percent drop in 2-back working memory accuracy and an increased lapse rate during sustained attention tasks. Restoring regular sleep architecture rescued executive performance.")
        ]
    )

    return [p1, p2, p3]

if __name__ == "__main__":
    generate_sample_research_pdfs(Path("data/demo_pdfs"))
    print("Demo PDFs generated successfully!")
