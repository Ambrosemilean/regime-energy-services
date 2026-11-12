import ChatPanel from "@/components/chat/chat-panel";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata = {
  title: "Chat with Regi — Regime Energy Services Assistant",
  description:
    "Chat with Regi, the Regime Energy Services assistant. Get help with gas orders, prices, delivery, cylinder sizes, branches and LPG safety.",
};

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <SiteHeader currentPath="/chat" />

      <main className="flex flex-1 flex-col">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-blue-900 sm:text-xl">
                Regi — Customer Chat Assistant
              </h1>
              <p className="truncate text-sm text-gray-500">
                Regime Energy Services · trained on real customer conversations
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 p-3 sm:p-6">
          <ChatPanel />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
