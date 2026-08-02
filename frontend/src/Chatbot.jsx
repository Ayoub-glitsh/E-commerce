import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

// Intervalle (ms) entre deux ajouts de caractères dans l'animation letter-by-letter.
const ANIMATION_INTERVAL = 25;
const API_URL = "http://localhost:5000/chat/message";

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Bonjour ! Comment puis-je vous aider aujourd'hui ?", sender: "bot" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);

    // Refs pour l'animation letter-by-letter (éviter des re-renders par frame)
    const targetTextRef = useRef(""); // texte cible complet reçu du stream
    const displayedTextRef = useRef(""); // texte actuellement affiché
    const animationIdRef = useRef(null); // id de la boucle requestAnimationFrame
    const lastFrameTimeRef = useRef(0); // timestamp du dernier "tick"
    const streamEndedRef = useRef(false); // true dès que done / stream terminé
    const activeBotIdRef = useRef(null); // id du message bot en cours d'animation
    const abortRef = useRef(null); // AbortController du fetch en cours

    const messagesEndRef = useRef(null);

    // Auto-scroll vers le bas quand les messages ou isTyping changent
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isTyping]);

    // Cleanup au démontage : annule l'animation et le fetch en cours
    useEffect(() => {
        return () => {
            if (animationIdRef.current !== null) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
            abortRef.current?.abort();
        };
    }, []);

    const animateText = (timestamp) => {
        if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = timestamp;

        if (timestamp - lastFrameTimeRef.current >= ANIMATION_INTERVAL) {
            lastFrameTimeRef.current = timestamp;

            const target = targetTextRef.current;
            const current = displayedTextRef.current;

            if (current.length < target.length) {
                // Ajoute 1-2 caractères par tick (rattrapage plus rapide si gros chunks)
                const remaining = target.length - current.length;
                const step = remaining > 20 ? 2 : 1;
                const next = target.slice(0, current.length + step);
                displayedTextRef.current = next;

                const botId = activeBotIdRef.current;
                // Met à jour uniquement le dernier message bot via le state
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === botId ? { ...msg, text: next } : msg
                    )
                );
            }
        }

        if (displayedTextRef.current.length < targetTextRef.current.length) {
            animationIdRef.current = requestAnimationFrame(animateText);
        } else {
            // Rattrapage terminé
            animationIdRef.current = null;
            lastFrameTimeRef.current = 0;
            if (streamEndedRef.current) setIsTyping(false);
        }
    };

    const startAnimation = (botId) => {
        // Démarre la boucle rAF si elle n'est pas déjà en cours
        if (animationIdRef.current !== null) return;
        activeBotIdRef.current = botId;
        lastFrameTimeRef.current = 0;
        animationIdRef.current = requestAnimationFrame(animateText);
    };

    const stopAnimation = () => {
        if (animationIdRef.current !== null) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
        }
        lastFrameTimeRef.current = 0;
        activeBotIdRef.current = null;
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isTyping) return;

        setError(null);

        const userMsg = { id: Date.now(), text, sender: "user" };
        const botMsg = { id: Date.now() + 1, text: "", sender: "bot" };
        setMessages(prev => [...prev, userMsg, botMsg]);
        setInput("");
        setIsTyping(true);

        // Historique envoyé au backend : mapper sender "bot" → "assistant"
        const historyForRequest = messages.map(m => ({
            role: m.sender === "bot" ? "assistant" : "user",
            content: m.text,
        }));

        // Réinitialise l'état d'animation pour cette réponse
        targetTextRef.current = "";
        displayedTextRef.current = "";
        streamEndedRef.current = false;
        activeBotIdRef.current = botMsg.id;

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    conversation_history: historyForRequest,
                }),
                signal: controller.signal,
            });

            if (!res.ok || !res.body) throw new Error("Réponse serveur invalide");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n\n");
                buffer = lines.pop(); // fragment incomplet conservé pour le prochain tour

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;

                    let payload;
                    try {
                        payload = JSON.parse(line.slice(6));
                    } catch (parseErr) {
                        continue; // ligne SSE malformée : on l'ignore
                    }

                    if (payload.delta) {
                        // Accumulation dans targetText ; l'animation affiche
                        // progressivement letter-by-letter via requestAnimationFrame.
                        targetTextRef.current += payload.delta;
                        startAnimation(botMsg.id);
                    }
                    if (payload.error) {
                        setError(payload.error);
                    }
                    // payload.done : ne pas couper l'animation immédiatement.
                    // C'est dans finally que streamEnded passe à true, et animateText()
                    // masquera l'indicateur quand displayedText aura rattrapé targetText.
                }
            }
        } catch (err) {
            if (err.name === "AbortError") return; // reset/nettoyage → silence
            setError("Connexion au chatbot impossible.");
            setIsTyping(false);
        } finally {
            streamEndedRef.current = true;
            // Masquer l'indicateur seulement si l'animation a fini de rattraper.
            if (animationIdRef.current === null) setIsTyping(false);
            if (abortRef.current === controller) abortRef.current = null;
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all hover:-translate-y-1"
                >
                    <MessageCircle size={24} />
                </button>
            )}
            {isOpen && (
                <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[500px] transition-all animate-in slide-in-from-bottom-5">
                    <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <h3 className="font-semibold">Support Client</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-indigo-100 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                                        msg.sender === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-sm'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 text-gray-400 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 text-sm flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                    <span className="ml-1 text-xs">en train d'écrire...</span>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="text-red-600 text-xs text-center py-1">
                                {error}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Écrivez votre message..."
                            disabled={isTyping}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="submit"
                            disabled={isTyping || !input.trim()}
                            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Chatbot;
