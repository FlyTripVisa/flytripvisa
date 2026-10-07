const STORAGE_KEY = "flytripvisa-mcp-chat-history-v1";

const $ = (s) => document.querySelector(s);
const messagesEl = $("#messages");
const promptEl = $("#prompt");
const composer = $("#composer");
const sendBtn = $("#sendBtn");
const typing = $("#typing");
const statusEl = $("#status");
const chatList = $("#chatList");
const sidebar = $("#sidebar");

let chats = loadChats();
let currentId = chats[0]?.id || createChat(false);
let abortController = null;
let generating = false;

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function createChat(save = true) {
  const chat = { id: uid(), title: "New chat", messages: [], updatedAt: Date.now() };
  chats.unshift(chat);
  currentId = chat.id;
  if (save) persist();
  return chat.id;
}

function currentChat() {
  return chats.find(c => c.id === currentId);
}

function loadChats() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 30)));
  renderChatList();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s;
}

function markdown(text) {
  const blocks = [];
  let s = String(text ?? "").replace(/\r\n/g, "\n");

  s = s.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const i = blocks.length;
    blocks.push(`<pre><button class="copy-code" data-copy="${encodeURIComponent(code)}">Copy</button><code>${escapeHtml(code)}</code></pre>`);
    return `@@CODE${i}@@`;
  });

  s = s.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  s = s.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  s = s.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  s = s.replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>");
  s = s.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  s = s.split(/\n{2,}/).map(part => {
    if (/^<(h\d|ul|pre)/.test(part.trim()) || /^@@CODE/.test(part.trim())) return part;
    return `<p>${part.replace(/\n/g, "<br>")}</p>`;
  }).join("");

  blocks.forEach((html, i) => {
    s = s.replace(`@@CODE${i}@@`, html);
  });

  return s;
}

function renderChatList() {
  chatList.innerHTML = chats.slice(0, 20).map(chat => `
    <button class="chat-item ${chat.id === currentId ? "active" : ""}" data-chat="${chat.id}">
      ${escapeHtml(chat.title || "New chat")}
    </button>
  `).join("");
}

function render() {
  renderChatList();
  const chat = currentChat();
  if (!chat || chat.messages.length === 0) {
    messagesEl.innerHTML = `
      <div class="empty">
        <div class="empty-inner">
          <h1>How can I help?</h1>
          <p>Ask about visas, travel, flights, hotels, destinations, or your FlyTripVisa services.</p>
        </div>
      </div>`;
    return;
  }

  messagesEl.innerHTML = chat.messages.map((m, i) => `
    <article class="message ${m.role === "user" ? "user" : "assistant"}">
      <div class="avatar">${m.role === "user" ? "You" : "F"}</div>
      <div class="bubble">${m.role === "user" ? escapeHtml(m.content).replace(/\n/g, "<br>") : markdown(m.content)}</div>
    </article>
  `).join("");

  document.querySelectorAll(".copy-code").forEach(btn => {
    btn.addEventListener("click", async () => {
      const code = decodeURIComponent(btn.dataset.copy || "");
      await navigator.clipboard.writeText(code);
      btn.textContent = "Copied";
      setTimeout(() => btn.textContent = "Copy", 1000);
    });
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function setStatus(text, busy = false) {
  statusEl.innerHTML = `<span class="status-dot"></span><span>${escapeHtml(text)}</span>`;
  typing.classList.toggle("hidden", !busy);
}

function setGenerating(value) {
  generating = value;
  sendBtn.disabled = value;
  promptEl.disabled = value;
}

async function sendMessage(text) {
  if (!text.trim() || generating) return;

  let chat = currentChat();
  if (!chat) {
    createChat();
    chat = currentChat();
  }

  chat.messages.push({ role: "user", content: text.trim() });
  if (chat.title === "New chat") chat.title = text.trim().slice(0, 48);
  chat.updatedAt = Date.now();
  persist();
  render();

  chat.messages.push({ role: "assistant", content: "" });
  const assistantIndex = chat.messages.length - 1;

  setGenerating(true);
  setStatus("Thinking…", true);
  abortController = new AbortController();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
      body: JSON.stringify({
        messages: chat.messages.slice(0, -1),
        stream: true
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Request failed (${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream")) {
      await consumeSSE(response, (chunk) => {
        chat.messages[assistantIndex].content += chunk;
        chat.updatedAt = Date.now();
        render();
      });
    } else {
      const textResponse = await response.text();
      chat.messages[assistantIndex].content = textResponse;
      render();
    }

    if (!chat.messages[assistantIndex].content) {
      chat.messages[assistantIndex].content = "I received an empty response from Muse.";
    }

    persist();
    setStatus("Ready");
  } catch (error) {
    if (error.name === "AbortError") {
      setStatus("Stopped");
    } else {
      chat.messages[assistantIndex].content = `**Error:** ${error.message}`;
      setStatus("Connection error");
      render();
    }
  } finally {
    abortController = null;
    setGenerating(false);
    persist();
  }
}

async function consumeSSE(response, onText) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const text = parsed.text ?? parsed.delta ?? parsed.content ?? "";
          if (text) onText(text);
        } catch {
          onText(data);
        }
      }
    }
  }
}

composer.addEventListener("submit", e => {
  e.preventDefault();
  const value = promptEl.value;
  promptEl.value = "";
  promptEl.style.height = "auto";

  if (generating) {
    abortController?.abort();
    return;
  }
  sendMessage(value);
});

promptEl.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

promptEl.addEventListener("input", () => {
  promptEl.style.height = "auto";
  promptEl.style.height = Math.min(promptEl.scrollHeight, 180) + "px";
});

document.addEventListener("click", e => {
  const chatButton = e.target.closest("[data-chat]");
  if (chatButton) {
    currentId = chatButton.dataset.chat;
    sidebar.classList.remove("open");
    render();
  }
});

function newChat() {
  if (generating) abortController?.abort();
  createChat();
  render();
  promptEl.focus();
}

$("#newChatBtn").addEventListener("click", newChat);
$("#newChatTop").addEventListener("click", newChat);

$("#clearHistoryBtn").addEventListener("click", () => {
  if (!confirm("Delete all local chat history?")) return;
  chats = [];
  createChat();
  persist();
  render();
});

$("#menuBtn").addEventListener("click", () => sidebar.classList.toggle("open"));

render();
promptEl.focus();
