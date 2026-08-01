import { useState } from "react";
import { toast } from "sonner";
import { FileDown, FileText, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Markdown } from "@/components/markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";
import { generateStudyPack } from "@/services/aiClient";
import { uid } from "@/services/storage";
import { downloadMarkdown, downloadPdf } from "@/utils/export";
import { STUDY_PACK_SECTIONS, type StudyPack } from "@/types";

const DEFAULT_SECTIONS = [
  "Topic Summary",
  "Detailed Notes",
  "Key Concepts",
  "Important Formulas",
  "MCQs",
  "Flashcards",
  "Quick Revision Sheet",
  "Learning Roadmap",
];

export function StudyPackDialog({
  open,
  onOpenChange,
  topic,
  transcript,
  sessionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  transcript?: string;
  sessionId?: string;
}) {
  const { settings, addStudyPack } = useApp();
  const [selected, setSelected] = useState<string[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<StudyPack | null>(null);

  const toggle = (section: string) =>
    setSelected((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    );

  const generate = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one section");
      return;
    }
    setLoading(true);
    try {
      const markdown = await generateStudyPack({
        topic,
        ...(transcript ? { transcript } : {}),
        sections: selected,
        strictMode: settings.strictMode,
        language: settings.language,
        preferredAI: settings.preferredAI,
      });
      const created: StudyPack = {
        id: uid("pack"),
        title: `Study Pack — ${topic}`,
        topic,
        sections: selected,
        markdown,
        createdAt: new Date().toISOString(),
        ...(sessionId ? { sessionId } : {}),
      };
      addStudyPack(created);
      setPack(created);
      toast.success("Study Pack generated and saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display">Generate Study Pack</DialogTitle>
          <DialogDescription>
            Built from your captured lecture context: <span className="font-medium">{topic}</span>
          </DialogDescription>
        </DialogHeader>

        {pack ? (
          <div className="space-y-3">
            <ScrollArea className="h-[52vh] rounded-2xl border border-border/60 p-4">
              <Markdown>{pack.markdown}</Markdown>
            </ScrollArea>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => downloadPdf(pack.title, pack.markdown)}>
                <FileDown className="size-4" /> Download PDF
              </Button>
              <Button variant="secondary" onClick={() => downloadMarkdown(pack.title, pack.markdown)}>
                <FileText className="size-4" /> Download Markdown
              </Button>
              <Button variant="ghost" onClick={() => setPack(null)}>
                Regenerate with other sections
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-[46vh] pr-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {STUDY_PACK_SECTIONS.map((section) => (
                  <label
                    key={section}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm transition-colors hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={selected.includes(section)}
                      onCheckedChange={() => toggle(section)}
                    />
                    {section}
                  </label>
                ))}
              </div>
            </ScrollArea>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{selected.length} sections selected</p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelected(DEFAULT_SECTIONS)}>
                  Reset
                </Button>
                <Button onClick={generate} disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {loading ? "Generating…" : "Generate Study Pack"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
