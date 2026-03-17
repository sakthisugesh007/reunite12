const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface ChatbotMessage {
  role: "user" | "assistant";
  content: string;
}

class ChatbotService {
  private getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async sendMessage(message: string, history: ChatbotMessage[] = []): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/chatbot`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ message, history }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "Failed to get chatbot response");
    }

    return data.reply;
  }
}

export const chatbotService = new ChatbotService();
