"use client";

import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { usePeptides, useCreateCommunityPost } from "@/lib/hooks";

export default function CreatePostModal({ isOpen, onClose }) {
  const peptidesQuery = usePeptides({ limit: 100, offset: 0 });
  const createPost = useCreateCommunityPost();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      peptideId: "",
      title: "",
      content: "",
      doseUsed: "",
      durationUsed: "",
      benefitsTags: "",
      sideEffectsTags: "",
    },
  });

  const onSubmit = async (values) => {
    const payload = {
      peptideId: values.peptideId,
      title: values.title,
      content: values.content,
      doseUsed: values.doseUsed,
      durationUsed: values.durationUsed,
      benefitsTags: values.benefitsTags ? values.benefitsTags.split(",").map((item) => item.trim().toLowerCase()) : [],
      sideEffectsTags: values.sideEffectsTags ? values.sideEffectsTags.split(",").map((item) => item.trim().toLowerCase()) : [],
    };

    await createPost.mutateAsync(payload);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left align-middle shadow-2xl transition-all h-auto max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 leading-none">Create a Post</h2>
          <button 
            type="button"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none transition-colors"
            onClick={onClose}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto pr-2 pb-4 flex-1 custom-scrollbar">
          <form id="create-post-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Topic / Peptide</label>
              <Select {...register("peptideId", { required: true })} className="w-full bg-slate-50">
                <option value="">Select peptide</option>
                {(peptidesQuery.data?.data || []).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Title <span className="text-red-500">*</span></label>
              <input 
                {...register("title", { required: true, minLength: 5 })} 
                placeholder="Share your primary observation..." 
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) focus:outline-none transition-all" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Detailed Experience <span className="text-red-500">*</span></label>
              <textarea 
                {...register("content", { required: true, minLength: 10 })} 
                placeholder="Describe your protocol, results, timeline, and subjective experience..." 
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) focus:outline-none transition-all resize-y min-h-[120px]" 
                rows={4} 
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Dose Used <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input {...register("doseUsed")} placeholder="e.g. 250mcg daily" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) focus:outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Duration <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input {...register("durationUsed")} placeholder="e.g. 4 weeks" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) focus:outline-none transition-all" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Benefits <span className="text-slate-400 font-normal">(Comma separated)</span></label>
                <input {...register("benefitsTags")} placeholder="recovery, sleep, joint pain" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) focus:outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Side Effects <span className="text-slate-400 font-normal">(Comma separated)</span></label>
                <input {...register("sideEffectsTags")} placeholder="headache, lethargy" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) focus:outline-none transition-all" />
              </div>
            </div>
          </form>
        </div>

        <div className="mt-6 flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <Button variant="secondary" type="button" onClick={onClose} disabled={createPost.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="create-post-form" disabled={createPost.isPending}>
            {createPost.isPending ? "Publishing..." : "Publish Discussion"}
          </Button>
        </div>

      </div>
    </div>
  );
}
