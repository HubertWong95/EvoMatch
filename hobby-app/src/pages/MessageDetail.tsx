import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MessageBox, { Message, ChatPartner } from "./../components/MessageBox";
import { ArrowLeft } from "lucide-react";
import { UserProfile } from "./../components/ProfileCard";
import ash from "@/assets/ash.png";
import hatsune from "@/assets/hatsune.png";
import Layout from "../components/Layout";
import userIcon from "@/assets/userIcon.jpg";

const matchedProfiles: UserProfile[] = [
  {
    id: "1",
    name: "Ash",
    age: 28,
    bio: "Enthusiastic gamer and hiking lover. Looking for people to game with or explore trails!",
    avatar: ash,
    hobbies: ["Gaming", "Hiking", "Cooking"],
    location: "Seattle, WA",
  },
  {
    id: "5",
    name: "Hatsune",
    age: 29,
    bio: "Music producer and gamer. Let's game together or collaborate on tracks!",
    avatar: hatsune,
    hobbies: ["Music", "Gaming", "Art"],
    location: "Austin, TX",
  },
];

// Mock messages
const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "1",
      senderId: "current-user",
      receiverId: "1",
      text: "Hey! I saw you're into hiking. Any favorite trails around here?",
      timestamp: new Date(2023, 8, 15, 14, 30),
    },
    {
      id: "2",
      senderId: "1",
      receiverId: "current-user",
      text: "Hi there! Yes, I love the trails at Mt. Rainier. Have you been?",
      timestamp: new Date(2023, 8, 15, 14, 35),
    },
    {
      id: "3",
      senderId: "current-user",
      receiverId: "1",
      text: "Not yet, but I'd love to go! Maybe we could plan a hike sometime?",
      timestamp: new Date(2023, 8, 15, 14, 40),
    },
  ],
  "5": [
    {
      id: "1",
      senderId: "current-user",
      receiverId: "5",
      text: "Hello! I noticed we both enjoy gaming. What games are you playing lately?",
      timestamp: new Date(2023, 8, 16, 10, 15),
    },
    {
      id: "2",
      senderId: "5",
      receiverId: "current-user",
      text: "Hey! I've been playing a lot of indie games lately. How about you?",
      timestamp: new Date(2023, 8, 16, 10, 20),
    },
  ],
};

const MessageDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<ChatPartner | null>(null);

  useEffect(() => {
    if (!id) return;

    const foundPartner = matchedProfiles.find((profile) => profile.id === id);

    if (foundPartner) {
      setPartner({
        id: foundPartner.id,
        name: foundPartner.name,
        avatar: foundPartner.avatar,
      });

      setMessages(mockMessages[id] || []);
    }
  }, [id]);

  const handleBack = () => {
    navigate("/messages");
  };

  const handleSendMessage = (text: string) => {
    if (!partner) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: "current-user",
      receiverId: partner.id,
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading conversation...</p>
      </div>
    );
  }

  return (
    <>
      <Layout />
      <div className="min-h-screen bg-white flex flex-col">
        <header className="py-4 px-4 flex items-center border-b-4 border-game-black">
          <button onClick={handleBack} className="p-2 mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h1 className="font-pixel text-xl text-game-black">Chat</h1>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col items-center px-4">
          {/* Profile Section */}
          <div className="flex flex-col items-center border-b-2 pb-4">
            <img
              src={partner.avatar}
              alt={partner.name}
              className="w-24 h-24 rounded-full mb-2"
            />
            <h2 className="font-pixel text-2xl">{partner.name}</h2>
            <p className="text-center text-sm text-gray-600">{partner.bio}</p>
            <div className="mt-2 text-sm text-gray-500">
              <span>{partner.location}</span>
            </div>
          </div>

          {/* Message Box */}
          <MessageBox
            messages={messages}
            currentUserId="current-user"
            partner={partner}
            onSendMessage={handleSendMessage}
          />
        </main>
      </div>
    </>
  );
};

export default MessageDetailPage;
