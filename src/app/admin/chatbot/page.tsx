import { createClient } from "@/lib/supabase/server";

export default async function ChatbotAdminPage() {
  const supabase = await createClient();

  const { data: knowledge, error } = await supabase
    .from("chatbot_knowledge")
    .select(
      "id, title, question, answer, category, keywords, priority, is_active, created_at"
    )
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-700">
              Chatbot Knowledge Base
            </h1>

            <p className="mt-2 text-sm text-red-600">
              Unable to load the knowledge base.
            </p>

            <pre className="mt-4 overflow-auto rounded-lg bg-white p-4 text-xs text-slate-700">
              {error.message}
            </pre>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Regime Chat Assistance
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Knowledge Base
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Manage the approved information the Regime chat assistant can use
            when answering customers.
          </p>
        </div>

        {knowledge && knowledge.length > 0 ? (
          <div className="space-y-4">
            {knowledge.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h2>

                    {item.question && (
                      <p className="mt-1 text-sm text-slate-500">
                        {item.question}
                      </p>
                    )}
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      item.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {item.answer}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {item.category}
                  </span>

                  {item.keywords?.map((keyword: string) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                    >
                      {keyword}
                    </span>
                  ))}

                  <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
                    Priority {item.priority}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-lg font-bold text-slate-800">
              No knowledge entries yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your approved chatbot questions and answers will appear here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}