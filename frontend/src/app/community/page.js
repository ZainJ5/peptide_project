"use client";

import { useMemo, useState } from "react";
import PageTransition from "@/components/shared/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/auth-store";
import { useCommunityPosts, useUpvoteCommunityPost, useDeleteCommunityPost } from "@/lib/hooks";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import CreatePostModal from "@/components/community/CreatePostModal";
import DeleteConfirmModal from "@/components/community/DeleteConfirmModal";

export default function CommunityPage() {
  const authUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "mine"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [filters, setFilters] = useState({ search: "", peptideName: "" });

  const currentFilters = useMemo(() => {
    return {
      ...filters,
      limit: 40,
      offset: 0,
      ...(activeTab === "mine" && authUser ? { authorId: authUser.id } : {})
    };
  }, [filters, activeTab, authUser]);

  const postsQuery = useCommunityPosts(currentFilters);
  const upvoteMutation = useUpvoteCommunityPost();
  const deleteMutation = useDeleteCommunityPost();

  const posts = postsQuery.data?.data || [];

  const handleUpvote = (postId) => {
    if (!authUser) return;
    upvoteMutation.mutate(postId);
  };

  const handleDeleteRequest = (postId) => {
    setPostToDelete(postId);
  };

  const confirmDelete = async () => {
    if (postToDelete) {
      await deleteMutation.mutateAsync(postToDelete);
      setPostToDelete(null);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl pt-4 md:text-3xl font-bold text-slate-900">
              Community Protocol Hub
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Share real-world peptide observations, crowdsource clinical efficacy, and track subjective experiences.
            </p>
          </div>
          {authUser ? (
            <Button size="lg" className="w-full justify-center md:w-auto md:justify-start shrink-0 shadow-md shadow-(--color-primary)/20" onClick={() => setIsModalOpen(true)}>
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Start a Discussion
              </span>
            </Button>
          ) : (
            <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
              Log in to publish and vote
            </div>
          )}
        </div>

        {/* Action Bar (Tabs & Filters) */}
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:sticky sm:top-16 sm:z-30 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Navigation Tabs */}
          <nav className="flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto sm:shrink-0 sm:justify-start sm:bg-white">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 rounded-lg px-3.5 py-2 text-sm font-bold transition-all text-center sm:flex-none sm:px-4 sm:py-1.5 ${
                activeTab === "all" ? "bg-slate-900 text-white shadow-sm sm:bg-white sm:text-slate-900" : "text-slate-500 hover:text-slate-700 hover:bg-white"
              }`}
            >
              All Discussions
            </button>
            {authUser && (
              <button
                onClick={() => setActiveTab("mine")}
                className={`flex-1 rounded-lg px-3.5 py-2 text-sm font-bold transition-all text-center sm:flex-none sm:px-4 sm:py-1.5 ${
                  activeTab === "mine" ? "bg-slate-900 text-white shadow-sm sm:bg-white sm:text-slate-900" : "text-slate-500 hover:text-slate-700 hover:bg-white"
                }`}
              >
                My Posts
              </button>
            )}
          </nav>

          {/* Search Bar */}
          <div className="flex w-full sm:max-w-md relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
              <svg className="h-4 w-4 text-slate-400 group-focus-within:text-(--color-primary) transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              placeholder="Search protocols, peptides, or side effects..."
              value={filters.search}
              onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))}
              className="w-full rounded-xl border border-slate-300/60 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm transition-all focus:border-(--color-primary)/50 focus:ring-4 focus:ring-(--color-primary)/10 outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Main Feed */}
        <div className="space-y-6 pb-16">
          {postsQuery.isLoading ? (
            <div className="flex flex-col items-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-(--color-primary)"></div>
              <p className="mt-4 text-sm font-medium text-slate-400 animate-pulse">Loading discussions...</p>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <CommunityPostCard 
                key={post.id} 
                post={post} 
                onUpvote={handleUpvote}
                onDelete={handleDeleteRequest}
                isUpvoting={upvoteMutation.isPending && upvoteMutation.variables === post.id}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === post.id}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 px-6 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">No discussions found</h3>
              <p className="mt-2 text-sm text-slate-500">
                {activeTab === "mine" ? "You haven't shared any experiences yet." : "Broaden your search criteria or be the pioneer to start a discussion."}
              </p>
            </div>
          )}
        </div>
      </div>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <DeleteConfirmModal 
        isOpen={!!postToDelete} 
        onClose={() => setPostToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </PageTransition>
  );
}
