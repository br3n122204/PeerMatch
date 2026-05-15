"use client";

import { useEffect, useState } from "react";
import { getCommunityPosts, subscribeToCommunityPosts, type CommunityPost } from "./postsStorage";

export function useCommunityPosts(): CommunityPost[] {
  const [posts, setPosts] = useState<CommunityPost[]>(() => getCommunityPosts());

  useEffect(() => {
    const refresh = () => setPosts(getCommunityPosts());
    refresh();
    return subscribeToCommunityPosts(refresh);
  }, []);

  return posts;
}
