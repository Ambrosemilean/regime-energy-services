import Link from "next/link";
import ChatPanel from "@/components/chat/chat-panel";

export const metadata = {
  title: "Chat with Regi — Regime Energy Services Assistant",
  description:
    "Chat with Regi, the Regime Energy Services assistant. Get help with gas orders, prices, delivery, cylinder sizes, branches and LPG safety.",
};

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-blue-900">
              Regi — Customer Chat Assistant
            </h1>
            <p className="text-sm text-gray-500">
              Regime Energy Services · trained on real customer conversations
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 p-6">
        <ChatPanel />
      </div>
    </main>
  );
}
