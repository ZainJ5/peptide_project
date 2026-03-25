"use client";

import Button from "@/components/ui/Button";

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={!isDeleting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-center align-middle shadow-2xl transition-all animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-5">
          <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Discussion?</h3>
        <p className="text-sm text-slate-500 mb-8 whitespace-pre-wrap leading-relaxed">
          Are you sure you want to permanently delete this post? This action cannot be undone and all engagement data will be lost.
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting} className="w-full sm:w-1/2">
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isDeleting} 
            className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 ring-red-600 focus:ring-red-600 border-transparent"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
