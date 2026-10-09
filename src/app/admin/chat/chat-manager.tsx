"use client";

import { useEffect, useState } from "react";

type Knowledge = {
  id: string;
  title: string;
  question: string | null;
  answer: string;
  keywords: string[] | null;
  source: string | null;
  pending_answer: boolean;
  is_active: boolean;
  times_asked: number | null;
  created_at: string;
};

type PendingQuestion = {
  id: string;
  conversation_id: string | null;
  message_id: string | null;
  question: string;
  category: string | null;
  status:
    | "pending"
    | "reviewed"
    | "answered"
    | "escalated";
  admin_answer: string | null;
  whatsapp_sent: boolean;
  created_at: string;
  updated_at: string;
};

type Conversation = {
  id: string;
  session_id: string;
  visitor_name: string | null;
  visitor_phone: string | null;
  status: string;
  escalation_reason: string | null;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender: "visitor" | "assistant" | "admin" | string;
  message: string;
  knowledge_id: string | null;
  was_answered: boolean;
  created_at: string;
};

type Tab =
  | "knowledge"
  | "pending"
  | "conversations";

export default function ChatManager() {
  const [tab, setTab] =
    useState<Tab>("knowledge");

  const [knowledge, setKnowledge] =
    useState<Knowledge[]>([]);

  const [pendingQuestions, setPendingQuestions] =
    useState<PendingQuestion[]>([]);

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // --------------------------------------------------------------
  // Knowledge editor
  // --------------------------------------------------------------

  const [editingKnowledge, setEditingKnowledge] =
    useState<Knowledge | null>(null);

  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [keywords, setKeywords] =
    useState("");

  const [title, setTitle] =
    useState("");

  // --------------------------------------------------------------
  // Pending question answer editor
  // --------------------------------------------------------------

  const [answeringPending, setAnsweringPending] =
    useState<PendingQuestion | null>(null);

  const [pendingAnswer, setPendingAnswer] =
    useState("");

  // ==============================================================
  // Load knowledge
  // ==============================================================

  async function loadKnowledge() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/chat/admin?mode=knowledge",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load knowledge base.",
        );
      }

      setKnowledge(
        data.knowledge || [],
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load knowledge base.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================================================
  // Load pending questions
  // ==============================================================

  async function loadPendingQuestions() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/chat/admin?mode=unanswered",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load pending questions.",
        );
      }

      setPendingQuestions(
        data.questions || [],
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load pending questions.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================================================
  // Load conversations
  // ==============================================================

  async function loadConversations() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/chat/admin?mode=conversations",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load conversations.",
        );
      }

      setConversations(
        data.conversations || [],
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load conversations.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================================================
  // Load conversation messages
  // ==============================================================

  async function loadMessages(
    conversation: Conversation,
  ) {
    setSelectedConversation(
      conversation,
    );

    setMessages([]);
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/chat/admin?mode=messages&conversationId=${encodeURIComponent(
          conversation.id,
        )}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load conversation.",
        );
      }

      setMessages(
        data.messages || [],
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load conversation.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================================================
  // Initial load
  // ==============================================================

  useEffect(() => {
    loadKnowledge();
  }, []);

  // ==============================================================
  // Change tab
  // ==============================================================

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    setMessage("");

    if (nextTab === "knowledge") {
      loadKnowledge();
    }

    if (nextTab === "pending") {
      loadPendingQuestions();
    }

    if (nextTab === "conversations") {
      loadConversations();
    }
  }

  // ==============================================================
  // Reset knowledge editor
  // ==============================================================

  function resetKnowledgeForm() {
    setEditingKnowledge(null);
    setTitle("");
    setQuestion("");
    setAnswer("");
    setKeywords("");
  }

  // ==============================================================
  // Edit knowledge
  // ==============================================================

  function editKnowledge(
    entry: Knowledge,
  ) {
    setEditingKnowledge(entry);
    setTitle(entry.title || "");
    setQuestion(
      entry.question || "",
    );
    setAnswer(entry.answer || "");
    setKeywords(
      (entry.keywords || []).join(
        ", ",
      ),
    );

    setTab("knowledge");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==============================================================
  // Save knowledge
  // ==============================================================

  async function saveKnowledge() {
    if (!question.trim() || !answer.trim()) {
      setMessage(
        "Question and answer are required.",
      );

      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/chat/admin",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id:
              editingKnowledge?.id ||
              undefined,

            title:
              title.trim() ||
              question.trim().slice(
                0,
                120,
              ),

            question:
              question.trim(),

            answer:
              answer.trim(),

            keywords:
              keywords.trim(),

            isActive: true,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not save knowledge.",
        );
      }

      setMessage(
        editingKnowledge
          ? "Knowledge updated successfully."
          : "Knowledge added successfully.",
      );

      resetKnowledgeForm();

      await loadKnowledge();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save knowledge.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==============================================================
  // Delete knowledge
  // ==============================================================

  async function deleteKnowledge(
    id: string,
  ) {
    const confirmed =
      window.confirm(
        "Delete this chatbot knowledge entry?",
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/chat/admin?id=${encodeURIComponent(
          id,
        )}`,
        {
          method: "DELETE",
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not delete knowledge.",
        );
      }

      setMessage(
        "Knowledge entry deleted.",
      );

      await loadKnowledge();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete knowledge.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==============================================================
  // Open pending question
  // ==============================================================

  function openPendingQuestion(
    item: PendingQuestion,
  ) {
    setAnsweringPending(item);
    setPendingAnswer(
      item.admin_answer || "",
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==============================================================
  // Train chatbot from pending question
  // ==============================================================

  async function trainFromPending() {
    if (!answeringPending) {
      return;
    }

    if (!pendingAnswer.trim()) {
      setMessage(
        "Please provide the correct answer first.",
      );

      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/chat/admin",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action:
              "answer_unanswered",

            unansweredId:
              answeringPending.id,

            answer:
              pendingAnswer.trim(),
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not train chatbot.",
        );
      }

      setMessage(
        "Answer saved. Regi has been trained with this question.",
      );

      setAnsweringPending(null);
      setPendingAnswer("");

      await Promise.all([
        loadPendingQuestions(),
        loadKnowledge(),
      ]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not train chatbot.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==============================================================
  // Render
  // ==============================================================

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Chat Assistant
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Manage Regi's knowledge,
          unanswered questions and
          customer conversations.
        </p>
      </div>

      {/* Status message */}

      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {/* Tabs */}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() =>
            changeTab("knowledge")
          }
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "knowledge"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Knowledge Base
        </button>

        <button
          type="button"
          onClick={() =>
            changeTab("pending")
          }
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "pending"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Pending Questions
          {pendingQuestions.filter(
            (item) =>
              item.status === "pending",
          ).length > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
              {
                pendingQuestions.filter(
                  (item) =>
                    item.status ===
                    "pending",
                ).length
              }
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            changeTab("conversations")
          }
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "conversations"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Conversations
        </button>
      </div>

      {/* =========================================================
          KNOWLEDGE BASE
          ========================================================= */}

      {tab === "knowledge" && (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Editor */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {editingKnowledge
                  ? "Edit Knowledge"
                  : "Add Knowledge"}
              </h2>

              {editingKnowledge && (
                <button
                  type="button"
                  onClick={
                    resetKnowledgeForm
                  }
                  className="text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  placeholder="Short title"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Question
                </label>

                <textarea
                  value={question}
                  onChange={(event) =>
                    setQuestion(
                      event.target.value,
                    )
                  }
                  rows={3}
                  placeholder="What might a customer ask?"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Answer
                </label>

                <textarea
                  value={answer}
                  onChange={(event) =>
                    setAnswer(
                      event.target.value,
                    )
                  }
                  rows={7}
                  placeholder="What should Regi answer?"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Keywords
                </label>

                <input
                  value={keywords}
                  onChange={(event) =>
                    setKeywords(
                      event.target.value,
                    )
                  }
                  placeholder="delivery, home delivery, gas delivery"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Separate keywords with commas.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={
                  saveKnowledge
                }
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingKnowledge
                    ? "Update Knowledge"
                    : "Add Knowledge"}
              </button>
            </div>
          </div>

          {/* Knowledge list */}

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                Loading knowledge...
              </div>
            ) : knowledge.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                No chatbot knowledge yet.
              </div>
            ) : (
              knowledge.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {entry.title ||
                            entry.question ||
                            "Untitled"}
                        </h3>

                        {entry.pending_answer && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                            Pending
                          </span>
                        )}

                        {!entry.is_active && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            Inactive
                          </span>
                        )}

                        {entry.source && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            {entry.source}
                          </span>
                        )}
                      </div>

                      {entry.question && (
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">
                            Q:
                          </span>{" "}
                          {entry.question}
                        </p>
                      )}

                      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">
                        {entry.answer ||
                          "No answer yet."}
                      </p>

                      <div className="mt-3 text-xs text-gray-500">
                        Asked{" "}
                        {entry.times_asked ||
                          0}{" "}
                        time(s)
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editKnowledge(
                            entry,
                          )
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteKnowledge(
                            entry.id,
                          )
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          PENDING QUESTIONS
          ========================================================= */}

      {tab === "pending" && (
        <div className="space-y-6">
          {/* Answer panel */}

          {answeringPending && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Train Regi
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Provide the correct answer
                    to this customer question.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAnsweringPending(
                      null,
                    );
                    setPendingAnswer("");
                  }}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>

              <div className="rounded-xl border border-blue-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-900">
                  Customer question
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {
                    answeringPending.question
                  }
                </p>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Correct answer
                </label>

                <textarea
                  value={pendingAnswer}
                  onChange={(event) =>
                    setPendingAnswer(
                      event.target.value,
                    )
                  }
                  rows={7}
                  placeholder="Write the answer Regi should give in future..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={
                  trainFromPending
                }
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Training Regi..."
                  : "Save Answer & Train Regi"}
              </button>
            </div>
          )}

          {/* Pending list */}

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                Loading pending questions...
              </div>
            ) : pendingQuestions.length ===
              0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <div className="text-3xl">
                  ✓
                </div>

                <h3 className="mt-3 font-semibold text-gray-900">
                  No pending questions
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Regi has no unanswered
                  questions waiting for training.
                </p>
              </div>
            ) : (
              pendingQuestions.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              item.status ===
                              "pending"
                                ? "bg-amber-100 text-amber-800"
                                : item.status ===
                                    "answered"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status}
                          </span>

                          {item.category && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              {item.category}
                            </span>
                          )}
                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-sm font-medium text-gray-900">
                          {item.question}
                        </p>

                        {item.admin_answer && (
                          <div className="mt-3 rounded-lg bg-green-50 p-3">
                            <p className="text-xs font-semibold text-green-800">
                              Admin answer
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-sm text-green-900">
                              {
                                item.admin_answer
                              }
                            </p>
                          </div>
                        )}

                        <p className="mt-3 text-xs text-gray-500">
                          {new Date(
                            item.created_at,
                          ).toLocaleString()}
                        </p>
                      </div>

                      {item.status ===
                        "pending" && (
                        <button
                          type="button"
                          onClick={() =>
                            openPendingQuestion(
                              item,
                            )
                          }
                          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Answer Question
                        </button>
                      )}
                    </div>
                  </div>
                ),
              )
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          CONVERSATIONS
          ========================================================= */}

      {tab === "conversations" && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Conversation list */}

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                Loading conversations...
              </div>
            ) : conversations.length ===
              0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                No conversations yet.
              </div>
            ) : (
              conversations.map(
                (conversation) => (
                  <button
                    type="button"
                    key={
                      conversation.id
                    }
                    onClick={() =>
                      loadMessages(
                        conversation,
                      )
                    }
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedConversation?.id ===
                      conversation.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium text-gray-900">
                        {conversation.visitor_name ||
                          "Website visitor"}
                      </span>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                          conversation.status ===
                          "escalated"
                            ? "bg-red-100 text-red-700"
                            : conversation.status ===
                                "closed"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {
                          conversation.status
                        }
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {conversation.visitor_phone ||
                        conversation.session_id}
                    </p>

                    {conversation.escalation_reason && (
                      <p className="mt-2 text-xs text-red-600">
                        {
                          conversation.escalation_reason
                        }
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(
                        conversation.updated_at,
                      ).toLocaleString()}
                    </p>
                  </button>
                ),
              )
            )}
          </div>

          {/* Conversation messages */}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            {!selectedConversation ? (
              <div className="flex min-h-[400px] items-center justify-center p-6 text-center text-sm text-gray-500">
                Select a conversation to
                view the complete chat.
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 p-5">
                  <h2 className="font-semibold text-gray-900">
                    Conversation
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    ID:{" "}
                    {
                      selectedConversation.id
                    }
                  </p>
                </div>

                <div className="max-h-[650px] space-y-4 overflow-y-auto p-5">
                  {messages.length ===
                  0 ? (
                    <p className="text-sm text-gray-500">
                      No messages found.
                    </p>
                  ) : (
                    messages.map(
                      (chatMessage) => (
                        <div
                          key={
                            chatMessage.id
                          }
                          className={`flex ${
                            chatMessage.sender ===
                            "visitor"
                              ? "justify-start"
                              : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                              chatMessage.sender ===
                              "visitor"
                                ? "bg-gray-100 text-gray-900"
                                : chatMessage.sender ===
                                    "admin"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-blue-600 text-white"
                            }`}
                          >
                            <p className="mb-1 text-[10px] font-semibold uppercase opacity-70">
                              {
                                chatMessage.sender
                              }
                            </p>

                            <p className="whitespace-pre-wrap text-sm">
                              {
                                chatMessage.message
                              }
                            </p>

                            <p className="mt-2 text-[10px] opacity-60">
                              {new Date(
                                chatMessage.created_at,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}