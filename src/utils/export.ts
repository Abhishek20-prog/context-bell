import jsPDF from "jspdf";

export function downloadMarkdown(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, `${slug(filename)}.md`);
}

export function downloadPdf(title: string, markdown: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, y);
  y += 26;

  const lines = markdown.split("\n");
  for (const raw of lines) {
    const line = raw.replace(/\*\*/g, "").replace(/`/g, "");
    const heading = /^#{1,3}\s/.test(line);
    doc.setFont("helvetica", heading ? "bold" : "normal");
    doc.setFontSize(heading ? 13 : 10.5);
    const text = line.replace(/^#{1,6}\s/, "");
    const wrapped = doc.splitTextToSize(text || " ", width) as string[];
    for (const w of wrapped) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(w, margin, y);
      y += heading ? 18 : 14;
    }
    if (heading) y += 4;
  }

  doc.save(`${slug(title)}.pdf`);
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "contextbell"
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
