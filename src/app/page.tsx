"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

type Source = {
  title: string;
  url: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  sources?: Source[];
};

type ConnectionStatus = "checking" | "ready" | "missing";

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Я разбираюсь в самолётах, авиакомпаниях, истории и технологиях полёта. Задай любой вопрос по авиации — для актуальных тем я могу искать информацию в интернете и прикладывать источники.",
};

const suggestions = [
  {
    label: "Boeing 787 и Airbus A350 — в чём разница?",
    prompt:
      "Сравни Boeing 787 Dreamliner и Airbus A350: конструкцию, дальность, вместимость и особенности для пассажира.",
  },
  {
    label: "Почему самолёт держится в воздухе?",
    prompt:
      "Объясни простыми словами, как крыло создаёт подъёмную силу и почему самолёт не падает.",
  },
  {
    label: "Как зарабатывают авиакомпании?",
    prompt:
      "Расскажи, из чего складывается экономика авиакомпании и почему цены на билеты так меняются.",
  },
  {
    label: "Какие новости в авиации сегодня?",
    prompt:
      "Найди самые важные свежие новости гражданской авиации и коротко объясни, чем они важны.",
  },
];

const topics = [
  {
    index: "01",
    category: "НАУКА ПОЛЁТА",
    title: "Что держит самолёт в небе?",
    description:
      "От формы крыла до работы двигателей — без сложных формул и мифов.",
    prompt:
      "Расскажи, как летает современный пассажирский самолёт: крыло, тяга и управление — простыми словами.",
    style: "topic-card--blue",
  },
  {
    index: "02",
    category: "ИНЖЕНЕРИЯ",
    title: "A350 против 787",
    description:
      "Сравни два флагмана дальнемагистральной авиации по делу.",
    prompt:
      "Сделай понятное сравнение Airbus A350 и Boeing 787 Dreamliner: материалы, двигатели, дальность и комфорт.",
    style: "topic-card--mint",
  },
  {
    index: "03",
    category: "АВИАБИЗНЕС",
    title: "Как устроена авиакомпания?",
    description:
      "Маршруты, парк самолётов и экономика одного рейса.",
    prompt:
      "Как авиакомпании выбирают маршруты и самолёты для них? Разбери на понятном примере.",
    style: "topic-card--sand",
  },
];

