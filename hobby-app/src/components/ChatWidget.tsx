// components/ChatWidget.tsx

import { useState } from "react";
import { X, Send } from "lucide-react";
import { Message } from "./MessageBox"; // Assuming this is your MessageBox component

interface ChatWidgetProps {
  partner: { id: string; name: string; avatar: string };
  onClose: () => void;
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const ChatWidget = ({
  partner,
  onClose,
  messages,
  onSendMessage,
}: ChatWidgetProps) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="fixed bottom-24 right-4 w-80 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b-2 border-gray-400">
        <div className="flex items-center gap-2">
          <img
            src={partner.avatar}
            alt={partner.name}
            className="w-8 h-8 rounded-full"
          />
          <h3 className="font-pixel text-lg text-gray-500">{partner.name}</h3>
        </div>
        <button onClick={onClose}>
          <X className="w-5 h-6 text-gray-500" />
        </button>
      </div>

      <div className="h-60 p-3 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 ${
              msg.senderId === "current-user" ? "text-right" : ""
            }`}
          >
            <p
              className={`text-sm ${
                msg.senderId === "current-user"
                  ? "bg-blue-500 p-2 rounded-lg inline-block"
                  : ""
              }`}
            >
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 border-t-2 border-gray-300 flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="w-full p-2 border rounded-lg"
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>
          <Send className="w-6 h-6 text-blue-500" />
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
