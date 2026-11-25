"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Step = "business" | "name" | "email" | "phone" | "requirement";
type Message = { from: "bot" | "user"; text: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const prompts: Record<Step, string> = {
  business: "What is your business?",
  name: "Nice! May I know your name?",
  email: "What is your email address?",
  phone: "And your mobile number?",
  requirement: "Last one: tell us briefly what you need (website, app, SEO, etc.).",
};

const order: Step[] = ["business", "name", "email", "phone", "requirement"];

function validate(step: Step, value: string) {
  if (step === "email" && !emailPattern.test(value)) return "That email doesn't look right. Please check and try again.";
  if (step === "phone" && value.replace(/\D/g, "").length < 7) return "Please enter a valid mobile number.";
  if (step === "requirement" && value.length < 5) return "Please tell us a little more about what you need.";
  return "";
}

const greeting = ["Hi there! Hope you're having a good day 👋", prompts.business];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Roughly how long a person would take to type the reply. */
const typingTime = (text: string) => Math.min(450 + text.length * 22, 1800);

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<Step, string>>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [typing, setTyping] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  const alive = useRef(true);

  const step = order[stepIndex];

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /** Shows the typing bubble, waits, then reveals each bot message in turn. */
  async function say(texts: string[]) {
    for (const text of texts) {
      setTyping(true);
      await sleep(typingTime(text));
      if (!alive.current) return;
      setTyping(false);
      setMessages((m) => [...m, { from: "bot", text }]);
      if (texts.length > 1) await sleep(250);
    }
  }

  useEffect(() => {
    if (open && !started.current) {
      started.current = true;
      void say(greeting);
    }
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages, typing, sending, open]);

  useEffect(() => {
    if (open && !done && !sending && !typing) field.current?.focus();
  }, [open, done, sending, typing, stepIndex]);

  if (pathname.startsWith("/admin")) return null;

  async function submit(all: Partial<Record<Step, string>>) {
    setSending(true);
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: all.name,
          email: all.email,
          phone: all.phone,
          service: "Chat",
          message: `Business: ${all.business}\n\nRequirement: ${all.requirement}\n\n(Sent via website chat)`,
          nh_extra_note: honeypot,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.ok) {
        setSending(false);
        await say([
          `Thank you, ${all.name}! 🎉 We've got your details.`,
          "Our team will get in touch with you soon. Have a great day!",
        ]);
        setDone(true);
        return;
      }
      setSending(false);
      await say([result.error ?? "Something went wrong. Please send your requirement again."]);
    } catch {
      setSending(false);
      await say(["Could not reach the server. Please check your connection and send again."]);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!value || sending || typing || done) return;

    const user: Message = { from: "user", text: value };
    const problem = validate(step, value);
    if (problem) {
      setMessages((m) => [...m, user]);
      setInput("");
      await say([problem]);
      return;
    }

    const all = { ...answers, [step]: value };
    setAnswers(all);
    setInput("");

    if (stepIndex < order.length - 1) {
      setStepIndex(stepIndex + 1);
      setMessages((m) => [...m, user]);
      await say([prompts[order[stepIndex + 1]]]);
    } else {
      setMessages((m) => [...m, user]);
      await submit(all);
    }
  }

  const inputType = step === "email" ? "email" : step === "phone" ? "tel" : "text";

  return (
    <div className="chat-widget">
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Chat with Novahomin">
          <header className="chat-head">
            <div>
              <strong>Novahomin</strong>
              <span>{typing || sending ? "typing…" : "Online"}</span>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </header>
          <div className="chat-log" ref={log} aria-live="polite">
            {messages.map((message, i) => (
              <p key={i} className={`chat-msg chat-msg-${message.from}`}>
                {message.text}
              </p>
            ))}
            {(typing || sending) && (
              <p className="chat-msg chat-msg-bot chat-typing" role="status" aria-label="Novahomin is typing">
                <span />
                <span />
                <span />
              </p>
            )}
          </div>
          {!done && (
            <form className="chat-form" onSubmit={onSubmit}>
              <input
                className="chat-hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
              <input
                ref={field}
                type={inputType}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={step === "requirement" ? 1000 : 254}
                placeholder="Type your answer…"
                aria-label={prompts[step]}
                disabled={sending || typing}
                autoComplete={step === "email" ? "email" : step === "phone" ? "tel" : step === "name" ? "name" : "off"}
              />
              <button type="submit" disabled={sending || typing || !input.trim()} aria-label="Send">
                ➤
              </button>
            </form>
          )}
        </section>
      )}
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Chat with us"}
        aria-expanded={open}
      >
        {open ? (
          <span aria-hidden="true" className="chat-fab-x">×</span>
        ) : (
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="currentColor">
            <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
