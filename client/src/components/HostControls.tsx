import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SessionResponse } from "@shared/schema";

interface HostControlsProps {
  sessionId: string;
  sessionData: SessionResponse;
  userId: number;
  onUpdate: () => void;
}

export default function HostControls({
  sessionId,
  sessionData,
  userId,
  onUpdate,
}: HostControlsProps) {
  const { toast } = useToast();
  
  const updateSessionMutation = useMutation({
    mutationFn: async (data: { votingActive?: boolean; showResults?: boolean }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/sessions/${sessionId}?userId=${userId}`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startVoting = () => {
    updateSessionMutation.mutate({ votingActive: true, showResults: false });
  };

  const showVotes = () => {
    updateSessionMutation.mutate({ showResults: true });
  };

  const resetVotes = () => {
    updateSessionMutation.mutate({ votingActive: false, showResults: false });
  };

  // Copy session link to clipboard
  const copyInviteLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(`${url} - Join session with code: ${sessionId}`);
    toast({
      title: "Invite copied",
      description: "Session invite has been copied to clipboard",
    });
  };

  return (
    <div className="mb-8 bg-white shadow-sm rounded-lg border border-neutral-200 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <h2 className="text-lg font-semibold text-neutral-800">Session: {sessionId}</h2>
          <p className="text-sm text-neutral-500">{sessionData.participants.length} participants connected</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={startVoting}
            disabled={sessionData.votingActive || updateSessionMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Start Voting
          </Button>
          <Button
            onClick={showVotes}
            disabled={!sessionData.votingActive || sessionData.showResults || updateSessionMutation.isPending}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Show Votes
          </Button>
          <Button
            onClick={resetVotes}
            variant="outline"
            disabled={updateSessionMutation.isPending}
            className="text-neutral-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"></path>
            </svg>
            Reset
          </Button>
          <Button
            onClick={copyInviteLink}
            variant="ghost"
            size="icon"
            className="text-neutral-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span className="sr-only">Copy Invite Link</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
