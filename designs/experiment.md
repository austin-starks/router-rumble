# Router placement experiment

The experiment searches two router coordinates inside a 14 × 10 metre floor plan using a simplified log-distance signal model and declared wall attenuation. It is an educational simulation, not an RF survey. The first three cases use a smooth service objective. The fourth minimizes the fraction of receivers below the signal target directly, creating flat steps in the loss.

The cases are an open room, a partitioned home, a stronger signal target, and coverage count. Both methods include (1, 1) and get 1,200 objective evaluations. Gradient descent uses four finite-difference probes and backtracking. Evolution keeps eight of 32 candidates and mutates 24 offspring. Every probe, trial step, and population evaluation counts. Recording diagnostics and a reference grid are outside both budgets.

Seed 7 was declared before the run. The audit checks seeds 0–19. All four local probes have identical coverage at the starting position in the fourth case, so gradient descent stays still. Evolution reaches 208 of 560 receivers instead of 100. This demonstrates a known limitation of local gradients on a discrete objective; it does not establish that evolution is always better.

The browser and vertical video share one renderer. The 28-second animation races the partitioned case, open-room control, and coverage-count plateau. Yellow represents gradient descent and pink represents evolution. Loss grids, states, and signal maps come from Python. Positions interpolate between recorded states for presentation; counters and signal maps hold the recorded states. Each surface is normalized independently for visibility, so the numeric loss counters carry the quantitative comparison.

The browser is silent. The video uses one premixed soundtrack of short cues and an original electronic pulse. The current preview requires review before final export under the house video-delivery gates.
