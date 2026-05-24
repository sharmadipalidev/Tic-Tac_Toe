import { useState, useEffect } from "react";
import "./App.css";
import { connectSocket, getSocket, disconnectSocket } from "./socket";

function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [mode, setMode] = useState("menu"); // "menu" | "local" | "friends-setup" | "friends-playing"
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mySymbol, setMySymbol] = useState(null); // "X" or "O"
  const [opponentName, setOpponentName] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  // Derive turn directly from the board state (X always goes first)
  const isXTurn = board.filter((cell) => cell !== null).length % 2 === 0;

  const { winner, winningLine, isDraw } = getGameState(board);
  const isGameOver = winner || isDraw;

  // Determine if it is the current client's turn in friends mode
  const isFriendsMode = mode === "friends-playing";
  const myTurn = !isFriendsMode || (isXTurn && mySymbol === "X") || (!isXTurn && mySymbol === "O");

  useEffect(() => {
    if (mode !== "friends-playing" && mode !== "friends-setup") {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();

    socket.on("room-created", ({ roomCode, symbol }) => {
      setRoomCode(roomCode);
      setMySymbol(symbol);
      setIsWaiting(true);
      setRoomError("");
      setOpponentDisconnected(false);
      setBoard(Array(9).fill(null));
      setMode("friends-playing");
    });

    socket.on("player-joined", ({ opponentName }) => {
      setOpponentName(opponentName);
      setIsWaiting(false);
    });

    socket.on("room-joined", ({ roomCode, symbol, opponentName }) => {
      setRoomCode(roomCode);
      setMySymbol(symbol);
      setOpponentName(opponentName);
      setIsWaiting(false);
      setRoomError("");
      setOpponentDisconnected(false);
      setBoard(Array(9).fill(null));
      setMode("friends-playing");
    });

    socket.on("room-error", ({ message }) => {
      setRoomError(message);
    });

    socket.on("move-made", ({ index }) => {
      setBoard((prevBoard) => {
        if (prevBoard[index]) return prevBoard;
        const newBoard = [...prevBoard];
        const currentTurnSymbol = newBoard.filter((cell) => cell !== null).length % 2 === 0 ? "X" : "O";
        newBoard[index] = currentTurnSymbol;
        return newBoard;
      });
    });

    socket.on("game-reset", () => {
      setBoard(Array(9).fill(null));
    });

    socket.on("player-disconnected", () => {
      setOpponentDisconnected(true);
    });

    return () => {
      socket.off("room-created");
      socket.off("player-joined");
      socket.off("room-joined");
      socket.off("room-error");
      socket.off("move-made");
      socket.off("game-reset");
      socket.off("player-disconnected");
    };
  }, [mode]);

  function handleClick(index) {
    if (board[index] || isGameOver) return;

    if (isFriendsMode) {
      if (isWaiting || !myTurn) return;
      const socket = getSocket();
      if (socket) {
        socket.emit("make-move", { roomCode, index });
      }
    }

    const currentSymbol = isXTurn ? "X" : "O";
    setBoard((prev) => {
      const newBoard = [...prev];
      newBoard[index] = currentSymbol;
      return newBoard;
    });
  }

  function resetGame() {
    if (isFriendsMode) {
      const socket = getSocket();
      if (socket) {
        socket.emit("reset-game", { roomCode });
      }
    } else {
      setBoard(Array(9).fill(null));
    }
  }

  function backToMenu() {
    setMode("menu");
    setRoomCode("");
    setMySymbol(null);
    setOpponentName("");
    setIsWaiting(false);
    setRoomError("");
    setOpponentDisconnected(false);
    setBoard(Array(9).fill(null));
    disconnectSocket();
  }

  function handleCreateRoom() {
    if (!playerName.trim()) {
      setRoomError("Please enter your name first.");
      return;
    }
    const socket = connectSocket();
    socket.emit("create-room", { playerName: playerName.trim() });
  }

  function handleJoinRoom() {
    if (!playerName.trim()) {
      setRoomError("Please enter your name first.");
      return;
    }
    if (!roomCode.trim()) {
      setRoomError("Please enter a room code to join.");
      return;
    }
    const socket = connectSocket();
    socket.emit("join-room", {
      roomCode: roomCode.trim(),
      playerName: playerName.trim(),
    });
  }

  // --- Menu View ---
  if (mode === "menu") {
    return (
      <div className="app menu-container">
        <h1>Tic Tac Toe</h1>
        <p className="menu-subtitle">A Premium Sketch Classic</p>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={() => setMode("local")}>
            Local Play
          </button>
          <button
            className="menu-btn alternative"
            onClick={() => setMode("friends-setup")}
          >
            Play with Friend
          </button>
        </div>
      </div>
    );
  }

  // --- Friends Setup View ---
  if (mode === "friends-setup") {
    return (
      <div className="app setup-container">
        <h1>Friends Mode</h1>
        <div className="setup-card">
          <div className="input-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              className="sketch-input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="setup-actions">
            <button className="action-btn" onClick={handleCreateRoom}>
              Create Room
            </button>
            <div className="join-group">
              <input
                type="text"
                className="sketch-input code-input"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
              <button className="action-btn" onClick={handleJoinRoom}>
                Join Room
              </button>
            </div>
          </div>

          {roomError && <div className="error-message">{roomError}</div>}

          <button className="back-btn" onClick={backToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // --- Playing View (both Local and Friends Mode) ---
  const currentTurnSymbol = isXTurn ? "X" : "O";
  const statusMessage = isFriendsMode
    ? isWaiting
      ? `Waiting for opponent... Code: ${roomCode}`
      : myTurn
        ? `Your Turn (${mySymbol})`
        : `${opponentName}'s Turn (${currentTurnSymbol})`
    : `Current Turn: ${currentTurnSymbol}`;

  const gameOverTitle = isFriendsMode
    ? winner
      ? winner === mySymbol
        ? "You Win!"
        : "You Lose!"
      : "Draw Match"
    : winner
      ? `${winner} Wins`
      : "Draw Match";

  const gameOverMessage = isFriendsMode
    ? winner
      ? winner === mySymbol
        ? `Congratulations! You beat ${opponentName}.`
        : `${opponentName} got three in a row. Better luck next time!`
      : "Neither player made three in a row. It's a Draw!"
    : winner
      ? `${winner} completed three in a row. Play again!`
      : "Neither X nor O made three in a row. It's a Draw Match!";

  return (
    <div className="app">
      <h1>Tic Tac Toe</h1>

      <div className={`status ${isWaiting ? "waiting-status" : ""}`}>
        {isWaiting ? (
          <>
            <div>Waiting for Player 2...</div>
            <div className="room-code-display">
              Room Code: <strong>{roomCode}</strong>
            </div>
          </>
        ) : (
          statusMessage
        )}
      </div>

      <div className={`board ${isWaiting ? "board-locked" : ""}`}>
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

      <div className="game-actions">
        {!isWaiting && (
          <button className="reset-btn" onClick={resetGame}>
            Reset Game
          </button>
        )}
        <button className="leave-btn" onClick={backToMenu}>
          Leave Game
        </button>
      </div>

      {isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-card">
            <p className="game-over-label">Game Over</p>
            <h2 className="game-over-title">{gameOverTitle}</h2>
            <p className="game-over-message">{gameOverMessage}</p>
            <button className="play-again-btn" onClick={resetGame}>
              Play Again
            </button>
          </div>
        </div>
      )}

      {opponentDisconnected && (
        <div className="game-over-overlay">
          <div className="game-over-card">
            <p className="game-over-label">Disconnected</p>
            <h2 className="game-over-title" style={{ fontSize: "2.1rem" }}>
              Opponent Left
            </h2>
            <p className="game-over-message">
              Your opponent disconnected. The game has ended.
            </p>
            <button className="play-again-btn" onClick={backToMenu}>
              Back to Menu
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
