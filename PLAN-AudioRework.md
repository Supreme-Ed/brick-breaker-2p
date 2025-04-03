# Plan: Rework Audio System for Audio Files

**Goal:** Replace the current synthesized sound generation with a system that loads and plays pre-recorded audio files using the Web Audio API.

**Steps:**

1.  **Assets:**
    *   Create `assets/audio/` directory.
    *   Place required audio files (e.g., `hit.wav`, `score.mp3`, `laser.ogg`, etc.) inside.

2.  **AudioManager Refactoring (`js/utils/audio.js`):**
    *   **Define Sound Files:** Add a constant map `SOUND_FILES` mapping sound names to file paths.
    *   **Concurrent Loading:** Implement an `async loadAudioFiles()` method using `Object.entries` and `Promise.all` to fetch and decode all files concurrently, storing results in `this.soundBuffers`. Handle errors gracefully.
    *   **Update `init()`:** Make `init` `async` and have it `await this.loadAudioFiles()` after creating the `audioContext`.
    *   **Single `playSound(soundName)` Method:** Create this method to check state, get the buffer, create a source node, connect to gain, and play.
    *   **Cleanup:** Remove old synthesis methods (`_playNote`, `_actuallyPlayNote`, specific `play...` methods).

3.  **Update Sound Triggers (e.g., in `js/core/physics.js`):**
    *   Replace calls like `audioManager.playScore()` with `audioManager.playSound('score')`, using the keys defined in `SOUND_FILES`.

4.  **Initialization Update:**
    *   Locate the `audioManager.init()` call (likely `main.js` or `game.js`). Ensure the game `await`s this `async` call before starting gameplay.

5.  **Testing:**
    *   Thoroughly test all game actions trigger the correct audio files.
    *   Verify mute/unmute functionality.
    *   Check cross-browser compatibility.

6.  **Documentation:**
    *   Update `TASKS.md` (mark task complete), `README.md`, and `PRD.md` to reflect the use of audio files.

**Mermaid Diagram:**

```mermaid
sequenceDiagram
    participant InitScript as main.js / game.js
    participant AM as AudioManager
    participant Browser as Web Audio API / Browser

    InitScript->>AM: await init()
    AM->>Browser: new AudioContext()
    Browser-->>AM: audioContext created
    AM->>AM: await loadAudioFiles() # Uses Promise.all internally
    loop For Each Sound File (Concurrent)
        AM->>Browser: fetch('assets/audio/sound.wav') / decodeAudioData
        Browser-->>AM: AudioBuffer
        AM->>AM: storeBuffer('soundName', AudioBuffer)
    end
    AM-->>InitScript: init() Promise Resolved
    Note over InitScript: Game can now start

    participant Physics as physics.js
    Physics->>AM: playSound('score')
    AM->>Browser: createBufferSource() / set buffer / connect / start()
    Note right of Browser: Score sound file plays