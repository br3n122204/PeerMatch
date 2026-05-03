"use client";

import { useEffect, useMemo, useState } from "react";
import { getCommunityPosts } from "@/app/lib/postsStorage";
import { FREELANCER_OFFERS_STORAGE_KEY, hasFreelancerOfferForPost } from "@/app/lib/freelancerOffersStorage";
import { useFreelancerDashboardUser } from "../FreelancerDashboardShell";
import { FreelancerCommunityPostCard } from "@/app/components/freelancer/FreelancerCommunityPostCard";
import { OfferHelpView } from "@/app/components/freelancer/OfferHelpView";

export default function FreelancerBrowsePage() {
  const { user } = useFreelancerDashboardUser();
  const [posts, setPosts] = useState(() => getCommunityPosts());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [offerSentTick, setOfferSentTick] = useState(0);

  useEffect(() => {
    const loadPosts = () => setPosts(getCommunityPosts());
    loadPosts();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "peermatch_community_posts_v1") loadPosts();
      if (!event.key || event.key === FREELANCER_OFFERS_STORAGE_KEY) setOfferSentTick((n) => n + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (selectedPostId && !posts.some((p) => p.id === selectedPostId)) setSelectedPostId(null);
  }, [posts, selectedPostId]);

  const selectedPost = useMemo(
    () => (selectedPostId ? posts.find((p) => p.id === selectedPostId) ?? null : null),
    [posts, selectedPostId],
  );

  const handleOfferRecorded = () => setOfferSentTick((n) => n + 1);

  const offerSentIds = useMemo(() => {
    const uid = user?.id;
    if (!uid) return new Set<string>();
    return new Set(posts.filter((p) => hasFreelancerOfferForPost(uid, p.id)).map((p) => p.id));
  }, [posts, user?.id, offerSentTick]);

  return (
    <main className="h-full rounded-2xl border border-zinc-100/80 bg-white p-6 shadow-[0_4px_32px_rgba(15,23,42,0.04)] sm:p-8 lg:p-10">
      {selectedPost && user?.id ? (
        <OfferHelpView
          post={selectedPost}
          freelancerId={user.id}
          listTitle="Browse Posts"
          onBackToList={() => setSelectedPostId(null)}
          onOfferSent={handleOfferRecorded}
        />
      ) : (
        <>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Browse Posts</h1>
          <p className="mt-2 text-sm text-zinc-500">Explore posts from the community.</p>
          <div className="mt-6 space-y-4">
            {posts.map((post) => (
              <FreelancerCommunityPostCard
                key={post.id}
                post={post}
                onOpen={() => setSelectedPostId(post.id)}
                offerSent={offerSentIds.has(post.id)}
              />
            ))}
            {posts.length === 0 ? <p className="text-sm text-zinc-500">No posts yet.</p> : null}
          </div>
        </>
      )}
    </main>
  );
}
