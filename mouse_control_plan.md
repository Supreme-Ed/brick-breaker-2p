# Plan: Add Mouse Control Toggle to Brick Breaker

This plan outlines the steps to add an option for using mouse control for Player 1 in the Single Player mode of the Brick Breaker game.

## Revised Plan Details:

1.  **Modify `index.html`:**
    *   **Add UI Element:** Introduce radio buttons within the `startScreen` div, specifically related to the "Single Player" option. These buttons will allow the user to choose between "Keyboard" and "Mouse" control for Player 1.
    *   **Update Controls Text:** Modify the description in the `controls` div to mention the mouse control option for Player 1.
    *   **Update `startGame` Function:** Modify the `startGame(mode)` function. When `mode` is 1 (Single Player), it should read the value of the new radio buttons to determine the chosen control method (`keyboard` or `mouse`).
    *   **Pass Parameter:** Append the selected control method as a new URL parameter (e.g., `&control=mouse`) when navigating to `brick-breaker.html` for `mode=1`.

2.  **Modify `brick-breaker.html`:**
    *   **Read Parameter:** In the `DOMContentLoaded` event listener, read the new `control` URL parameter. Store its value (e.g., 'keyboard' or 'mouse') in a new global variable, `player1ControlMethod`. Default to 'keyboard' if the parameter isn't present for mode 1.
    *   **Keep Keyboard Listeners:** Retain the existing `keydown` and `keyup` event listeners.
    *   **Add Mouse Listener:** Add a `mousemove` event listener to the canvas.
    *   **Conditional Logic in `handleMouseMove` (New Function):**
        *   This function will only update `paddle1.x` if `gameMode === 1` AND `player1ControlMethod === 'mouse'`. It should also still check if `paddle1` is frozen or ashes.
    *   **Conditional Logic in `movePaddles`:**
        *   Inside the section for Player 1 movement, specifically where keyboard input is checked, add a condition: only apply the keyboard movement logic if `gameMode === 1` AND `player1ControlMethod === 'keyboard'`.

## Mermaid Diagram:

```mermaid
graph TD
    subgraph index.html
        A[User selects Control Method (Keyboard/Mouse)] --> B[User clicks 'Single Player'];
        B --> C[startGame(1)];
        C --> D[Read selected control method];
        D --> E[Navigate to brick-breaker.html?mode=1&control={method}];
        F[Update Controls Text]
    end

    subgraph brick-breaker.html
        G[DOMContentLoaded] --> H[Read 'mode' and 'control' URL params];
        H --> I[Store gameMode and player1ControlMethod];
        I --> J[Initialize Game];

        K[User moves mouse] --> L{mousemove Listener};
        L --> M[handleMouseMove Function];
        M --> N{Is gameMode===1 AND player1ControlMethod==='mouse'?};
        N -- Yes --> O{Is paddle1 frozen/ashes?};
        N -- No --> Z[End];
        O -- No --> P[Calculate mouse X, update paddle1.x, clamp];
        O -- Yes --> Z;
        P --> Z;

        Q[User presses key] --> R{keydown/keyup Listeners};
        R --> S[Update 'keys' object];

        T[Game Loop: animate()] --> U[movePaddles()];
        U --> V{Is gameMode===1?};
        V -- Yes --> W{Is player1ControlMethod==='keyboard'?};
        V -- No --> X[Handle P1/P2 movement based on mode];
        W -- Yes --> Y[Apply keyboard logic to paddle1];
        W -- No --> Z1[Skip keyboard logic for paddle1];
        Y --> X;
        Z1 --> X;
        X --> AA[Update paddle positions];
        AA --> BB[Draw game elements];
    end
```

## Next Steps:

Switch to Code mode to implement these changes.