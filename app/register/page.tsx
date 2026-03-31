"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPostJson, ApiError } from "../lib/api";

type RoleType = "client" | "freelancer";

const clientIcon = (
  <Image
    src="/client-logo.svg"
    alt="Client logo"
    width={28}
    height={28}
    className="h-7 w-7"
  />
);

const roleOptions: Array<{
  key: RoleType;
  title: string;
  subtitle: string;
  icon: ReactNode;
}> = [
  {
    key: "client",
    title: "Client",
    subtitle: "I’m a client, hiring for a task",
    icon: clientIcon,
  },
  {
    key: "freelancer",
    title: "Freelancer",
    subtitle: "I’m a freelancer, looking for work",
    icon: (
      <Image
        src="/freelancer-logo.svg"
        alt="Freelancer logo"
        width={28}
        height={28}
        className="h-7 w-7"
      />
    ),
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"role" | "form">("role");
  const [selectedRole, setSelectedRole] = useState<RoleType | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!firstName || !lastName || !email || !password) {
      setStatusMessage("Please fill in every field.");
      return;
    }

    if (!agreeTerms) {
      setStatusMessage("You must agree to the Terms of Services.");
      return;
    }

    if (!selectedRole) {
      setStatusMessage("Please choose a role before continuing.");
      return;
    }

    const trimmedEmail = email.trim();
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();

    setIsSubmitting(true);
    // Redirect immediately; don't show failure/success messages on this page.
    setStatusMessage("");

    try {
      await apiPostJson<{ message: string; email: string }>("/api/auth/register", {
        name,
        email: trimmedEmail,
        password,
        role: selectedRole,
      });

      router.push(`/verify?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err) {
      setIsSubmitting(false);
      const message = err instanceof ApiError ? err.message : "Registration failed. Please try again.";
      setStatusMessage(message);
    }
  };

  const selectedRoleData = roleOptions.find((option) => option.key === selectedRole);

  return (
    <div className="min-h-screen bg-[#E5F6F4] px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10">
        <div className="ui-page-enter ui-surface flex w-full max-w-xl flex-col items-center justify-center rounded-full bg-white/90 px-6 py-4 shadow-[0_16px_60px_rgba(0,0,0,0.08)]">
          <Image src="/logo.png" alt="PeerMatch logo" width={56} height={56} className="rounded-3xl" />
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-[#0F172A]">PeerMatch</p>
            <p className="text-sm text-zinc-500">Student Collaboration</p>
          </div>
        </div>

        <div className="ui-page-enter ui-surface w-full max-w-xl rounded-[2.5rem] bg-white px-10 py-10 shadow-[0_30px_90px_rgba(0,0,0,0.14)]">
          {stage === "role" ? (
            <>
              <h1 className="text-3xl font-semibold text-[#0F172A]">Join as a client or freelancer</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Choose the role that best fits your needs before continuing with registration.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {roleOptions.map((role) => {
                  const isSelected = selectedRole === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => {
                        setSelectedRole((current) => (current === role.key ? "" : role.key));
                        setStatusMessage("");
                      }}
                      className={`ui-interactive group cursor-pointer flex flex-col justify-between rounded-[2rem] border p-6 text-left motion-safe:transform motion-safe:hover:-translate-y-0.5 ${
                        isSelected
                          ? "border-[#0069A8] bg-[#EBF8FF] shadow-[0_18px_55px_rgba(0,105,168,0.16)] ring-2 ring-[#B8E3FF]"
                          : "border-zinc-200 bg-[#F8FAFC] hover:border-[#0069A8] hover:bg-white hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E5F6F4] text-[#0069A8]">
                          {role.icon}
                        </span>
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                          isSelected
                            ? "border-[#0069A8] bg-[#0069A8] text-white"
                            : "border-zinc-300 text-zinc-500"
                        }`}>
                          {isSelected ? "✓" : ""}
                        </span>
                      </div>
                      <div className="mt-6">
                        <p className="text-xl font-semibold text-[#0F172A]">{role.title}</p>
                        <p className="mt-2 text-sm text-zinc-600">{role.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/login" className="cursor-pointer text-sm font-semibold text-[#0069A8] hover:text-[#004f7d]">
                  Already have an account? Login
                </Link>
                <button
                  type="button"
                  onClick={() => selectedRole && setStage("form")}
                  disabled={!selectedRole}
                  className="ui-interactive inline-flex cursor-pointer items-center justify-center rounded-3xl bg-[#FA642C] px-6 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 hover:bg-[#e05625] motion-safe:hover:-translate-y-0.5"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold text-[#0F172A]">Sign up as a {selectedRoleData?.title}</h1>
                  <p className="mt-2 text-sm text-zinc-600">Complete your account details to get started.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStage("role")}
                  className="ui-interactive cursor-pointer text-sm font-semibold text-[#0069A8] hover:text-[#004f7d] motion-safe:hover:-translate-y-0.5"
                >
                  Change role
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-zinc-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="First Name"
                      className="ui-input w-full rounded-3xl border border-zinc-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0069A8] focus:ring-2 focus:ring-[#66A5CC]/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-zinc-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Last Name"
                      className="ui-input w-full rounded-3xl border border-zinc-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#0069A8] focus:ring-2 focus:ring-[#66A5CC]/30"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700">
                    Institutional Email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 5H20C20.5523 5 21 5.44772 21 6V18C21 18.5523 20.5523 19 20 19H4C3.44772 19 3 18.5523 3 18V6C3 5.44772 3.44772 5 4 5Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 7.5L12 13L21 7.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Institutional Email"
                      className="ui-input w-full rounded-3xl border border-zinc-200 bg-[#F8FAFC] py-4 pl-14 pr-4 text-sm text-[#0F172A] outline-none focus:border-[#0069A8] focus:ring-2 focus:ring-[#66A5CC]/30"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-700">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 11V8C17 5.23858 14.7614 3 12 3C9.23858 3 7 5.23858 7 8V11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 11H19C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      className="ui-input w-full rounded-3xl border border-zinc-200 bg-[#F8FAFC] py-4 pl-14 pr-4 text-sm text-[#0F172A] outline-none focus:border-[#0069A8] focus:ring-2 focus:ring-[#66A5CC]/30"
                    />
                  </div>
                </div>

                {statusMessage ? <p className="text-sm text-red-600 font-medium">{statusMessage}</p> : null}

                <div className="flex items-start gap-3 rounded-3xl border border-zinc-200 bg-[#F8FAFC] p-4">
                  <label className="flex items-center gap-3 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(event) => setAgreeTerms(event.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-[#FA642C] focus:ring-[#FA642C]"
                    />
                    <span>
                      Yes, I understand and agree to the{' '}
                      <a href="#" className="cursor-pointer font-semibold text-[#0069A8] hover:text-[#004f7d]">
                        Terms of Services
                      </a>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ui-interactive cursor-pointer w-full rounded-3xl bg-[#FA642C] py-4 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(250,100,44,0.22)] hover:bg-[#e05625] disabled:cursor-not-allowed disabled:bg-zinc-300 motion-safe:hover:-translate-y-0.5"
                >
                  {isSubmitting ? "Creating..." : "Create account"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-[#0069A8]">
                <Link href="/login" className="ui-interactive font-semibold hover:text-[#004f7d] motion-safe:hover:-translate-y-0.5">
                  Already have an account? Login here
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
