import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function Header() {
  const [location] = useLocation();
  const params = useParams();
  const [sessionInfo, setSessionInfo] = useState<{id: string} | null>(null);
  
  // Check if we're in a session page
  const isSessionPage = location.startsWith("/session/");
  const sessionId = params?.sessionId;
  
  // Get session info if we're in a session page
  useEffect(() => {
    if (isSessionPage && sessionId) {
      setSessionInfo({ id: sessionId });
    } else {
      setSessionInfo(null);
    }
  }, [isSessionPage, sessionId]);
  
  // Copy session link to clipboard
  const copyInviteLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(`${url} - Join session with code: ${sessionId}`);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary h-6 w-6 mr-2"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
            <path d="M7 7h.01"></path>
            <path d="M17 7h.01"></path>
            <path d="M7 17h.01"></path>
            <path d="M17 17h.01"></path>
          </svg>
          <a href="/" className="text-xl font-bold text-primary">Scrum Poker</a>
        </div>
        
        {sessionInfo && (
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-neutral-500">
              Session: <span className="font-bold text-neutral-700">{sessionInfo.id}</span>
            </span>
            <Button variant="ghost" className="text-primary" onClick={copyInviteLink}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-4 h-4 mr-1"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Copy Invite Link
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
