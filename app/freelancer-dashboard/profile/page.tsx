"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Camera, Edit3, Plus, Star, Trash2 } from "lucide-react";
import { ApiError, apiGetJson, apiPutJson } from "@/app/lib/api";

type LanguageItem = { name: string; proficiency: string };
type PortfolioItem = { title: string; description: string };
type ReviewItem = { reviewer: string; text: string; rating: number };

type ProfileData = {
  name: string;
  email: string;
  course: string;
  yearLevel: string;
  headline: string;
  location: string;
  bio: string;
  featuredWork: string;
  availabilityLabel: string;
  availabilityHours: string;
  sessions: number;
  successRate: number;
  responseTime: string;
  skills: string[];
  languages: LanguageItem[];
  portfolio: PortfolioItem[];
  reviews: ReviewItem[];
  photoDataUrl: string;
};

type ProfileResponse = { profile: Partial<ProfileData> };

const defaultProfile: ProfileData = {
  name: "",
  email: "",
  course: "BS Tourism Management",
  yearLevel: "2nd Year",
  headline: "Computer Science Student",
  location: "San Francisco, CA",
  bio: "Passionate about web development and helping peers master DSA. I love mentoring first-year students through their coding journey.",
  featuredWork: "",
  availabilityLabel: "Active Now",
  availabilityHours: "Mon - Fri, 5:00 PM - 9:00 PM",
  sessions: 24,
  successRate: 98,
  responseTime: "2 hrs",
  skills: ["JavaScript", "React", "Data Structures", "Problem Solving"],
  languages: [
    { name: "English", proficiency: "Fluent" },
    { name: "Spanish", proficiency: "Fluent" },
    { name: "Tagalog", proficiency: "Fluent" },
  ],
  portfolio: [
    { title: "Weather App", description: "Real-time weather application built with React and OpenWeather API." },
    { title: "Task Manager", description: "Full-stack task management system with user authentication." },
  ],
  reviews: [
    { reviewer: "Alex Chen", text: "Jordan helped me understand recursive algorithms. Great teacher!", rating: 5 },
    { reviewer: "Sam Rodriguez", text: "Very patient and explains concepts clearly. Highly recommend!", rating: 5 },
  ],
  photoDataUrl: "",
};

function mergeProfile(input?: Partial<ProfileData>): ProfileData {
  return {
    ...defaultProfile,
    ...input,
    skills: Array.isArray(input?.skills) ? input.skills.filter(Boolean) : defaultProfile.skills,
    languages: Array.isArray(input?.languages) ? input.languages : defaultProfile.languages,
    portfolio: Array.isArray(input?.portfolio) ? input.portfolio : defaultProfile.portfolio,
    reviews: Array.isArray(input?.reviews) ? input.reviews : defaultProfile.reviews,
  };
}

