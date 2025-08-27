type MatchConfirmProps = {
    onConfirm: () => void;
    onCancel: () => void;
  };
  
  const MatchConfirm = ({ onConfirm, onCancel }: MatchConfirmProps) => {
    return (
        <div className="px-10 py-6 w-[1110px] h-[120px] flex items-center justify-between border-8 border-black bg-game-white shadow-[8px_8px_0_#333333]">
        {/* Left Text */}
        <span className="font-jersey text-black text-[80px] px-6 font-semibold">
          Enter Match?
        </span>
  
        {/* Right-aligned Button Group */}
        <div className="flex gap-6">
          <button
            onClick={onConfirm}
            className="font-jersey bg-game-green text-white text-[55px] flex items-center justify-center w-[220px] h-[80px] border-[6px] border-black hover:brightness-105 shadow-[6px_6px_0_#333333]"
          >
            Yes
          </button>
  
          <button
            onClick={onCancel}
            className="font-jersey bg-game-red text-white text-[55px] flex items-center justify-center w-[220px] h-[80px] border-[6px] border-black hover:brightness-105 shadow-[6px_6px_0_#333333]"
          >
            No
          </button>
        </div>
      </div>
    );
  };
  
  export default MatchConfirm;