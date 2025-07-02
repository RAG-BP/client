import ChatInterface from '../components/ChatInterface';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <ChatInterface />
    </main>
  );
}