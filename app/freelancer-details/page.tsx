"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "../components/Button";
import { useRouter } from "next/navigation";
import { apiPostJson, ApiError } from "../lib/api";

const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function FreelancerDetailsPage() {
  const router = useRouter();
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState(yearLevels[0]);
  const [skills, setSkills] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(
    "https://api.dicebear.com/7.x/avataaars/svg?seed=FreelancerDetails"
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    void (async () => {
      setIsSubmitting(true);
      setStatusMessage("");
      try {
        const photoDataUrl = photoFile ? await fileToDataUrl(photoFile) : undefined;
        await apiPostJson("/api/auth/profile", {
          course,
          yearLevel,
          skills,
          aboutMe,
          ...(photoDataUrl ? { photoDataUrl } : {}),
        });
        router.push("/client-home");
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Could not save profile. Please try again.";
        setStatusMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[#D8F3E9] px-0 py-0">
      <div className="w-full rounded-[2rem] bg-white px-6 py-8 shadow-sm shadow-slate-200">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.75rem] bg-[#DEF7EC] shadow-sm">
            <Image src="/logo.png" alt="PeerMatch logo" width={36} height={36} className="h-10 w-10 object-contain" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-2xl font-semibold text-slate-950">PeerMatch</p>
            <p className="text-sm text-slate-500">Student Collaboration</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-6xl px-4 pb-10">
        <div className="w-full max-w-[1120px]">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-slate-950">Freelancer Details</h1>
            <p className="mt-2 text-sm text-slate-600">Complete your profile to get started</p>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[360px_1fr] lg:items-center">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative h-72 w-72 overflow-hidden rounded-full border-8 border-white bg-slate-100 shadow-[0_25px_70px_rgba(15,23,42,0.16)]">
                <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={handleChoosePhoto}
                className="rounded-full bg-[#FA642C] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(250,100,44,0.2)] hover:bg-[#e05b26]"
              >
                Change Photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-[1.5fr_0.8fr]">
                <label className="relative w-full">
                  <span className="sr-only">Course</span>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="Course"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#84CBB2] focus:ring-2 focus:ring-[#D6F3E3]"
                  />
                </label>

                <label className="relative w-full">
                  <span className="sr-only">Year level</span>
                  <select
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#84CBB2] focus:ring-2 focus:ring-[#D6F3E3]"
                  >
                    {yearLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="relative w-full">
                <span className="sr-only">Skills</span>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Skills"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#84CBB2] focus:ring-2 focus:ring-[#D6F3E3]"
                />
              </label>

              <label className="relative w-full">
                <span className="sr-only">About me</span>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="About me"
                  required
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#84CBB2] focus:ring-2 focus:ring-[#D6F3E3]"
                />
              </label>

              <div className="pt-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Saving..." : "Continue"}
                </Button>
                {statusMessage ? (
                  <p className="mt-3 text-center text-sm text-red-600" role="alert">
                    {statusMessage}
                  </p>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
