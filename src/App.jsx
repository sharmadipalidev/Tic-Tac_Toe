import { useState } from "react";
import "./App.css";

function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setXTurn] = useState(true);

  const { winner, winningLine, isDraw } = getGameState(board);
  const isGameOver = winner || isDraw;

  function handleClick(index) {
    if (board[index] || isGameOver) return;

    const newBoard = [...board];
    newBoard[index] = isXTurn ? "X" : "O";

    setBoard(newBoard);
    const nextGameState = getGameState(newBoard);
    if (!nextGameState.winner && !nextGameState.isDraw) {
      setXTurn(!isXTurn);
    }
  }

  function resetGame() {
    setBoard(Array(9).fill(null));
    setXTurn(true);
  }

  return (
    <div className="app">
      <h1>Tic Tac Toe</h1>

      <div className="status">
        {winner
          ? `Winner : ${winner}`
          : isDraw
            ? "Draw Match"
            : `Current Turn: ${isXTurn ? "X" : "O"}`}
      </div>

      <div className="board">
        {board.map((cell, index) => (
          <button
            className={`cell ${winningLine.includes(index) ? "winner-cell" : ""}`}
            key={index}
            onClick={() => handleClick(index)}
          >
            {cell}
            {winningLine.includes(index) && cell && (
              <span className="winner-tag">Winner</span>
            )}
          </button>
        ))}
      </div>

      <button className="reset-btn" onClick={resetGame}>
        Reset Game
      </button>

      {isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-card">
            <p className="game-over-label">Game Over</p>
            <h2 className="game-over-title">
              {winner ? `${winner} Wins` : "Draw Match"}
            </h2>
            <p className="game-over-message">
              {winner
                ? `${winner} completed three in a row. Play again!`
                : "Neither X nor O made three in a row. It's a Draw Match!"}
            </p>
            <button className="play-again-btn" onClick={resetGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line };
    }
  }
  return null;
}

function getGameState(board) {
  const winnerResult = calculateWinner(board);
  const winner = winnerResult?.player ?? null;
  const winningLine = winnerResult?.line ?? [];
  const isDraw = !winner && board.every((cell) => cell === "X" || cell === "O");

  return { winner, winningLine, isDraw };
}

export default App;
