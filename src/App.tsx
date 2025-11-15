import { GameContainer } from './components/GameContainer';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="header">
        <h1>Jump Jump Jump!</h1>
        <div className="controls-info">
          <p>Keyboard: Arrow Keys or WASD to move | Space to restart</p>
          <p>Gamepad: D-Pad or Left Stick to move | A Button to restart</p>
        </div>
      </header>
      <GameContainer />
    </div>
  );
}

export default App;
