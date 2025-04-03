// global.d.ts
import { Game } from '../../../js/core/game'; // Adjust the path as necessary

declare global {
  interface Window {
    game: Game;
    audioManager: any; // Or import AudioManager and use its type
    debug: (message: string) => void;
  }
}
