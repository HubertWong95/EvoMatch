// src/features/matches/ChatWidget.tsx
import React, { useState } from "react";
import MessageBox from "./MessageBox";

export default function ChatWidget({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4">
      {open ? (
        <div className="w-80 rounded-xl border-4 border-black bg-white p-3 shadow-xl">
          <header className="mb-2 flex items-center justify-between">
            <h4 className="font-pixel text-sm">Quick Chat</h4>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md border-2 border-black bg-game-red px-2 py-1 font-pixel text-game-white"
            >
              Close
            </button>
          </header>
          <div className="mb-2 h-40 overflow-y-auto rounded-md border-2 border-black p-2 text-sm opacity-60">
            (History preview here)
          </div>
          <MessageBox onSend={onSend} />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border-4 border-black bg-game-purple px-4 py-3 font-pixel text-game-white shadow-lg hover:translate-y-0.5"
        >
          Chat
        </button>
      )}
    </div>
  );
}
