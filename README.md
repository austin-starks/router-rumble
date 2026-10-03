# Where should the Wi-Fi router go?

A small Python experiment racing gradient descent against population-based
evolution on a practical optimization problem: router placement.

## Run

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python experiment.py
python -m unittest -v
python build_preview.py
```

Open `demo.html` to watch the recorded race. No server or AI API needed.

## What actually runs

One router, two coordinates, a 14 × 10 metre floor plan, and 560 uniformly
spaced receivers. The signal approximation is `-40 - 24*log10(max(distance,1))`
dBm, minus wall penalties. Walls cost 7 or 9 dB in this illustrative model.
Crossing masks are softened over 0.18 metres to give the gradient method a
smooth objective. The objective averages `sigmoid((RSSI-target)/3)` across
receivers. **Service score** is this average × 100; **coverage** is the separate
percentage of receivers whose RSSI meets the target. Neither is throughput.

Gradient descent uses central finite differences (four probes per step), a
learning rate of 30, and backtracking. Evolution keeps the eight best of 32
candidates and mutates 24 offspring with Gaussian noise; mutation standard
deviation starts at 2.7 metres and decays by 4.5% per generation to a 0.18m
floor. There is no crossover. Both include the exact start `(1,1)`; evolution
also initializes nearby candidates. All search calls count toward the same
1,200-evaluation budget. Recording diagnostics and the independent 57 × 41
reference grid are outside that budget for both methods. Evaluations are not
wall-clock time, and analytic/autodiff gradients could be cheaper.

Seed 7 was selected before running. Twenty evolutionary seeds (0–19) provide a
stability check; GD is deterministic. The open room is a control. The office
and stricter-target rounds share the same geometry; the latter changes the
target from -67 to -57 dBm, not the optimizer. The visualization replays actual
states at a common evaluation count, with no invented winning path.

## Recorded results

| Round | Start score | Gradient descent | Evolution, seed 7 | Evolution wins across 20 seeds |
|---|---:|---:|---:|---:|
| Open room | 80.9 | 96.5 | 96.5 | 0/20 |
| Office walls | 37.1 | 63.6 | 67.1 | 20/20 |
| Stricter target | 18.1 | 28.0 | 35.9 | 20/20 |

“Win” here means final score exceeds GD by more than 0.1 points. These are
results for these layouts, starting point, smoothing, and hyperparameters.
They do not establish a general winner or performance on neural networks.

## Model limits and references

This is an educational simulation of a real problem, not a measured building,
RF survey, ray tracer, or implementation of ITU P.1238. It omits interference,
reflections, floors, antenna patterns, furniture, and channel congestion.
Wall and signal parameters are declared assumptions, not calibrated data.
The 1m distance floor also creates a small nonsmooth region.

Indoor propagation models commonly account for distance and walls; see
[ITU-R P.1238](https://www.itu.int/rec/R-REC-P.1238) and the
[ns-3 building model documentation](https://www.nsnam.org/docs/models/html/buildings-design.html).
Visual inspiration: [ModularMind8’s gradient-descent/evolution animation](https://www.reddit.com/r/deeplearning/comments/1wvuu24/gradient_descent_vs_evolution_on_three_loss/).
All demo graphics and experiment code here are newly authored.
