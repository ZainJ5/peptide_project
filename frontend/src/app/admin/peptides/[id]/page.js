"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import { adminRequest } from "@/lib/admin/api";
import PeptideEditor from "@/components/admin/peptide/PeptideEditor";
import { AdminButton, Card, EmptyState, ErrorState, Skeleton } from "@/components/admin/ui";

export default function EditPeptidePage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["admin", "peptide", id],
    queryFn: () => adminRequest(`/peptides/${id}`),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnMount: "always",
    retry: (count, err) => err.status !== 404 && err.status !== 422 && count < 2,
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6"><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (query.isError) {
    const missing = query.error.status === 404 || query.error.status === 422;
    return (
      <Card>
        {missing ? (
          <EmptyState
            icon={FlaskConical}
            title="Peptide not found"
            description="It may have been deleted."
            action={<Link href="/admin/peptides"><AdminButton>Back to peptides</AdminButton></Link>}
          />
        ) : (
          <ErrorState error={query.error} onRetry={query.refetch} />
        )}
      </Card>
    );
  }

  // Keyed by id so navigating between peptides resets editor state.
  return <PeptideEditor key={query.data.data.id} peptide={query.data.data} usage={query.data.usage} />;
}
