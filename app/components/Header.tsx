import Image from "next/image";

export default function Header({
  title = "PeerMatch",
  subtitle = "Student Collaboration",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[1440px] rounded-[30px] bg-white px-6 py-6 shadow-sm shadow-slate-200 backdrop-blur-xl" style={{ height: 179 }}>
      <div className="flex h-full items-center justify-center gap-4">
        <div className="h-[56px] w-[56px]">
            <Image src="/logo.png" alt="PeerMatch logo" width={56} height={56} className="h-full w-full object-contain" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-slate-950">{title}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
