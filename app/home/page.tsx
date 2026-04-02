import Link from "next/link";

export const metadata = {
  title: "PeerMatch Home",
};

export default function PeerMatchHome() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="ui-page-enter ui-surface w-full max-w-3xl rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-xl shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
              Welcome to PeerMatch
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              Log in or register to continue.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
              Use the links below to access the login and registration pages. The forms include validation and a clean responsive layout.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="ui-interactive inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-100 motion-safe:hover:-translate-y-0.5"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="ui-interactive inline-flex items-center justify-center rounded-2xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-950 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-900 motion-safe:hover:-translate-y-0.5"
              >
                Register
              </Link>
            </div>
          </div>

          <div className="ui-surface rounded-[1.75rem] bg-gradient-to-br from-blue-600 to-violet-600 p-8 text-white shadow-2xl shadow-blue-600/20">
            <h2 className="text-2xl font-semibold">Why create an account?</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7">
              <li>• Save your preferences and profile details</li>
              <li>• Connect with peers faster</li>
              <li>• Access project matching features</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

