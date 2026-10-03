# Router placement experiment

Optimize two continuous router coordinates inside a 14 × 10 metre floor plan.
Use a simplified log-distance signal model with explicit wall attenuation.
Smooth wall crossings and the coverage threshold so finite-difference gradient
descent has a usable objective. This is an educational simulation, not an RF
survey or an implementation of ITU P.1238.

Three rounds: open room, partitioned office, and the same office with a demanding
signal target. Both methods start at (1, 1), minimize identical loss, and spend
the same 1,200 function evaluations. Gradient descent uses central differences
and backtracking; evolution keeps eight of 32 candidates and mutates them.
Count every gradient probe, trial step, and population member. Preserve each
state and evaluate 20 seeds without selecting a favorable seed for the film.
Seed 7 is declared before the run. Compare final score, coverage, and evaluations;
use an independent grid search only as a reference, outside the search budget.

Video: persistent top-down floor plan, yellow path, purple population, scores
and evaluation counts. Three rounds reset the searches. All displayed states
come from results.json. Silent, like the source. Current assembled preview must
be reviewed before final export under video-delivery-gates.
