export default function HeroSkeleton() {
  return (
    <div className="relative z-40 md:z-0 w-full mb-0 sm:mb-2 pt-2 md:pt-0 animate-pulse">
      {/* Mobile Search Bar Placeholder */}
      <div className="md:hidden px-4 pb-3 w-full relative z-[100]">
        <div className="w-full h-11 bg-gradient-to-r from-gray-200 to-gray-300 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-2xl shadow-sm" />
      </div>

      {/* Desktop Hero Banner Placeholder */}
      <div className="hidden md:flex relative w-full h-[180px] sm:h-[220px] md:h-[260px] bg-gray-100 dark:bg-[#0f0f11] overflow-hidden">
        <div className="relative z-10 w-full max-w-[1800px] mx-auto h-full flex flex-row items-center justify-center gap-6 lg:gap-10 px-3 md:px-5 lg:px-6">
          
          {/* Left Side Images Placeholder */}
          <div className="hidden md:flex relative z-10 flex-1 h-full items-center justify-end gap-4 px-2">
            <div className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] md:w-[200px] md:h-[200px] bg-gradient-to-r from-gray-200 to-gray-300 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-2xl shadow-sm"></div>
            <div className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] md:w-[200px] md:h-[200px] bg-gradient-to-r from-gray-200 to-gray-300 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-2xl shadow-sm"></div>
          </div>

          {/* Center Content Placeholder */}
          <div className="relative z-20 flex flex-col justify-center items-center h-full shrink-0 max-w-[45%] lg:max-w-[50%]">
            <div className="w-20 h-5 bg-gradient-to-r from-gray-200 to-gray-300 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-full mb-2"></div>
            <div className="w-64 lg:w-80 h-8 lg:h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-xl mb-3"></div>
            <div className="w-48 h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-lg mb-3"></div>
            <div className="w-72 h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-lg mb-4"></div>
            <div className="w-32 h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-full mt-2"></div>
          </div>

          {/* Right Side Image Placeholder */}
          <div className="hidden md:flex relative z-10 flex-1 h-full items-center justify-start px-2">
            <div className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] md:w-[200px] md:h-[200px] bg-gradient-to-r from-gray-200 to-gray-300 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-2xl shadow-sm"></div>
          </div>

        </div>
      </div>

      {/* Mobile Banner Placeholder */}
      <div className="md:hidden w-full relative overflow-hidden pt-0 pb-8 px-4">
        <div className="w-full rounded-[16px] shadow-sm bg-gray-100 dark:bg-[#0f0f11] h-[140px] sm:h-[160px]" />
        
        {/* Mobile Dots Placeholder */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          <div className="w-4 h-1.5 bg-gray-400 dark:bg-purple-900/50 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gradient-to-r dark:from-[#1e1e24] dark:to-[#2a2a33] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
