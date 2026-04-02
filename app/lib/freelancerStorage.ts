const PROFILE_KEY = "peermatch_freelancer_profile";

/**
 * Per-user login count on this browser. Incremented only on successful /login for freelancers.
 * Signup → verify → details → dashboard never hits /login, so count stays 0 until dashboard seeds it.
 */
function loginCountKey(userId: string): string {
  return `peermatch_freelancer_login_count_${userId}`;
}

/** Pins Welcome vs Welcome back for this tab + user so in-app navigation does not flip the message. */
function sessionGreetingModeKey(userId: string): string {
  return `peermatch_freelancer_greeting_mode_${userId}`;
}

export type FreelancerCachedProfile = {
  /** First word only; legacy / internal use */
  firstName: string;
  /** Full name as on the account (e.g. "Christian Paul") for greetings */
  displayName?: string;
  email: string;
  userId?: string;
};

function parseProfile(raw: string | null): FreelancerCachedProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    const firstName = typeof o.firstName === "string" ? o.firstName : "";
    const displayName = typeof o.displayName === "string" ? o.displayName : "";
    const email = typeof o.email === "string" ? o.email : "";
    if (!firstName && !displayName && !email) return null;
    return {
      firstName,
      ...(displayName ? { displayName } : {}),
      email,
      userId: typeof o.userId === "string" ? o.userId : undefined,
    };
  } catch {
    return null;
  }
}

export function getFirstNameFromFullName(fullName: string): string {
  return String(fullName || "")
    .trim()
    .split(/\s+/)[0] || "";
}

export function getCachedFreelancerProfile(): FreelancerCachedProfile | null {
  if (typeof window === "undefined") return null;
  return parseProfile(window.localStorage.getItem(PROFILE_KEY));
}

export function setCachedFreelancerProfile(profile: FreelancerCachedProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/** Login and /me payloads may use `id` or `_id`. */
export function normalizeAuthUser(raw: unknown): { id: string; name: string; email: string } {
  const o = raw as Record<string, unknown>;
  return {
    id: String(o.id ?? o._id ?? ""),
    name: typeof o.name === "string" ? o.name : "",
    email: typeof o.email === "string" ? o.email : "",
  };
}

export function persistFreelancerFromMe(user: { id: string; name: string; email: string }): void {
  const id = String(user.id ?? "");
  const displayName = normalizeGreetingDisplayName(String(user.name || ""));
  const firstName = getFirstNameFromFullName(displayName);
  const prev = getCachedFreelancerProfile();
  if (prev?.userId && prev.userId !== id) {
    setCachedFreelancerProfile({ firstName, displayName, email: user.email, userId: id });
    return;
  }
  setCachedFreelancerProfile({ firstName, displayName, email: user.email, userId: id });
}

export type FreelancerGreetingMode = "welcome" | "welcome_back";

function readSessionGreetingMode(userId: string): FreelancerGreetingMode | null {
  if (typeof window === "undefined") return null;
  const v = window.sessionStorage.getItem(sessionGreetingModeKey(userId));
  if (v === "welcome" || v === "welcome_back") return v;
  return null;
}

function writeSessionGreetingMode(userId: string, mode: FreelancerGreetingMode): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(sessionGreetingModeKey(userId), mode);
}

function getLoginCount(userId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(loginCountKey(userId));
  const n = parseInt(String(raw || "0"), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Call after successful freelancer login (before redirect). First login → welcome; later → welcome back.
 */
export function recordFreelancerLoginForGreeting(userId: string): void {
  if (typeof window === "undefined") return;
  const id = String(userId || "");
  if (!id) return;
  const key = loginCountKey(id);
  const n = getLoginCount(id);
  window.localStorage.setItem(key, String(n + 1));
  clearFreelancerGreetingSession();
  writeSessionGreetingMode(id, n === 0 ? "welcome" : "welcome_back");
}

/**
 * Resolves “Welcome” vs “Welcome back” using login count + session pin.
 * Signup path: login count is 0 until first dashboard visit seeds it to 1 (first time only).
 */
export function resolveFreelancerGreetingMode(userId: string): FreelancerGreetingMode {
  if (typeof window === "undefined") return "welcome";
  const id = String(userId || "");
  if (!id) return "welcome";

  const cached = readSessionGreetingMode(id);
  if (cached) return cached;

  const n = getLoginCount(id);

  if (n === 0) {
    window.localStorage.setItem(loginCountKey(id), "1");
    writeSessionGreetingMode(id, "welcome");
    return "welcome";
  }

  const mode: FreelancerGreetingMode = n >= 2 ? "welcome_back" : "welcome";
  writeSessionGreetingMode(id, mode);
  return mode;
}

/** Clear tab session pins so the next login can re-resolve (same tab). */
export function clearFreelancerGreetingSession(): void {
  if (typeof window === "undefined") return;
  const prefix = "peermatch_freelancer_greeting_mode_";
  const keys: string[] = [];
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i);
    if (k?.startsWith(prefix)) keys.push(k);
  }
  for (const k of keys) window.sessionStorage.removeItem(k);
}

export function emailLocalPart(email: string): string {
  const e = String(email || "").trim();
  if (!e.includes("@")) return "";
  return e.split("@")[0] || "";
}

/** "Christian Paul Christian Paul" → "Christian Paul" (bad first+last signup) */
function dedupeRepeatedHalfName(s: string): string {
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length % 2 !== 0) return s.trim();
  const half = words.length / 2;
  const first = words.slice(0, half).join(" ");
  const second = words.slice(half).join(" ");
  if (first === second) return first;
  return s.trim();
}

/** "Christian Christian Paul" → "Christian Paul" */
function collapseConsecutiveDuplicateWords(s: string): string {
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return s.trim();
  const out: string[] = [];
  for (const w of words) {
    if (out[out.length - 1] !== w) out.push(w);
  }
  return out.join(" ");
}

export function normalizeGreetingDisplayName(raw: string): string {
  let t = String(raw || "").trim().replace(/\s+/g, " ");
  t = dedupeRepeatedHalfName(t);
  t = collapseConsecutiveDuplicateWords(t);
  return t.trim();
}

/**
 * Full registered name for the greeting (e.g. "Christian Paul"), not only the first word.
 * Prefer API `name`, then cached displayName, then legacy firstName, then email local part.
 */
export function resolveFreelancerGreetingDisplayName(user: {
  name?: string | null;
  email?: string | null;
}): string {
  const fromApi = normalizeGreetingDisplayName(String(user?.name || ""));
  if (fromApi) return fromApi;
  const cached = getCachedFreelancerProfile();
  if (cached?.displayName?.trim()) return normalizeGreetingDisplayName(cached.displayName);
  if (cached?.firstName) return normalizeGreetingDisplayName(cached.firstName);
  const email = String(user?.email || cached?.email || "").trim();
  const local = emailLocalPart(email);
  if (local) return local;
  return "";
}

/** @deprecated Use resolveFreelancerGreetingDisplayName — now returns full name, not first word only */
export function resolveFreelancerDisplayFirstName(user: {
  name?: string | null;
  email?: string | null;
}): string {
  return resolveFreelancerGreetingDisplayName(user);
}