export default function FreelancerProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [savedSnapshot, setSavedSnapshot] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isDirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify(savedSnapshot), [profile, savedSnapshot]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetJson<ProfileResponse>("/api/auth/profile");
        if (cancelled) return;
        const merged = mergeProfile(res.profile);
        setProfile(merged);
        setSavedSnapshot(merged);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof ApiError ? error.message : "Unable to load profile.";
        setErrorText(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    if (errorText) setErrorText("");
    if (successText) setSuccessText("");
  };

  const addSkill = () => {
    const value = newSkill.trim();
    if (!value || profile.skills.includes(value) || profile.skills.length >= 10) return;
    updateField("skills", [...profile.skills, value]);
    setNewSkill("");
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("photoDataUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    setErrorText("");
    setSuccessText("");
    try {
      const payload = {
        name: profile.name,
        photoDataUrl: profile.photoDataUrl,
        profile: {
          course: profile.course,
          yearLevel: profile.yearLevel,
          headline: profile.headline,
          location: profile.location,
          bio: profile.bio,
          featuredWork: profile.featuredWork,
          availabilityLabel: profile.availabilityLabel,
          availabilityHours: profile.availabilityHours,
          sessions: profile.sessions,
          successRate: profile.successRate,
          responseTime: profile.responseTime,
          skills: profile.skills,
          languages: profile.languages,
          portfolio: profile.portfolio,
          reviews: profile.reviews,
        },
      };
      await apiPutJson("/api/auth/profile", payload);
      setSavedSnapshot(profile);
      setSuccessText("Profile saved successfully.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to save profile.";
      setErrorText(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex h-full items-center justify-center rounded-2xl border border-zinc-100/80 bg-white p-10 shadow-[0_4px_32px_rgba(15,23,42,0.04)]">
        <p className="text-sm text-zinc-500">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="h-full rounded-2xl border border-zinc-200 bg-zinc-100 p-5">
      <div className="grid gap-4 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-zinc-300 bg-[#DDE1E2] p-4">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-24 w-24 overflow-hidden rounded-full border border-zinc-300 bg-[#D5DDDC] text-zinc-700"
            >
              {profile.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoDataUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-semibold">{(profile.name || "CC").split(" ").slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("")}</span>
              )}
              <span className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                <Camera className="h-4 w-4 text-white" />
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700">
              Change photo
            </button>
            <input
              value={profile.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="mt-4 w-full bg-transparent text-center text-[38px] font-semibold leading-tight text-zinc-900 outline-none"
            />
            <p className="text-xs text-zinc-500">{profile.email || "christeljean.canumay@cit.edu"}</p>
            <div className="mt-3 rounded-xl bg-white px-3 py-2 text-center text-sm font-semibold text-[#FA642C]">Verified Peer Match Account</div>
            <input
              value={profile.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="Add location"
              className="mt-4 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm outline-none"
            />
            <p className="mt-2 text-xs text-zinc-600">Response time: {profile.responseTime || "&lt; 1 hour"}</p>
            <p className="mt-1 text-xs text-zinc-600">Member since 2026</p>
          </div>
        </aside>

        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-300 bg-[#DDE1E2] p-4">
            <h2 className="text-4xl font-semibold text-zinc-900">About</h2>
            <div className="mt-3 space-y-3">
              <label className="block text-sm font-semibold text-zinc-700">Full Name</label>
              <input value={profile.name} onChange={(e) => updateField("name", e.target.value)} className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm outline-none" />
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700">Course</label>
                  <input value={profile.course} onChange={(e) => updateField("course", e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700">Year Level</label>
                  <input value={profile.yearLevel} onChange={(e) => updateField("yearLevel", e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <label className="block text-sm font-semibold text-zinc-700">About Me</label>
              <textarea value={profile.bio} onChange={(e) => updateField("bio", e.target.value)} className="min-h-24 w-full rounded-xl border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm outline-none" />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-300 bg-[#DDE1E2] p-4">
            <h2 className="text-4xl font-semibold text-zinc-900">Featured Work</h2>
            <textarea
              value={profile.featuredWork}
              onChange={(e) => updateField("featuredWork", e.target.value)}
              placeholder="Showcase highlights of your best work..."
              className="mt-3 min-h-20 w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-100 px-3 py-2 text-sm outline-none"
            />
          </section>

          <section className="rounded-2xl border border-zinc-300 bg-[#DDE1E2] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-4xl font-semibold text-zinc-900">Skills &amp; Expertise</h2>
            <Edit3 className="h-4 w-4 text-[#0069A8]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span key={`${skill}-${index}`} className="inline-flex items-center gap-2 rounded-md border border-[#C8D3EB] bg-[#F3F6FD] px-2 py-1 text-[11px] text-[#355D9A]">
                {skill}
                <button type="button" onClick={() => updateField("skills", profile.skills.filter((_, i) => i !== index))}>
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill" className="w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm outline-none focus:border-[#FA642C]/60" />
            <button type="button" onClick={addSkill} className="inline-flex items-center gap-1 rounded-md bg-[#0069A8] px-3 py-2 text-xs font-semibold text-white">
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          </section>

          <section className="rounded-2xl border border-zinc-300 bg-[#DDE1E2] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-4xl font-semibold text-zinc-900">Languages</h2>
            <Edit3 className="h-4 w-4 text-[#0069A8]" />
          </div>
          <div className="space-y-2">
            {profile.languages.map((item, index) => (
              <div key={`lang-${index}`} className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2">
                <input value={item.name} onChange={(e) => updateField("languages", profile.languages.map((x, i) => (i === index ? { ...x, name: e.target.value } : x)))} className="w-full outline-none" />
                <input value={item.proficiency} onChange={(e) => updateField("languages", profile.languages.map((x, i) => (i === index ? { ...x, proficiency: e.target.value } : x)))} className="w-24 rounded border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs" />
              </div>
            ))}
          </div>
          </section>

          <section className="rounded-2xl border border-zinc-300 bg-[#DDE1E2] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-4xl font-semibold text-zinc-900">Portfolio</h2>
            <button type="button" onClick={() => updateField("portfolio", [...profile.portfolio, { title: "", description: "" }])} className="text-xs font-semibold text-[#0069A8]">Add Project</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {profile.portfolio.map((project, index) => (
              <div key={`portfolio-${index}`} className="space-y-2 rounded-md border border-zinc-300 bg-white p-3">
                <input value={project.title} onChange={(e) => updateField("portfolio", profile.portfolio.map((x, i) => (i === index ? { ...x, title: e.target.value } : x)))} className="w-full text-sm font-semibold outline-none" />
                <textarea value={project.description} onChange={(e) => updateField("portfolio", profile.portfolio.map((x, i) => (i === index ? { ...x, description: e.target.value } : x)))} className="min-h-14 w-full text-xs text-zinc-600 outline-none" />
              </div>
            ))}
          </div>
          </section>

          <section className="rounded-2xl border border-zinc-300 bg-[#DDE1E2] p-4">
          <h2 className="mb-3 text-4xl font-semibold text-zinc-900">Recent Reviews</h2>
          <div className="space-y-3">
            {profile.reviews.map((review, index) => (
              <div key={`review-${index}`} className="rounded-md border border-zinc-300 bg-white p-3">
                <div className="flex items-center justify-between">
                  <input value={review.reviewer} onChange={(e) => updateField("reviews", profile.reviews.map((x, i) => (i === index ? { ...x, reviewer: e.target.value } : x)))} className="text-sm font-semibold outline-none" />
                  <div className="flex items-center gap-1 text-[#FA642C]">
                    {Array.from({ length: 5 }).map((_, sIndex) => (
                      <button key={`${index}-star-${sIndex}`} type="button" onClick={() => updateField("reviews", profile.reviews.map((x, i) => (i === index ? { ...x, rating: sIndex + 1 } : x)))}><Star className={`h-3.5 w-3.5 ${sIndex < review.rating ? "fill-current" : ""}`} /></button>
                    ))}
                  </div>
                </div>
                <textarea value={review.text} onChange={(e) => updateField("reviews", profile.reviews.map((x, i) => (i === index ? { ...x, text: e.target.value } : x)))} className="mt-2 min-h-12 w-full text-xs text-zinc-600 outline-none" />
              </div>
            ))}
          </div>
          </section>

          <section className="rounded-2xl border border-zinc-300 bg-[#DDE1E2] p-4">
            <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-3">
              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between">
                  <span className="text-zinc-600">Availability</span>
                  <input value={profile.availabilityLabel} onChange={(e) => updateField("availabilityLabel", e.target.value)} className="w-32 rounded border border-zinc-300 bg-white px-2 py-1 text-right" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-zinc-600">Hours</span>
                  <input value={profile.availabilityHours} onChange={(e) => updateField("availabilityHours", e.target.value)} className="w-48 rounded border border-zinc-300 bg-white px-2 py-1 text-right" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-zinc-600">Sessions</span>
                  <input type="number" value={profile.sessions} onChange={(e) => updateField("sessions", Number(e.target.value || 0))} className="w-16 rounded border border-zinc-300 bg-white px-2 py-1 text-right" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-zinc-600">Success Rate</span>
                  <div className="flex items-center gap-1">
                    <input type="number" value={profile.successRate} onChange={(e) => updateField("successRate", Number(e.target.value || 0))} className="w-16 rounded border border-zinc-300 bg-white px-2 py-1 text-right" />
                    <span>%</span>
                  </div>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-zinc-600">Response Time</span>
                  <input value={profile.responseTime} onChange={(e) => updateField("responseTime", e.target.value)} className="w-24 rounded border border-zinc-300 bg-white px-2 py-1 text-right" />
                </label>
              </div>
            </div>
          </section>

          <div className="sticky bottom-2 z-10 flex items-center justify-between rounded-lg border border-zinc-300 bg-white p-3">
            <p className={`text-xs ${errorText ? "text-red-600" : "text-zinc-500"}`}>{errorText || successText || "Edit any section and save your changes."}</p>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors ${isDirty ? "bg-[#FA642C] hover:bg-[#e45a25]" : "bg-zinc-800"} disabled:cursor-not-allowed disabled:opacity-95`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
