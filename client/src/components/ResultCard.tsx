interface ResultCardProps {
  name: string;
  value: string;
  isCurrentUser?: boolean;
}

export default function ResultCard({
  name,
  value,
  isCurrentUser = false,
}: ResultCardProps) {
  return (
    <div className={`bg-neutral-50 rounded-lg p-4 ${isCurrentUser ? 'border border-primary-300' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-neutral-800 truncate">
          {name}
          {isCurrentUser && <span className="text-xs text-neutral-500 ml-1">(you)</span>}
        </div>
        <div className="bg-primary text-white text-base font-bold w-8 h-8 flex items-center justify-center rounded">
          {value}
        </div>
      </div>
      <div className="text-sm text-neutral-500">Voted</div>
    </div>
  );
}
