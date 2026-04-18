import useAuthStore from "@/features/auth/stores/auth-store";
import { useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";

export default function useChatRuntime() {
  const { getAuthHeaders } = useAuthStore();
  const MyModelAdapter: ChatModelAdapter = {
    async run({ messages, abortSignal }) {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content:
              typeof m.content === "string"
                ? m.content
                : m.content
                    .filter((p) => p.type === "text")
                    .map((p) => p.text)
                    .join(""),
          })),
        }),
        signal: abortSignal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === "content" && payload.content) {
              text += payload.content;
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }

      return { content: [{ type: "text", text }] };
    },
  };

  return useLocalRuntime(MyModelAdapter);
}
