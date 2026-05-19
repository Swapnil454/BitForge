import Image from "next/image";

type Role = "Admin" | "Buyer" | "Seller";

interface BitForgeBrandProps {
  role?: Role;
}

export default function BitForgeBrand({ role }: BitForgeBrandProps) {
  return (
    <div className="flex items-center">
      <Image
        src="/bitforge_logo1.png"
        alt="BitForge logo"
        width={256}
        height={256}
        className="
          h-10 sm:h-20
          w-auto
          object-contain
          drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]
        "
        priority
      />

      <span
        className="
          -ml-3 sm:-ml-6
          text-lg sm:text-3xl
          font-black
          tracking-tight
          text-slate-900 dark:text-white
          leading-tight
          translate-y-[1px]
          pb-[2px]
        "
      >
        BitForge
      </span>

      {/* {role && (
        <span
          className="
            ml-4 mt-2
            text-sm font-bold
            text-slate-500 dark:text-slate-400
          "
        >
          ({role})
        </span>
      )} */}
    </div>
  );
}
