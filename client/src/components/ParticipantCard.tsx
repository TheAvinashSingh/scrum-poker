interface ParticipantCardProps {
  name: string;
  hasVoted: boolean;
  voteValue?: string;
  isCurrentUser?: boolean;
}

export default function ParticipantCard({
  name,
  hasVoted,
  voteValue,
  isCurrentUser = false,
}: ParticipantCardProps) {
  // Get initials for avatar
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className={`bg-white shadow-sm rounded-lg border ${isCurrentUser ? 'border-primary-300' : 'border-neutral-200'} p-4 flex items-center`}>
      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium mr-3">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-800 truncate">
          {name} {isCurrentUser && <span className="text-xs text-neutral-500">(you)</span>}
        </p>
        <div className="flex items-center">
          {voteValue ? (
            <div className="flex items-center">
              <span className="inline-block w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center mr-1.5">
                {voteValue}
              </span>
              <span className="text-xs text-neutral-500">Voted</span>
            </div>
          ) : hasVoted ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
              <span className="text-xs text-neutral-500">Voted</span>
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
              <span className="text-xs text-neutral-500">Voting...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
