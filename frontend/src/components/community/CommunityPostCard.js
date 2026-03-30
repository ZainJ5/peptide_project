"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/auth-store";

export default function CommunityPostCard({ post, onUpvote, onDelete, isUpvoting, isDeleting }) {
  const authUser = useAuthStore((state) => state.user);
  const isOwner = authUser && authUser.id === post.author?.id;

  const authorDisplayName = useMemo(() => {
    const first = String(post.author?.firstName || "").trim();
    const last = String(post.author?.lastName || "").trim();

    if (!first && !last) return "User";
    if (!first) return `${last.charAt(0).toUpperCase()}.`;
    if (!last) return first;

    return `${first} ${last.charAt(0).toUpperCase()}.`;
  }, [post.author?.firstName, post.author?.lastName]);

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch (err) {
      return "recently";
    }
  }, [post.createdAt]);

  const avatarInitial = post.author?.firstName ? post.author.firstName[0].toUpperCase() : "U";

  return (
    <Card className="p-5 sm:p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
      {/* Header: Author & Meta */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {post.author?.avatarUrl ? (
            <img src={post.author.avatarUrl} alt="Avatar" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-(--color-primary) to-blue-700 text-sm font-bold text-white shadow-sm">
              {avatarInitial}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {authorDisplayName}
              </span>
              {post.author?.role === "admin" && (
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{timeAgo}</span>
              <span>•</span>
              <span className="font-semibold text-(--color-primary)">{post.peptide?.name || "General"}</span>
            </div>
          </div>
        </div>

        {/* Delete Action (Owner Only) */}
        {isOwner && (
          <button
            onClick={() => onDelete(post.id)}
            disabled={isDeleting}
            className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete Post"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mt-4">
        <h3 className="text-xl font-bold text-slate-900">{post.title}</h3>
        
        {/* Protocol Details summary if available */}
        {(post.doseUsed || post.durationUsed) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm">
            {post.doseUsed && (
              <div className="flex items-center gap-1.5 text-slate-700"><span className="font-semibold text-slate-500">Dose:</span> {post.doseUsed}</div>
            )}
            {post.durationUsed && (
              <div className="flex items-center gap-1.5 text-slate-700"><span className="font-semibold text-slate-500">Duration:</span> {post.durationUsed}</div>
            )}
          </div>
        )}

        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-600 text-sm sm:text-base">
          {post.content}
        </p>
      </div>

      {/* Tags */}
      {(post.benefitsTags?.length > 0 || post.sideEffectsTags?.length > 0) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {(post.benefitsTags || []).map((tag, idx) => (
            <span key={`ben-${idx}`} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              {tag}
            </span>
          ))}
          {(post.sideEffectsTags || []).map((tag, idx) => (
            <span key={`se-${idx}`} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Engagement Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <button
          onClick={() => onUpvote(post.id, post.hasUpvoted)}
          disabled={isUpvoting || !authUser}
          className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
            post.hasUpvoted 
              ? "bg-blue-50 text-(--color-primary)" 
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <svg className={`h-5 w-5 transition-transform group-hover:scale-110 group-active:scale-95 ${post.hasUpvoted ? "fill-(--color-primary)" : "fill-transparent"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
          </svg>
          {post.upvotes || 0}
        </button>

        {!authUser && (
          <span className="text-xs text-slate-400">Log in to interact</span>
        )}
      </div>
    </Card>
  );
}
