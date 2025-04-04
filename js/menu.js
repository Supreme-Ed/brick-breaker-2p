import { audioManager } from './utils/audio.js'; // Import the singleton instance
import { createInputManager } from './controllers/input.js'; // Import InputManager factory

function startGame(mode) {
    let url = `game.html?mode=${mode}`;
    if (mode === 1) {
        const selectedControl = document.querySelector('input[name="p1Control"]:checked').value;
        url += `&control=${selectedControl}`;
    }
    window.location.href = url;
}

document.addEventListener('DOMContentLoaded', function() {
    // Ensure InputManager instance exists (to catch first interaction for audio)
    if (!window.inputManager) {
         console.log("[Menu] Creating dummy InputManager for audio trigger...");
         window.inputManager = createInputManager(document.createElement('canvas'));
    }

    // Removed local AudioManager creation. Rely on the imported singleton.

    // --- Game Mode Buttons ---
    const singlePlayerBtn = document.getElementById('startSinglePlayer');
    const twoPlayersBtn = document.getElementById('startTwoPlayers');
    const aiVsAiBtn = document.getElementById('startAiVsAi');

    if (singlePlayerBtn) {
        singlePlayerBtn.addEventListener('click', () => {
            // Attempt to resume/init audio context on click, just before playing sound
            if (audioManager) audioManager.tryResumeContext();
            
            if (audioManager && audioManager.isInitialized) {
                 audioManager.playSound('uiClick');
            } else {
                 // Don't warn if init hasn't happened yet, tryResumeContext handles logs
                 // console.warn("[Menu Click] AudioManager not ready for uiClick.");
            }
            startGame(1);
        });
    }
    if (twoPlayersBtn) {
        twoPlayersBtn.addEventListener('click', () => {
            // Attempt to resume/init audio context on click, just before playing sound
            if (audioManager) audioManager.tryResumeContext();

            if (audioManager && audioManager.isInitialized) {
                 audioManager.playSound('uiClick');
            } else {
                 // console.warn("[Menu Click] AudioManager not ready for uiClick.");
            }
            startGame(2);
        });
    }
    if (aiVsAiBtn) {
        aiVsAiBtn.addEventListener('click', () => {
            // Attempt to resume/init audio context on click, just before playing sound
            if (audioManager) audioManager.tryResumeContext();

            if (audioManager && audioManager.isInitialized) {
                 audioManager.playSound('uiClick');
            } else {
                 // console.warn("[Menu Click] AudioManager not ready for uiClick.");
            }
            startGame(3);
        });
    }

    // --- Radio Button Logic ---
    const radioButtons = document.querySelectorAll('input[name="p1Control"]');
    let currentlyChecked = document.querySelector('input[name="p1Control"]:checked');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() { 
            if (this.checked) {
                currentlyChecked = this;
            }
        });

        const label = document.querySelector(`label[for="${radio.id}"]`);
        if (label) {
            label.addEventListener('click', () => {
                if (!radio.checked) {
                    radio.checked = true;
                    const event = new Event('change');
                    radio.dispatchEvent(event);
                }
            });
        }
    });

    // --- Controls Toggle Logic ---
    const controlsDiv = document.querySelector('.controls');
    const toggleBtn = document.getElementById('toggleControlsBtn');
    const startScreenDiv = document.getElementById('startScreen');

    if (toggleBtn && controlsDiv && startScreenDiv) { // Added startScreenDiv check
        toggleBtn.addEventListener('click', () => {
            // Attempt to resume/init audio context on click, just before playing sound
            if (audioManager) audioManager.tryResumeContext();

            if (audioManager && audioManager.isInitialized) {
                 audioManager.playSound('uiClick'); // Play sound on toggle
            } else {
                 // console.warn("[Menu Click] AudioManager not ready for uiClick.");
            }
            const isVisible = controlsDiv.classList.contains('visible');
            if (isVisible) {
                controlsDiv.classList.remove('visible');
                toggleBtn.textContent = 'Controls Help';
                startScreenDiv.classList.remove('controls-expanded');
            } else {
                controlsDiv.classList.add('visible');
                toggleBtn.textContent = 'Hide Controls';
                startScreenDiv.classList.add('controls-expanded');
            }
        });
    } else {
        // Add warnings if elements are not found
        if (!toggleBtn) console.warn("Toggle Controls Button (#toggleControlsBtn) not found.");
        if (!controlsDiv) console.warn("Controls Div (.controls) not found.");
        if (!startScreenDiv) console.warn("Start Screen Div (#startScreen) not found.");
    }
});