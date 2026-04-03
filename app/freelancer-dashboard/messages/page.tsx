"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChatLayout } from "@/app/components/chat/ChatLayout";
import { useFreelancerDashboardUser } from "../FreelancerDashboardShell";

function FreelancerMessagesPageContent() {
  const { user } = useFreelancerDashboardUser();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("with") || "";
  const [peerUserId, setPeerUserId] = useState(fromUrl);

  useEffect(() => {
    setPeerUserId(fromUrl);
  }, [fromUrl]);

  if (!user) {
    return null;
  }

  return (
    <main className="flex h-full min-h-[560px] flex-col rounded-2xl border border-zinc-100/80 bg-white shadow-[0_4px_32px_rgba(15,23,42,0.04)]">
      <div className="min-h-0 flex-1 p-0">
        <ChatLayout currentUserId={user.id} initialOtherQuery={peerUserId.trim()} className="h-full" />
      </div>
    </main>
  );
}

export default function FreelancerMessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[400px] items-center justify-center rounded-2xl border border-zinc-100/80 bg-white p-8">
          <p className="text-sm text-zinc-500">Loading messages…</p>
        </main>
      }
    >
      <FreelancerMessagesPageContent />
    </Suspense>
  );
}