const facts = [
  {
    number: "01",
    label: "ДАЛЬНИЕ МАРШРУТЫ",
    metric: "≈ 18–19 ч",
    title: "Полёт через полмира",
    description:
      "Беспосадочный рейс Сингапур — Нью-Йорк относится к числу самых продолжительных регулярных перелётов. Точное время зависит от направления и условий.",
  },
  {
    number: "02",
    label: "ДИЗАЙН С ЗАДАЧЕЙ",
    metric: "КРУГЛАЯ ФОРМА",
    title: "Иллюминаторы не случайны",
    description:
      "Закруглённые углы помогают равномернее распределять нагрузку от перепадов давления в фюзеляже.",
  },
  {
    number: "03",
    label: "БАЛАНС САМОЛЁТА",
    metric: "ТОПЛИВО — В КРЫЛЬЯХ",
    title: "Часть конструкции",
    description:
      "У многих крупных лайнеров топливо размещается в крыльевых баках. Это помогает учитывать массу и балансировку самолёта.",
  },
  {
    number: "04",
    label: "РАСЧЁТ ПОЛЁТА",
    metric: "ЗАВИСИТ ОТ УСЛОВИЙ",
    title: "Нет одной скорости взлёта",
    description:
      "Скорость отрыва рассчитывают для конкретного самолёта и его массы — влияют также погода, конфигурация и параметры аэродрома.",
  },
];

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getStatusLabel(status: ConnectionStatus) {
  if (status === "ready") return "ИИ ПОДКЛЮЧЁН";
  if (status === "missing") return "НУЖЕН API-КЛЮЧ";
  return "ПРОВЕРКА СВЯЗИ";
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/chat", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось проверить соединение");
        return (await response.json()) as { configured?: boolean };
      })
      .then((data) => {
        if (isMounted) setConnectionStatus(data.configured ? "ready" : "missing");
      })
      .catch(() => {
        if (isMounted) setConnectionStatus("missing");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) {
      transcript.scrollTo({ top: transcript.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  async function sendMessage(rawMessage: string) {
    const content = rawMessage.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role: "user",
      content,
    };
    const history = [
      ...messages.filter((message) => message.id !== "welcome"),
      userMessage,
    ].map(({ role, content: messageContent }) => ({ role, content: messageContent }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = (await response.json()) as {
        answer?: string;
        sources?: Source[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Не получилось получить ответ. Попробуй ещё раз.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role: "assistant",
          content: data.answer || "Модель не вернула текст ответа. Попробуй задать вопрос иначе.",
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось связаться с FlyAI. Проверь подключение и попробуй снова.";
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  function startTopic(prompt: string) {
    document.getElementById("assistant")?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => void sendMessage(prompt), 250);
  }

  function resetChat() {
    if (isLoading) return;
    setMessages([welcomeMessage]);
    setInput("");
  }

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="FlyAI — на главную">
          <Image src="/flyai-mark.svg" alt="" width={46} height={46} priority />
          <span className="brand-copy">
            <span className="brand-name">FlyAI</span>
            <span className="brand-caption">AVIATION INTELLIGENCE</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Основная навигация">
          <a href="#assistant">ИИ-ассистент</a>
          <a href="#discover">Темы</a>
          <a href="#facts">Факты</a>
        </nav>

        <div className="header-actions">
          <div className={`system-indicator system-indicator--${connectionStatus}`} aria-live="polite">
            <span className="system-indicator__dot" />
            <span>{getStatusLabel(connectionStatus)}</span>
          </div>
          <a className="header-cta" href="#assistant">
            Задать вопрос <ArrowUpRight />
          </a>
        </div>
      </header>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-visual" aria-hidden="true">
          <Image
            src="/images/flyai-hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hero-image"
          />
        </div>
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-grid-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dash" />
            ИНТЕЛЛЕКТ, КОТОРЫЙ ПОНИМАЕТ НЕБО
          </div>
          <h1 id="hero-title">
            Небо ближе,
            <br />
            <em>чем кажется.</em>
          </h1>
          <p className="hero-description">
            Самолёты, авиакомпании и технологии полёта. Спроси FlyAI — и получи
            настоящий ответ с актуальными источниками, а не набор заготовок.
          </p>
          <div className="hero-actions">
            <a className="button-primary" href="#assistant">
              Спросить FlyAI <ArrowRight />
            </a>
            <a className="hero-secondary-link" href="#discover">
              Исследовать темы <ArrowUpRight />
            </a>
          </div>
        </div>

        <div className="hero-side-label" aria-hidden="true">
          <span className="hero-side-label__line" />
          <span>AVIATION, EXPLAINED</span>
        </div>

        <div className="hero-bottom-bar">
          <div className="hero-bottom-intro">
            <span className="live-dot" />
            <span>ТВОЙ ГИД ПО МИРУ АВИАЦИИ</span>
          </div>
          <div className="hero-bottom-features">
            <span><b>01</b> Реальная языковая модель</span>
            <span><b>02</b> Живой веб-поиск</span>
            <span><b>03</b> Источники в ответе</span>
          </div>
          <a className="hero-scroll-link" href="#assistant" aria-label="Перейти к ассистенту">
            <span>SCROLL TO EXPLORE</span>
            <span className="scroll-line" />
          </a>
        </div>
      </section>

      <section className="assistant-section" id="assistant" aria-labelledby="assistant-title">
        <div className="section-shell assistant-layout">
          <div className="assistant-intro">
            <p className="section-kicker"><span>01</span> ЛИЧНЫЙ АВИАЦИОННЫЙ ИИ</p>
            <h2 id="assistant-title">
              Спроси.
              <br />
              <span>Разберёмся.</span>
            </h2>
            <p className="assistant-intro-copy">
              Объясняю сложное простым языком, сравниваю самолёты и ищу свежие
              факты в сети. Каждое исследование — с понятными источниками.
            </p>

            <div className="assistant-proof-list">
              <div className="proof-item">
                <span className="proof-icon proof-icon--search" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.6"/><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </span>
                <span><strong>Ищет, а не угадывает</strong><small>Актуальная информация из сети</small></span>
              </div>
              <div className="proof-item">
                <span className="proof-icon proof-icon--cite" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M7 4.5h7l4 4v11H7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M14 4.5v4h4M8.5 12h6M8.5 15.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </span>
                <span><strong>Показывает источники</strong><small>Ссылки рядом с каждым ответом</small></span>
              </div>
              <div className="proof-item">
                <span className="proof-icon proof-icon--focus" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5 14.6 9l5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                </span>
                <span><strong>Только авиационная тема</strong><small>Самолёты, отрасль и всё вокруг</small></span>
              </div>
            </div>

            <div className="aviation-scope-note">
              <span className="scope-note-icon">✳</span>
              <p><strong>Фокус FlyAI</strong> — авиация, без случайных ответов обо всём на свете.</p>
            </div>
          </div>

          <div className="chat-widget">
            <div className="chat-widget-header">
              <div className="chat-engine-title">
                <span className="chat-engine-mark">
                  <Image src="/flyai-mark.svg" alt="" width={38} height={38} />
                </span>
                <span>
                  <strong>FlyAI Assistant</strong>
                  <small>АВИАЦИОННЫЙ ИНТЕЛЛЕКТ</small>
                </span>
              </div>
              <div className={`chat-online-status chat-online-status--${connectionStatus}`}>
                <span />
                {connectionStatus === "ready" ? "НА СВЯЗИ" : connectionStatus === "missing" ? "ОЖИДАЕТ КЛЮЧ" : "ПОДКЛЮЧЕНИЕ"}
              </div>
            </div>

            {connectionStatus === "missing" && (
              <div className="configuration-notice" role="status">
                <span className="configuration-notice__icon">i</span>
                <p>
                  <strong>Подключи реальный ИИ.</strong> Добавь серверный ключ <code>OPENAI_API_KEY</code>,
                  чтобы включить ответы модели и поиск по интернету.
                </p>
              </div>
            )}

            <div className="chat-transcript" ref={transcriptRef} role="log" aria-label="Диалог с FlyAI" aria-live="polite">
              {messages.map((message) => (
                <div className={`message-row message-row--${message.role}`} key={message.id}>
                  {message.role === "assistant" && (
                    <div className="message-avatar">
                      <Image src="/flyai-mark.svg" alt="" width={34} height={34} />
                    </div>
                  )}
                  <div className="message-column">
                    <div className="message-meta">
                      {message.role === "assistant" ? "FLYAI" : "ТЫ"}
                      {message.role === "assistant" && <span>АВИАЦИОННЫЙ ИИ</span>}
                    </div>
                    <div className="message-bubble">
                      <p>{message.content}</p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="source-list">
                          <span className="source-list-label">ИСТОЧНИКИ</span>
                          {message.sources.map((source) => (
                            <a href={source.url} key={source.url} target="_blank" rel="noreferrer">
                              {source.title} <ArrowUpRight />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-row message-row--assistant" aria-label="FlyAI готовит ответ">
                  <div className="message-avatar"><Image src="/flyai-mark.svg" alt="" width={34} height={34} /></div>
                  <div className="message-column">
                    <div className="message-meta">FLYAI <span>ИЩУ И ОБЪЯСНЯЮ</span></div>
                    <div className="message-bubble typing-bubble">
                      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-composer-area">
              <p className="suggestion-heading">ПОПРОБУЙ СПРОСИТЬ</p>
              <div className="suggestion-list">
                {suggestions.map((suggestion) => (
                  <button
                    className="suggestion-chip"
                    type="button"
                    key={suggestion.label}
                    disabled={isLoading}
                    onClick={() => void sendMessage(suggestion.prompt)}
                  >
                    {suggestion.label}<ArrowUpRight />
                  </button>
                ))}
              </div>
              <form className="chat-form" onSubmit={handleSubmit}>
                <label className="visually-hidden" htmlFor="flyai-prompt">Твой вопрос об авиации</label>
                <textarea
                  id="flyai-prompt"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Спроси про самолёты, авиакомпании…"
                  rows={1}
                  maxLength={2000}
                  disabled={isLoading}
                />
                <button className="send-button" type="submit" disabled={isLoading || !input.trim()} aria-label="Отправить вопрос">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
              <div className="chat-privacy-line">
                <span>Enter — отправить</span>
                <span className="privacy-separator">·</span>
                <span>Shift + Enter — новая строка</span>
                <button type="button" onClick={resetChat} disabled={isLoading}>Новый диалог</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="discover-section" id="discover" aria-labelledby="discover-title">
        <div className="section-shell">
          <div className="discover-heading-row">
            <div>
              <p className="section-kicker"><span>02</span> КАРТА АВИАМИРА</p>
              <h2 id="discover-title">Начни с любопытства.</h2>
            </div>
            <p className="discover-heading-copy">
              Выбери направление — FlyAI разберёт вопрос глубже и поможет увидеть целую картину.
            </p>
          </div>

          <div className="topic-grid">
            {topics.map((topic) => (
              <button
                type="button"
                className={`topic-card ${topic.style}`}
                key={topic.index}
                onClick={() => startTopic(topic.prompt)}
              >
                <span className="topic-card-top"><span>{topic.category}</span><span>{topic.index}</span></span>
                <span className="topic-card-orbit" aria-hidden="true"><span /><span /></span>
                <span className="topic-card-content">
                  <strong>{topic.title}</strong>
                  <span>{topic.description}</span>
                </span>
                <span className="topic-card-action">ИССЛЕДОВАТЬ <ArrowUpRight /></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="facts-section" id="facts" aria-labelledby="facts-title">
        <div className="facts-shell">
          <div className="facts-heading-row">
            <div>
              <p className="section-kicker section-kicker--light"><span>03</span> НЕБО В ЦИФРАХ</p>
              <h2 id="facts-title">Короткий курс<br /><em>на высоте.</em></h2>
            </div>
            <p className="facts-intro-copy">
              Несколько историй из мира авиации. А если захочется больше деталей — спроси FlyAI.
            </p>
          </div>

          <div className="fact-grid">
            {facts.map((fact) => (
              <article className="fact-card" key={fact.number}>
                <div className="fact-card-meta"><span>{fact.number}</span><span>{fact.label}</span></div>
                <p className="fact-metric">{fact.metric}</p>
                <h3>{fact.title}</h3>
                <p className="fact-description">{fact.description}</p>
                <span className="fact-card-line" aria-hidden="true" />
              </article>
            ))}
          </div>
          <p className="facts-disclaimer">Общие сведения для знакомства с темой. Для эксплуатационных и актуальных данных проверяй официальные источники.</p>
        </div>
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top" aria-label="FlyAI — наверх">
          <Image src="/flyai-mark.svg" alt="" width={40} height={40} />
          <span className="brand-copy"><span className="brand-name">FlyAI</span><span className="brand-caption">AVIATION INTELLIGENCE</span></span>
        </a>
        <p>Создано для тех, кому интересно небо.</p>
        <a className="back-to-top" href="#top">НАВЕРХ <ArrowUpRight /></a>
        <span className="footer-copyright">© 2026 FLYAI</span>
      </footer>
    </main>
  );
}
