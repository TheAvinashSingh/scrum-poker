import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ParticipantCard from "@/components/ParticipantCard";
import HostControls from "@/components/HostControls";
import VotingCard from "@/components/VotingCard";
import ResultCard from "@/components/ResultCard";
import { useSessionPolling } from "@/hooks/useSessionPolling";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Session() {
  const { sessionId } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [userInfo, setUserInfo] = useState<{userId: number, isHost: boolean, username: string} | null>(null);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  
  // Get user info from localStorage
  useEffect(() => {
    if (sessionId) {
      const storedUserInfo = localStorage.getItem(`session_${sessionId}`);
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo));
      } else {
        // Redirect to home if user info is not available
        setLocation("/");
        toast({
          title: "Session error",
          description: "You need to join the session first",
          variant: "destructive",
        });
      }
    }
  }, [sessionId, setLocation]);

  // Use polling to get session updates
  const sessionQuery = useSessionPolling(sessionId);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (value: string) => {
      if (!userInfo) throw new Error("User information missing");
      const res = await apiRequest(
        "POST",
        `/api/sessions/${sessionId}/vote?userId=${userInfo.userId}`,
        { value }
      );
      return await res.json();
    },
    onSuccess: () => {
      sessionQuery.refetch();
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded",
      });
    },
    onError: (error) => {
      toast({
        title: "Error submitting vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle voting
  const handleVote = (value: string) => {
    setSelectedValue(value);
    voteMutation.mutate(value);
  };

  // Check if user has already voted
  useEffect(() => {
    if (sessionQuery.data && userInfo) {
      const myParticipant = sessionQuery.data.participants.find(p => p.id === userInfo.userId);
      if (myParticipant?.hasVoted && sessionQuery.data.showResults) {
        setSelectedValue(myParticipant.voteValue || null);
      }
    }
  }, [sessionQuery.data, userInfo]);

  // Copy session link to clipboard
  const copyInviteLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(`${url} - Join session with code: ${sessionId}`);
    toast({
      title: "Invite copied",
      description: "Session invite has been copied to clipboard",
    });
  };

  // Show loading state
  if (sessionQuery.isLoading || !userInfo) {
    return (
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton className="h-20 w-full mb-6" />
        <Skeleton className="h-60 w-full mb-6" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Show error state
  if (sessionQuery.isError) {
    return (
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load session. The session may have expired or been deleted.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setLocation("/")}>Return to Home</Button>
      </div>
    );
  }

  // Variables for session state
  const session = sessionQuery.data;
  const isVotingActive = session.votingActive;
  const isShowingResults = session.showResults;
  const myParticipant = session.participants.find(p => p.id === userInfo.userId);
  const hasVoted = myParticipant?.hasVoted || false;

  // Point values for cards
  const pointValues = ["0", "1", "2", "3", "5", "8", "13", "21", "?"];

  return (
    <main className="flex-grow w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Host Controls */}
        {userInfo.isHost && (
          <HostControls 
            sessionId={sessionId} 
            sessionData={session}
            userId={userInfo.userId}
            onUpdate={sessionQuery.refetch}
          />
        )}

        {/* Session Information for non-hosts */}
        {!userInfo.isHost && (
          <div className="mb-8 bg-white shadow-sm rounded-lg border border-neutral-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-lg font-semibold text-neutral-800">Session: {sessionId}</h2>
                <p className="text-sm text-neutral-500">{session.participants.length} participants connected</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyInviteLink}>
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Copy Invite Link
              </Button>
            </div>
          </div>
        )}

        {/* Participants section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Participants</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {session.participants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                name={participant.username}
                hasVoted={participant.hasVoted}
                voteValue={isShowingResults ? participant.voteValue : undefined}
                isCurrentUser={participant.id === userInfo.userId}
              />
            ))}
          </div>
        </div>

        {/* Results section - only show when results are revealed */}
        {isShowingResults && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Results</h3>
            <div className="bg-white shadow-sm rounded-lg border border-neutral-200 p-6">
              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <h4 className="text-base font-medium text-neutral-600 mb-1">Average Score</h4>
                  <div className="text-3xl font-bold text-neutral-900">{session.average || "N/A"}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-base font-medium text-neutral-600 mb-1">Consensus</h4>
                    <div className="text-3xl font-bold text-neutral-900">{session.consensus || "N/A"}</div>
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-neutral-600 mb-1">Range</h4>
                    <div className="text-3xl font-bold text-neutral-900">{session.range || "N/A"}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {session.participants.filter(p => p.hasVoted).map((participant) => (
                  <ResultCard
                    key={participant.id}
                    name={participant.username}
                    value={participant.voteValue || ""}
                    isCurrentUser={participant.id === userInfo.userId}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Voting Cards */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Your Vote</h3>
          
          {!isVotingActive && !isShowingResults && (
            <Alert className="mb-4">
              <AlertTitle>Waiting for voting to start</AlertTitle>
              <AlertDescription>
                The host will start the voting round soon.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 sm:gap-4">
            {pointValues.map((value) => (
              <VotingCard
                key={value}
                value={value}
                selected={selectedValue === value}
                disabled={!isVotingActive || hasVoted}
                revealed={isShowingResults}
                onClick={() => handleVote(value)}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
