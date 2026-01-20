import React, { useState } from "react";
import LoginForm from "./components/LoginForm";
import "./styles/App.css";

const App = () => {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  const handleLogin = (result) => {
    if (result.error) {
      setError(result.error);
      setSession(null);
      return;
    }

    setError("");
    setSession(result);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">OTIC CCHC</p>
          <h1>Modulo de Login</h1>
          <p className="app-subtitle">Acceso seguro y registro de intentos.</p>
        </div>
      </header>

      <main className="app-main">
        <LoginForm onSuccess={handleLogin} />
        {error && <p className="app-error">{error}</p>}
        {session?.token && (
          <div className="app-token">
            <h2>Token generado</h2>
            <code>{session.token}</code>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
