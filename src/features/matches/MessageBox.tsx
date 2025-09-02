// src/features/matches/MessageBox.tsx
import React, { useState } from "react";

export default function MessageBox({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = text.trim();
    if (!payload) return;
    setSending(true);
    try {
      onSend(payload);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        className="min-w-0 flex-1 rounded-md border-2 border-black px-3 py-2"
        placeholder="Type a message…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        disabled={sending}
        className="rounded-md border-2 border-black bg-game-blue px-4 py-2 font-pixel text-game-white shadow hover:translate-y-0.5 disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
