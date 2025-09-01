import { useState } from "react";
import PixelAvatar from "./PixelAvatar";
import PixelButton from "./PixelButton";
import { Send } from "lucide-react";

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
};

export type ChatPartner = {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
};

type MessageBoxProps = {
  messages: Message[];
  currentUserId: string;
  partner: ChatPartner;
  onSendMessage: (text: string) => void;
};

const MessageBox = ({
  messages,
  currentUserId,
  partner,
  onSendMessage,
}: MessageBoxProps) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b-4 border-game-black">
        <PixelAvatar src={partner.avatar} alt={partner.name} size="sm" />
        <h3 className="font-pixel ml-4 text-game-black">{partner.name}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.senderId === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex ${
                isCurrentUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isCurrentUser && (
                <PixelAvatar
                  src={partner.avatar}
                  alt={partner.name}
                  size="sm"
                  className="mr-2"
                />
              )}

              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  isCurrentUser
                    ? "bg-game-blue text-white pixel-borders"
                    : "bg-gray-200 text-game-black border-2 border-gray-400"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {isCurrentUser && (
                <PixelAvatar
                  src={undefined}
                  alt="You"
                  size="sm"
                  className="ml-2"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t-4 border-game-black flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 pixel-input"
        />
        <PixelButton
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="h-[42px] flex items-center"
        >
          <Send className="w-4 h-4" />
        </PixelButton>
      </div>
    </div>
  );
};

export default MessageBox;
