import Image from "next/image";

export default function Header({
  title = "PeerMatch",
  subtitle = "Student Collaboration",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="w-full rounded-[30px] bg-white px-8 py-8 shadow-sm shadow-slate-200 backdrop-blur-xl" style={{ minHeight: 179 }}>
      <div className="mx-auto flex h-full w-full max-w-[1120px] flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-[#DEF7EC] shadow-sm">
          <Image src="/logo.png" alt="PeerMatch logo" width={56} height={56} className="h-14 w-14 object-contain" />
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold tracking-tight text-slate-950">{title}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
