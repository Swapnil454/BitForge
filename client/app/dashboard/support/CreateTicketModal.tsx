import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { X, Upload, FileIcon } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CreateTicketModal({ onClose, onSuccess, token }: any) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const [categories, setCategories] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
        if (data.categories?.length > 0) setCategory(data.categories[0].id);
      })
      .catch(err => console.error(err));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !category || (!message.trim() && attachments.length === 0)) return;

    setIsSubmitting(true);
    try {
      let uploadedAttachments: any[] = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fd = new FormData();
          fd.append("attachment", file);
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (res.ok) {
            uploadedAttachments.push(await res.json());
          }
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, category, message, attachments: uploadedAttachments }),
      });

      if (res.ok) {
        toast.success("Ticket created successfully");
        onSuccess();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create ticket");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? "bg-[#111B21] border border-white/10" : "bg-white"}`}>
        <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? "border-white/10" : "border-slate-100"}`}>
          <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>New Support Ticket</h2>
          <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-slate-700"}`}>Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${
                    category === c.id 
                      ? (isDark ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-cyan-50 border-cyan-300 text-cyan-700") 
                      : (isDark ? "bg-transparent border-white/10 text-white/60 hover:bg-white/5" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-slate-700"}`}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              maxLength={150}
              required
              className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors ${
                isDark ? "bg-[#202C33] border-white/10 text-white focus:border-cyan-500" : "bg-white border-slate-200 text-slate-900 focus:border-cyan-500"
              }`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-slate-700"}`}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors resize-none ${
                isDark ? "bg-[#202C33] border-white/10 text-white focus:border-cyan-500" : "bg-white border-slate-200 text-slate-900 focus:border-cyan-500"
              }`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-slate-700"}`}>Attachments (Optional)</label>
            <div className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 ${
              isDark ? "border-white/20 bg-white/5 hover:bg-white/10" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
            }`}>
              <Upload className={`w-6 h-6 ${isDark ? "text-white/40" : "text-slate-400"}`} />
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) setAttachments(Array.from(e.target.files));
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className={`text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}>Click or drag to upload files</span>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {attachments.map((file, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded text-xs ${isDark ? "bg-[#202C33]" : "bg-slate-100"}`}>
                    <span className="truncate flex items-center gap-2"><FileIcon className="w-3 h-3"/> {file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !subject.trim() || !category}
            className={`w-full py-3 rounded-xl font-bold transition-colors mt-2 ${
              isDark ? "bg-cyan-500 text-black hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30" : "bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-slate-200 disabled:text-slate-400"
            }`}
          >
            {isSubmitting ? "Creating..." : "Submit Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
