import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <h1>🏆 Live Sports Results</h1>
          <p>Real-time scores for NHL and NFL games</p>
          <p>Test version - React is working!</p>
        </div>
      </header>

      <main className="container">
        <div className="loading">
          <div className="loading-spinner">⏳</div>
          Loading games...
        </div>
      </main>
    </div>
  );
}

export default App;