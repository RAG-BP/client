"use client";
import React, { useState } from 'react';

// Definisanje tipova za podatke koje dobijamo od API-ja (ako koristite TypeScript)
interface Source {
    title: string;
    url: string;
    category: string;
    score: string; // Score je string jer ga Python šalje kao formatirani string
}

interface RagResponse {
    response: string;
    sources: Source[];
}

const ChatInterface: React.FC = () => {
    const [query, setQuery] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [ragResponse, setRagResponse] = useState<RagResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Dohvatanje API URL-a iz varijabli okruženja
    // `process.env.NEXT_PUBLIC_API_URL` će biti `http://localhost:5000/query`
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/query';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Sprečava podrazumevano ponašanje forme (reload stranice)
        if (!query.trim()) return; // Ne šalji prazan upit

        setLoading(true);
        setRagResponse(null); // Resetuj prethodni odgovor
        setError(null); // Resetuj grešku

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }), // Šalje pitanje kao JSON
            });

            if (!response.ok) { // Provera da li je odgovor HTTP 200 OK
                const errorData = await response.json();
                throw new Error(errorData.error || 'Greška prilikom komunikacije sa API-jem.');
            }

            const data: RagResponse = await response.json(); // Parsiranje JSON odgovora
            setRagResponse(data);
        } catch (err: any) {
            setError(err.message || 'Došlo je do nepoznate greške.');
            console.error("Fetch error:", err); // Logovanje greške za debagovanje
        } finally {
            setLoading(false);
            setQuery(''); // Očisti input polje
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 bg-gray-100 rounded-lg shadow-md mt-10">
            <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-800">
                Bačka Palanka Vesti Chatbot
            </h1>

            <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
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
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
                    disabled={loading}
                >
                    {loading ? 'Učitavam...' : 'Pitaj'}
                </button>
            </form>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Greška:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            {ragResponse && (
                <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-200">
                    <h2 className="text-xl font-semibold mb-3 text-gray-700">Odgovor:</h2>
                    <p className="text-gray-800 leading-relaxed mb-6 whitespace-pre-wrap">{ragResponse.response}</p>

                    {ragResponse.sources && ragResponse.sources.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-700">Izvori korišćeni za odgovor:</h3>
                            <ul className="list-disc pl-5 space-y-3">
                                {ragResponse.sources.map((source, index) => (
                                    <li key={index} className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">
                                        <p className="font-medium text-blue-800">{source.title}</p>
                                        <p className="text-sm text-gray-600">Kategorija: <span className="font-semibold">{source.category}</span></p>
                                        <p className="text-sm text-gray-600">Relevantnost: <span className="font-semibold">{source.score}</span></p>
                                        {source.url !== 'N/A' && ( // Prikaži URL samo ako nije 'N/A'
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-sm break-all" // break-all za duge URL-ove
                                            >
                                                {source.url}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatInterface;