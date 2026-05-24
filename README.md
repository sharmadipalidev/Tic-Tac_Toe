# Elegant Tic-Tac-Toe

A modern, responsive, and beautifully styled Tic-Tac-Toe game built with **React**, **Vite**, and premium CSS animations.

---

## 🎨 Premium Features

- **Interactive 3x3 Grid Board:** Dynamic cells with smooth hover scale effects, box-shadow transitions, and custom gradients.
- **Turn Indicator:** Shows which player's turn it is (`X` or `O`) dynamically.
- **Winning Combinations Glow:** Highlighting of winning lines using dynamic animations (`winner-glow`) and an explicit "Winner" tag overlay.
- **Draw Match Detection:** Automatic detection of draw matches when all cells are filled and there is no winner.
- **Interactive Game Over Modal:** A premium blur-backdrop overlay showing the game outcome ("Wins" or "Draw Match") with an intuitive "Play Again" button.
- **Responsive Layout:** Responsive typography (`clamp`) and layouts tailored for mobile, tablet, and desktop screens.
- **Warm Aesthetic Design:** Cinematic typography (`Cinzel` & `Poppins`), paper grid backgrounds, and a curated color palette (Jade Green, Cream, Plum/Lavender accents).
- **Friends Multiplayer Mode (Online):** Real-time online play using Socket.IO. Host private rooms, share room codes, sync gameplay turns, handle opponent disconnections, and reset board states simultaneously.

---

## 🛠️ Tech Stack & Structure

- **Core Framework:** React 19
- **Build Tool:** Vite 8
- **Real-Time Layer:** Socket.IO / WebSockets
- **Backend:** Node.js, Express, Socket.IO Server
- **Styles:** Vanilla CSS with HSL-tailored colors, gradients, and custom `@keyframes` transitions.

### Project Layout

```bash
Tic-Tac-Toe/
├── dist/                # Production build artifacts
├── public/              # Static assets (Favicons, SVGs)
├── server/              # Backend server files
│   ├── package.json     # Server configuration and dependencies
│   └── server.js        # Node + Express + Socket.IO server engine
├── src/
│   ├── App.css          # Core design system and UI styling
│   ├── App.jsx          # Game engine, components, and state logic
│   ├── socket.js        # Socket.IO client service wrapper
│   └── main.jsx         # Application entry point
├── eslint.config.js     # Code quality and rules setup
├── index.html           # Root HTML structure
├── package.json         # Dependencies and script definitions
└── vite.config.js       # Vite bundler configurations
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Run

1. Clone or navigate into the repository:
   ```bash
   cd Tic-Tac-Toe
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   cd server
   npm install
   npm start
   ```
   *The server runs by default on port `3001`.*

4. In a separate terminal, start the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to the URL shown in your terminal (usually `http://localhost:5173`).
   Open your browser and navigate to the URL shown in your terminal (usually `http://localhost:5173`).

---

## 🎮 How to Play

1. Player `X` always goes first.
2. Players take turns clicking on empty cells in the 3x3 grid.
3. The first player to get **3 of their marks** in a horizontal, vertical, or diagonal row wins the game.
4. If all 9 cells are filled and neither player has 3 in a row, a **Draw Match** is declared.
5. Click **Reset Game** or **Play Again** to restart.

---

## ⚙️ Game Engine Logic

### Win Check (`calculateWinner`)
The engine checks the board against the 8 possible winning lines:
```javascript
const lines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];
```

### Draw Check (`isDraw`)
A draw is declared when there is no winner and every cell is filled with a valid marker:
```javascript
const isDraw = !winner && board.every((cell) => cell === "X" || cell === "O");
```
