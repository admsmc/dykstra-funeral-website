import { trpc } from "@/lib/trpc-client";
import type { ToastInstance } from "@/components/toast";

export function useInternalNotes(caseId: string, toast: ToastInstance) {
  const query = trpc.note.listByCaseId.useQuery({ caseId });

  const createMutation = trpc.note.create.useMutation({
    onSuccess: () => {
      toast.success("Note added successfully");
      query.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add note");
    },
  });

  const updateMutation = trpc.note.update.useMutation({
    onSuccess: () => {
      toast.success("Note updated successfully");
      query.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update note");
    },
  });

  const deleteMutation = trpc.note.delete.useMutation({
    onSuccess: () => {
      toast.success("Note deleted successfully");
      query.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete note");
    },
  });

  return {
    notes: query.data,
    isLoading: query.isLoading,
    createNote: createMutation.mutate,
    updateNote: updateMutation.mutate,
    deleteNote: deleteMutation.mutate,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
  };
}
