"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApprovedCommunityPosts } from "./communityPosts";
import {
  clearCommunityPostsStorage,
  COMMUNITY_POSTS_CHANGED_EVENT,
  type CommunityPost,
} from "./postsStorage";

type UseCommunityPostsResult = {
  posts: CommunityPost[];
  loading: boolean;
  reload: () => Promise<void>;
};

export function useCommunityPosts(): UseCommunityPostsResult {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const feed = await fetchApprovedCommunityPosts();
      setPosts(feed);
      clearCommunityPostsStorage();
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const onRefresh = () => void reload();
    window.addEventListener(COMMUNITY_POSTS_CHANGED_EVENT, onRefresh);
    return () => window.removeEventListener(COMMUNITY_POSTS_CHANGED_EVENT, onRefresh);
  }, [reload]);

  return { posts, loading, reload };
}
