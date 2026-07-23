import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation Placeholder */}
      <aside className="w-64 border-r border-border hidden md:block p-4">
        <h1 className="font-bold text-xl mb-4">ELMA Core</h1>
        <nav className="flex flex-col gap-2">
          {/* Nav links will go here */}
        </nav>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
