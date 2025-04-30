import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import CreateSessionModal from "@/components/CreateSessionModal";
import JoinSessionModal from "@/components/JoinSessionModal";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const { toast } = useToast();

  const createSessionMutation = useMutation({
    mutationFn: async (data: { sessionId?: string; username: string }) => {
      const res = await apiRequest("POST", "/api/sessions", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setCreateModalOpen(false);
      setLocation(`/session/${data.session.id}`);
      
      localStorage.setItem(`session_${data.session.id}`, JSON.stringify({
        userId: data.userId,
        isHost: data.isHost,
        username: data.session.participants.find((p: any) => p.id === data.userId)?.username || ""
      }));
      
      toast({
        title: "Session created!",
        description: `Your session code is ${data.session.id}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (data: { sessionId: string; username: string }) => {
      const res = await apiRequest(
        "POST", 
        `/api/sessions/${data.sessionId}/join`, 
        { username: data.username }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      setJoinModalOpen(false);
      setLocation(`/session/${data.session.id}`);
      
      localStorage.setItem(`session_${data.session.id}`, JSON.stringify({
        userId: data.userId,
        isHost: data.isHost,
        username: data.session.participants.find((p: any) => p.id === data.userId)?.username || ""
      }));
      
      toast({
        title: "Joined session!",
        description: `You've joined session ${data.session.id}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error joining session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <main className="flex-grow w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-6">
              Simplify Your Agile Estimation Process
            </h2>
            <p className="text-lg text-neutral-600 mb-8">
              Scrum Poker helps teams estimate work more efficiently by enabling
              anonymous voting. Reduce bias, improve accuracy, and make your
              sprint planning more effective.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
              <Button 
                size="lg" 
                onClick={() => setCreateModalOpen(true)}
                disabled={createSessionMutation.isPending}
              >
                Create New Session
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setJoinModalOpen(true)}
                disabled={joinSessionMutation.isPending}
              >
                Join Session
              </Button>
            </div>
          </div>
          <div className="hidden md:block relative">
            <div className="rounded-lg shadow-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80" 
                alt="Agile team planning session" 
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-5 -right-5 bg-white p-4 rounded-lg shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1591635566278-10dca0ca76ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=150&q=80" 
                alt="Playing cards for scrum poker" 
                className="w-full h-auto rounded"
              />
            </div>
          </div>
        </div>

        <div className="mt-16 py-8 border-t border-neutral-200">
          <h3 className="text-2xl font-semibold text-neutral-800 mb-8 text-center">
            How Scrum Poker Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Create a Session</h4>
              <p className="text-neutral-600">
                Start a new session and invite your team members using the
                generated code.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Vote Together</h4>
              <p className="text-neutral-600">
                Everyone votes on story points anonymously to prevent anchoring
                bias.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M8 12h8" />
                  <path d="M12 8v8" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Reveal & Discuss</h4>
              <p className="text-neutral-600">
                Compare estimates, see the average, and reach consensus as a
                team.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CreateSessionModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen}
        onSubmit={(data) => createSessionMutation.mutate(data)}
        isLoading={createSessionMutation.isPending}
      />

      <JoinSessionModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        onSubmit={(data) => joinSessionMutation.mutate(data)}
        isLoading={joinSessionMutation.isPending}
      />
    </main>
  );
}
