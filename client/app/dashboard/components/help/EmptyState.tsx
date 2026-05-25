import { Lock } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

export default function EmptyState() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#0b1016]" : "bg-[#f0f4f8]"}`}>
      
      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center z-10 w-full max-w-md">
        
        {/* Ring Animation Container */}
        <div className="relative flex items-center justify-center w-48 h-48 mb-8">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes breathe {
              0%, 100% { transform: scale(1); opacity: 0.4; }
              50% { transform: scale(1.2); opacity: 0.1; }
            }
            .ring-1-anim { animation: breathe 4s ease-in-out infinite; }
            .ring-2-anim { animation: breathe 4s ease-in-out infinite 1.33s; }
            .ring-3-anim { animation: breathe 4s ease-in-out infinite 2.66s; }
          `}} />
          
          {/* Outer Ring */}
          <div className={`absolute inset-[-10%] rounded-full border-2 ${isDark ? "border-cyan-500/30 bg-cyan-500/5" : "border-cyan-500/20 bg-cyan-500/5"} ring-3-anim`} />
          
          {/* Middle Ring */}
          <div className={`absolute inset-[5%] rounded-full border-2 ${isDark ? "border-cyan-500/50 bg-cyan-500/10" : "border-cyan-500/40 bg-cyan-500/10"} ring-2-anim`} />
          
          {/* Inner Ring */}
          <div className={`absolute inset-[20%] rounded-full border-2 ${isDark ? "border-cyan-500/80 bg-cyan-500/20" : "border-cyan-500/60 bg-cyan-500/10"} ring-1-anim`} />
          
          {/* Inner Circle with Logo */}
          <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl ${isDark ? "bg-[#161b22] shadow-cyan-900/50" : "bg-white shadow-cyan-200/80"}`}>
            {/* Replace with your exact logo path, or fallback to an icon */}
            <Image src="/icon.png" alt="BitForge" width={56} height={56} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div className={`absolute inset-0 flex items-center justify-center font-bold text-xl ${isDark ? "text-white" : "text-slate-800"}`} style={{ display: 'none' }} id="fallback-logo-text">BF</div>
          </div>
        </div>

        {/* Text Section */}
        <h2 className={`text-2xl font-bold tracking-tight mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
          BitForge Support
        </h2>
        
        <p className={`text-[15px] text-center mb-8 px-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Send and receive messages without keeping your phone online.
        </p>

        {/* Animated Dots */}
        <div className="flex items-center gap-1.5 mb-16">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Bottom Encrypted Badge */}
      <div className={`absolute bottom-8 flex items-center gap-1.5 text-xs font-medium ${isDark ? "text-cyan-500/80" : "text-cyan-600/80"}`}>
        <Lock className="w-3.5 h-3.5" />
        <span>End-to-end encrypted</span>
      </div>

      {/* Inject fallback style script just in case the image fails */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('img').forEach(img => {
          img.onerror = function() {
            this.style.display = 'none';
            if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex';
          }
        });
      `}} />
    </div>
  );
}
