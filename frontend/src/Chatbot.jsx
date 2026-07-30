import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Bonjour ! Comment puis-je vous aider aujourd'hui ?", sender: "bot" }
    ]);
    const [input, setInput] = useState("");
    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        const newMessages = [...messages, { id: Date.now(), text: input, sender: "user" }];
        setMessages(newMessages);
        setInput("");
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                id: Date.now(), 
                text: "Merci pour votre message. Un de nos conseillers vous répondra dans les plus brefs délais.", 
                sender: "bot" 
            }]);
        }, 1000);
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
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                        msg.sender === 'user' 
                                            ? 'bg-indigo-600 text-white rounded-br-sm' 
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Écrivez votre message..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                        <button 
                            type="submit"
                            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
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