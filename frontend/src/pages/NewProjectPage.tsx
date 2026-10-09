import { useState, useRef } from "react";
import { UploadCloud, FileText, X, Sparkles, AlertCircle } from "lucide-react";

interface NewProjectPageProps {
  onSubmit: (data: {
    title: string;
    research_topic: string;
    research_question: string;
    research_area: string;
    files: File[];
  }) => Promise<void>;
  isLoading: boolean;
}

export const NewProjectPage: React.FC<NewProjectPageProps> = ({ onSubmit, isLoading }) => {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [area, setArea] = useState("Neurobiology & Cognitive Science");
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const pdfFiles = Array.from(newFiles).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    setFiles((prev) => [...prev, ...pdfFiles]);
    setErrorMessage("");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic.trim()) {
      setErrorMessage("Please complete the Project Title and Research Topic fields.");
      return;
    }
    if (files.length === 0) {
      setErrorMessage("Please upload at least 1–3 research papers in PDF format.");
      return;
    }

    const finalQuestion = question.trim() || `What are the primary biological, physical, or algorithmic mechanisms and relationships governing ${topic}?`;

    try {
      await onSubmit({
        title,
        research_topic: topic,
        research_question: finalQuestion,
        research_area: area,
        files,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create project and analyze.");
    }
  };

  const fillSampleFields = () => {
    setTitle("Circadian Screen Exposure & Cognitive Dynamics");
    setTopic("Impact of Digital Screen Exposure on Sleep Quality and Cognitive Performance");
    setQuestion("How does nocturnal short-wavelength screen luminescence alter slow-wave sleep architecture and affect next-day prefrontal executive cognition?");
    setArea("Neurobiology & Cognitive Science");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Initiate New Research</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure your inquiry and ingest PDF papers for 4-Agent synthesis</p>
        </div>

        <button
          type="button"
          onClick={fillSampleFields}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
        >
          Auto-fill Sample Query
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Topic & Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Circadian Screen Exposure & Cognitive Dynamics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Research Area *
            </label>
            <input
              type="text"
              required
              list="research-area-suggestions"
              placeholder="e.g., Quantum Computing, Oncology, Robotics, Climate Science..."
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
            <datalist id="research-area-suggestions">
              <option value="Neurobiology & Cognitive Science" />
              <option value="Artificial Intelligence & Machine Learning" />
              <option value="Biomedical Engineering & Genomics" />
              <option value="Materials Science & Nanotechnology" />
              <option value="Quantum Physics & Computing" />
              <option value="Environmental & Climate Dynamics" />
              <option value="Pharmacology & Drug Discovery" />
              <option value="Robotics & Autonomous Systems" />
              <option value="Renewable Energy & Battery Chemistry" />
              <option value="Astrophysics & Space Exploration" />
            </datalist>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["Neurobiology", "AI & Robotics", "Genomics", "Quantum Physics", "Renewable Energy"].map((quickArea) => (
                <button
                  type="button"
                  key={quickArea}
                  onClick={() => setArea(quickArea)}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  +{quickArea}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Research Topic *
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Narrow-spectrum blue light, melatonin synthesis, and prefrontal attention"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Research Question <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            {topic.trim() && (
              <button
                type="button"
                onClick={() => setQuestion(`What are the primary mechanisms, causal relationships, and empirical outcomes governing ${topic}?`)}
                className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Auto-suggest Question
              </button>
            )}
          </div>
          <textarea
            rows={2}
            placeholder="e.g., What biological or physical mechanisms bridge the primary variables to empirical outcomes? (Leave blank to auto-generate)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors leading-relaxed"
          />
        </div>

        {/* PDF Upload Dropzone */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Upload Research Papers (PDFs) *
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{files.length} selected</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileChange(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/70 dark:bg-slate-800/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
            />
            <UploadCloud className="w-9 h-9 text-slate-500 dark:text-slate-400 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
              Drag and drop academic PDF papers here, or click to browse
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Supports research papers in PDF format</p>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Attached Papers ({files.length}):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-slate-400">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-xs bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Ingesting & Analyzing via 4 Agents..." : "Start Analysis"}
          </button>
        </div>
      </form>
    </div>
  );
};
