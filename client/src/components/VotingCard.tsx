interface VotingCardProps {
  value: string;
  selected: boolean;
  disabled: boolean;
  revealed: boolean;
  onClick: () => void;
}

export default function VotingCard({
  value,
  selected,
  disabled,
  revealed,
  onClick,
}: VotingCardProps) {
  // Determine if the card should be flipped
  const isFlipped = selected && revealed;

  return (
    <div className="card-container">
      <div 
        className={`card cursor-pointer h-24 sm:h-32 relative rounded-lg shadow-sm ${isFlipped ? 'flipped' : ''}`}
        onClick={!disabled ? onClick : undefined}
      >
        <div 
          className={`card-face card-front bg-white border-2 ${
            selected ? 'border-primary' : disabled ? 'border-neutral-200' : 'border-primary-100 hover:border-primary-500'
          } rounded-lg h-full w-full flex flex-col items-center justify-center ${
            disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
          }`}
        >
          <span className="text-xl sm:text-2xl font-bold text-neutral-800">{value}</span>
          <span className="text-xs text-neutral-500">
            {value === "1" ? "point" : value === "?" ? "unsure" : "points"}
          </span>
        </div>
        <div className="card-face card-back bg-primary rounded-lg h-full w-full flex items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-white">{value}</span>
        </div>
      </div>
    </div>
  );
}
