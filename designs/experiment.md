# Router placement experiment

The experiment optimizes two continuous router coordinates inside a 14 × 10 metre floor plan. It uses a simplified log-distance signal model with explicit wall attenuation. Wall crossings and the coverage threshold are softened so finite-difference gradient descent has a usable objective. The model is an educational simulation rather than an RF survey or an implementation of ITU P.1238.

The three scenarios cover an open room, a partitioned home, and the same home with a stronger signal target. Both methods include the starting position (1, 1), minimize the same loss, and receive 1,200 function evaluations by default. Gradient descent uses central differences and backtracking. Evolution keeps eight of 32 candidates and mutates 24 offspring. Every gradient probe, trial step, and population member counts toward the budget.

Each recorded state includes the router position and metrics. The experiment audits 20 evolutionary seeds without selecting a favorable seed for the animation. Seed 7 was declared before the run. An independent grid search provides a reference outside the search budget.

The browser replay and 33-second vertical video share one visualization. The animation shows the demanding-signal scenario on a floor plan, explains the loss surface, reveals before-and-after coverage, and includes the open-room control. Yellow represents gradient descent and pink represents evolution. All displayed optimizer positions and signal samples come from Python results.

The browser replay is silent. The video includes a premixed track of sound cues and an original electronic pulse. Under the video-delivery-gates workflow, the current assembled preview must be reviewed before final export.
