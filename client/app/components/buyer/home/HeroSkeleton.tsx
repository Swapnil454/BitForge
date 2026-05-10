export default function HeroSkeleton() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
      <div className="w-full rounded-2xl md:rounded-3xl h-[190px] md:h-[240px] lg:h-[320px] bg-gray-200 dark:bg-slate-800 animate-pulse flex items-center shadow-xs">
        <div className="px-8 md:px-16 lg:px-24 flex flex-col justify-center h-full max-w-3xl w-full">
          <div className="w-24 h-6 bg-gray-300 dark:bg-slate-700 rounded-full mb-4"></div>
          <div className="w-3/4 h-8 md:h-12 bg-gray-300 dark:bg-slate-700 rounded-xl mb-4"></div>
          <div className="w-full h-4 md:h-6 bg-gray-300 dark:bg-slate-700 rounded-lg mb-2"></div>
          <div className="w-2/3 h-4 md:h-6 bg-gray-300 dark:bg-slate-700 rounded-lg mb-8"></div>
          <div className="w-32 h-10 md:h-12 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
