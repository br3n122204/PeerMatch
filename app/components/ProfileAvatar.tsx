export default function ProfileAvatar({
  imageSrc = "https://api.dicebear.com/7.x/avataaars/svg?seed=PeerMatch",
  alt = "Profile avatar",
}: {
  imageSrc?: string;
  alt?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-slate-50 px-8 py-8 text-center shadow-sm shadow-slate-200">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <img src={imageSrc} alt={alt} className="h-full w-full object-cover" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">Profile avatar</p>
      </div>
    </div>
  );
}
