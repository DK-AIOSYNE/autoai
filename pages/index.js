import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text:
        "Bonjour 👋! Je suis **AutoAI**, une intelligence artificielle conçue par les développeurs Re-Fap pour t'aider à diagnostiquer gratuitement des éventuels problèmes sur ton filtre à particules ou ta voiture, et à trouver des solutions. As-tu des questions ?😄"
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function getHistoriqueText() {
    const lastMessages = messages.slice(-5);
    return lastMessages
      .map((m) => (m.from === 'user' ? `Moi: ${m.text}` : `AutoAI: ${m.text}`))
      .join('\n');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || blocked) return;

    if (input.trim().length > 1000) {
      setError('⚠️ Ton message ne peut pas dépasser 1000 caractères.');
      return;
    }

    const userMsg = { from: 'user', text: input.trim() };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    const historiqueText = getHistoriqueText() + `\nMoi: ${input.trim()}`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input.trim(),
          historique: historiqueText,
        }),
      });

      if (!res.ok) {
        // Gestion d'erreur spécifique (ex: 429 service tier exceeded)
        setLoading(false);
        if (res.status === 429) {
          setMessages((msgs) => [
            ...msgs,
            { from: 'bot', text: "⚠️ Le service est temporairement saturé, merci de réessayer plus tard." },
          ]);
        } else {
          setMessages((msgs) => [
            ...msgs,
            { from: 'bot', text: `Erreur serveur ${res.status}` },
          ]);
        }
        return;
      }

      const data = await res.json();
      setLoading(false);

      const botMsg = {
        from: 'bot',
        text: data.reply || "Désolé, le service a reçu trop de messages en même temps, merci de renvoyer votre message :).",
      };
      setMessages((msgs) => [...msgs, botMsg]);

      // Bloquer l'input si la limite de 10 messages est atteinte
      if (data.reply.includes("Tu as déjà échangé 10 messages")) {
        setBlocked(true);
      }

    } catch {
      setLoading(false);
      setMessages((msgs) => [
        ...msgs,
        { from: 'bot', text: "Désolé, il y a eu une erreur réseau, merci d'actualiser la page :)." },
      ]);
    }
  }

  return (
    <>
      <Head>
        <title>Auto AI</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <main className="container">
        <h1>AutoAI par Re-Fap</h1>

        <div className="chat-and-button">
          <div id="chat-window" className="chat-window">
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? 'user-msg' : 'bot-msg'}>
                <strong>{m.from === 'user' ? 'Moi' : 'AutoAI'}:</strong>
                <ReactMarkdown skipHtml>{m.text.replace(/\n{2,}/g, '\n')}</ReactMarkdown>
              </div>
            ))}

            {loading && (
              <div className="bot-msg typing-indicator">
                <strong>AutoAI:</strong>
                <span className="dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="garage-button-container">
            <a href="https://re-fap.fr/trouver_garage_partenaire/" className="garage-button">
              Trouver un garage<br />partenaire Re-Fap🔧
            </a>
            <a href="https://auto.re-fap.fr" className="carter-button">
              Trouver un <br/>Carter Cash 🛠️
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            placeholder="Écris ta question ici..."
            value={input}
            onChange={(e) => {
              if (e.target.value.length <= 1000) {
                setInput(e.target.value);
                setError('');
              } else {
                setError('⚠️ Ton message ne peut pas dépasser 1000 caractères.');
              }
            }}
            autoComplete="off"
            id="user-input"
            disabled={blocked}
          />
          <button type="submit" disabled={blocked}>Envoyer</button>
        </form>
        {error && <p className="error-msg">{error}</p>}
      </main>

      <footer className="footer">
        <p>⚠️ AutoAI peut faire des erreurs, envisagez de vérifier les informations importantes.</p>
      </footer>
    </>
  );
}
