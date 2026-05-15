import { apiGetJson } from "./api";
import type { CommunityPost, CommunityPostPriority } from "./postsStorage";

export const POST_REVIEW_MESSAGE = "Your post is under review and waiting for approval.";
export const POST_APPROVED_MESSAGE = "Your post has been approved.";

export const URGENCY_OPTIONS: CommunityPostPriority[] = ["Low", "Normal", "High"];

type ApiFeedPost = CommunityPost & { status?: string };

type FeedResponse = { posts: ApiFeedPost[] };

export function urgencyBadgeClass(priority: CommunityPostPriority): string {
  if (priority === "High") return "bg-[#FF6B35] text-white";
  if (priority === "Low") return "bg-[#A8DADC] text-zinc-900";
  return "bg-[#56BA54] text-zinc-900";
}

export async function fetchApprovedCommunityPosts(): Promise<CommunityPost[]> {
  const data = await apiGetJson<FeedResponse>("/api/tasks");
  return (data.posts || []).map((post) => ({
    id: post.id,
    authorId: post.authorId,
    authorName: post.authorName,
    authorEmail: post.authorEmail,
    authorAccountType: post.authorAccountType,
    authorAvatarDataUrl: post.authorAvatarDataUrl,
    title: post.title,
    content: post.content,
    category: post.category,
    priority: normalizePriority(post.priority),
    createdAt: post.createdAt,
  }));
}

export function normalizePriority(value: string | undefined): CommunityPostPriority {
  const raw = String(value || "Normal").trim().toLowerCase();
  if (raw === "high" || raw === "important") return "High";
  if (raw === "low") return "Low";
  return "Normal";
}
