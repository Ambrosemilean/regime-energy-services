import ChatManager from "./chat-manager";

export const metadata = {
  title: "Chat Assistant — Regime Admin",
};

export default function AdminChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat Assistant (Regi)</h1>
        <p className="mt-1 text-sm text-gray-500">
          Train the assistant&apos;s knowledge base, answer pending customer
          questions and review conversations.
        </p>
      </div>
      <ChatManager />
    </div>
  );
}
