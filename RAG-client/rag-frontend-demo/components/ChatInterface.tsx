"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Info } from 'lucide-react';

// Definisanje interfejsa za poruke u chatu
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Interfejs za izvor podataka (source)
interface Source {
    title: string;
    url: string;
    category: string;
    score: string;
}

// Interfejs za odgovor od RAG API-ja
interface RagResponse {
    response: string;
    sources: Source[];
}

const ChatInterface: React.FC = () => {
    const [query, setQuery] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]); // Novo stanje za istoriju chata
    const [currentSources, setCurrentSources] = useState<Source[]>([]); // Stanje za izvore poslednjeg odgovora
    const [error, setError] = useState<string | null>(null);

    // Referenca za skrolovanje na dno chata
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // URL za backend API
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/query';

    // Funkcija za automatsko skrolovanje na dno
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Efekat za skrolovanje kada se chatHistory promeni
    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMessage: ChatMessage = { role: 'user', content: query };
        // Dodajemo korisnikovu poruku u istoriju odmah
        setChatHistory((prevHistory) => [...prevHistory, userMessage]);
        setQuery(''); // Čistimo input polje
        setCurrentSources([]); // Resetujemo izvore za novi upit

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: userMessage.content, // Trenutni upit
                    chat_history: chatHistory, // Cela istorija razgovora
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Greška prilikom komunikacije sa API-jem.');
            }

            const data: RagResponse = await response.json();
            const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };

            // Dodajemo odgovor asistenta u istoriju
            setChatHistory((prevHistory) => [...prevHistory, assistantMessage]);
            setCurrentSources(data.sources || []); // Ažuriramo izvore za prikaz
        } catch (err: any) {
            setError(err.message || 'Došlo je do nepoznate greške.');
            console.error("Fetch error:", err);
            // Ako dođe do greške, možemo ukloniti korisnikovu poruku ili dodati poruku o grešci
            setChatHistory((prevHistory) => prevHistory.slice(0, -1)); // Uklanjamo poslednju (korisnikovu) poruku ako je došlo do greške
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 bg-gray-100 rounded-lg shadow-md mt-10 flex flex-col h-[80vh]">
            <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-800">
                Bačka Palanka Vesti Chatbot
            </h1>

            {/* Prozor za prikaz poruka */}
            <div className="flex-grow overflow-y-auto p-4 bg-white rounded-lg shadow-inner mb-4 space-y-4">
                {chatHistory.length === 0 && !loading && !error && (
                    <div className="text-center text-gray-500 italic p-4">
                        Postavite pitanje da započnete razgovor!
                    </div>
                )}
                {chatHistory.map((message, index) => (
                    <div
                        key={index}
                        className={`p-3 rounded-lg max-w-[80%] ${message.role === 'user'
                                ? 'bg-blue-500 text-white ml-auto rounded-br-none'
                                : 'bg-gray-200 text-gray-800 mr-auto rounded-bl-none'
                            }`}
                    >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                ))}
                {loading && (
                    <div className="p-3 rounded-lg bg-gray-200 text-gray-800 mr-auto flex items-center">
                        <Loader2 className="animate-spin mr-2" size={20} /> Učitavam...
                    </div>
                )}
                <div ref={messagesEndRef} /> {/* Prazan div za skrolovanje */}
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center" role="alert">
                    <Info className="mr-2" size={20} />
                    <strong className="font-bold">Greška:</strong>
                    <span className="block sm:inline ml-1"> {error}</span>
                </div>
            )}

            {/* Prikaz izvora za poslednji AI odgovor */}
            {currentSources.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200 mb-4">
                    <h3 className="text-md font-semibold mb-2 text-gray-700 flex items-center">
                        <Info className="mr-2" size={18} /> Izvori korišćeni za odgovor:
                    </h3>
                    {/* <ul className="list-disc pl-5 space-y-2 text-sm">
                        {currentSources.map((source, index) => (
                            <li key={index} className="text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100">
                                <p className="font-medium text-blue-800">{source.title}</p>
                                <p className="text-xs text-gray-600">Kategorija: <span className="font-semibold">{source.category}</span></p>
                                <p className="text-xs text-gray-600">Relevantnost: <span className="font-semibold">{source.score}</span></p>
                                {source.url !== 'N/A' && (
                                    <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-xs break-all"
                                    >
                                        {source.url}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul> */}
                </div>
            )}

            {/* Forma za unos pitanja */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Postavite pitanje o Bačkoj Palanci..."
                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out flex items-center justify-center"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    <span className="ml-2">{loading ? 'Učitavam...' : 'Pitaj'}</span>
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
