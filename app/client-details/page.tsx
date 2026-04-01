"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";

const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"];

export default function ClientDetailsPage() {
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState(yearLevels[0]);
  const [aboutMe, setAboutMe] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(
    "https://api.dicebear.com/7.x/avataaars/svg?seed=ClientDetails"
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Client details submitted:", { course, yearLevel, aboutMe });
  };

  return (
    <div className="min-h-screen bg-[#D8F3E9] px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="rounded-[2rem] bg-white px-6 py-5 shadow-sm shadow-slate-200">
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

        <div className="mx-auto w-full max-w-[1120px]">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-slate-950">Client Details</h1>
            <p className="mt-2 text-sm text-slate-600">Complete your profile to get started</p>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[360px_1fr] lg:items-center">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative h-72 w-72 overflow-hidden rounded-full border-8 border-white bg-slate-100 shadow-[0_25px_70px_rgba(15,23,42,0.16)]">
                <img
                  src={photoPreview}
                  alt="Client profile preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleChoosePhoto}
                className="rounded-full bg-[#FA642C] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(250,100,44,0.2)] hover:bg-[#e05b26]"
              >
                Change Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-sm font-semibold text-slate-700">Client profile</p>
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
                <Button type="submit" className="w-full">Continue</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
