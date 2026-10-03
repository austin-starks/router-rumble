"""Reproducible router-placement race; all distances are metres."""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np

BOUNDS = np.array([[0.3, 13.7], [0.3, 9.7]])
START = np.array([1.0, 1.0])
BUDGET = 1200
FEATURED_SEED = 7


def sigmoid(value: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(value, -60, 60)))


@dataclass
class Room:
    name: str
    walls: list[tuple[float, float, float, float, float]]
    target: float

    def __post_init__(self) -> None:
        xx, yy = np.meshgrid(np.linspace(0.4, 13.6, 28), np.linspace(0.4, 9.6, 20))
        self.receivers = np.column_stack([xx.ravel(), yy.ravel()])

    def signal(self, positions: np.ndarray) -> np.ndarray:
        """Smooth educational model: -40 dBm at 1m, exponent 2.4.

        Axis-aligned walls use soft opposite-side and crossing-extent masks.
        The 0.18m softness approximates a wall transition, not measured physics.
        """
        tx = np.atleast_2d(positions)[:, None, :]
        rx = self.receivers[None, :, :]
        delta = rx - tx
        distance = np.maximum(np.linalg.norm(delta, axis=2), 1.0)
        rssi = -40.0 - 24.0 * np.log10(distance)
        for x1, y1, x2, y2, loss in self.walls:
            axis = 0 if x1 == x2 else 1
            other = 1 - axis
            plane = x1 if axis == 0 else y1
            lo, hi = sorted((y1, y2) if axis == 0 else (x1, x2))
            a = sigmoid((tx[:, :, axis] - plane) / 0.18)
            b = sigmoid((rx[:, :, axis] - plane) / 0.18)
            crossing = a * (1 - b) + (1 - a) * b
            # Regularized line-plane intersection avoids division by zero.
            d = delta[:, :, axis]
            fraction = (plane - tx[:, :, axis]) * d / (d * d + 0.01)
            along = tx[:, :, other] + fraction * delta[:, :, other]
            extent = sigmoid((along - lo) / 0.18) * sigmoid((hi - along) / 0.18)
            rssi -= loss * crossing * extent
        return rssi

    def loss(self, positions: np.ndarray) -> np.ndarray:
        return 1.0 - sigmoid((self.signal(positions) - self.target) / 3.0).mean(axis=1)

    def metrics(self, position: np.ndarray) -> dict:
        signal = self.signal(position)[0]
        return {"score": float(100 * (1 - self.loss(position)[0])),
                "coverage": float(100 * np.mean(signal >= self.target))}


WALLS = [(4.5, 0, 4.5, 7.5, 9), (9, 2.5, 9, 10, 9),
         (4.5, 5, 9, 5, 7), (0, 7.5, 4.5, 7.5, 7)]
ROOMS = [Room("Open room", [], -67), Room("Office walls", WALLS, -67),
         Room("Stricter signal target", WALLS, -57)]


def clip(position: np.ndarray) -> np.ndarray:
    return np.clip(position, BOUNDS[:, 0], BOUNDS[:, 1])


def state(room: Room, position: np.ndarray, evaluations: int,
          population: np.ndarray | None = None) -> dict:
    result = {"position": position.tolist(), "evaluations": evaluations,
              **room.metrics(position)}
    if population is not None:
        result["population"] = population.tolist()
    return result


def gradient_descent(room: Room, budget: int = BUDGET) -> list[dict]:
    position = START.copy()
    current = float(room.loss(position)[0])
    evaluations = 1
    history = [state(room, position, evaluations)]
    step = 0.03
    while evaluations + 5 <= budget:
        probes = np.array([position + [step, 0], position - [step, 0],
                           position + [0, step], position - [0, step]])
        losses = room.loss(probes)
        evaluations += 4
        gradient = np.array([losses[0] - losses[1], losses[2] - losses[3]]) / (2 * step)
        rate = 30.0
        while evaluations < budget:
            candidate = clip(position - rate * gradient)
            trial = float(room.loss(candidate)[0])
            evaluations += 1
            if trial <= current or rate < 0.001:
                position, current = candidate, trial
                break
            rate *= 0.5
        history.append(state(room, position, evaluations))
    # Spend remaining budget checking incumbent, keeping counts exactly matched.
    while evaluations < budget:
        room.loss(position)
        evaluations += 1
    history.append(state(room, position, evaluations))
    return history


def evolution(room: Room, seed: int, budget: int = BUDGET) -> list[dict]:
    rng = np.random.default_rng(seed)
    population = clip(START + rng.normal(0, 0.35, (32, 2)))
    population[0] = START
    evaluations = 1
    best = START.copy()
    best_loss = float(room.loss(best)[0])
    history = [state(room, best, evaluations, population)]
    generation = 0
    while evaluations < budget:
        count = min(len(population), budget - evaluations)
        scored = population[:count]
        losses = room.loss(scored)
        evaluations += count
        order = np.argsort(losses)
        if losses[order[0]] < best_loss:
            best, best_loss = scored[order[0]].copy(), float(losses[order[0]])
        history.append(state(room, best, evaluations, scored))
        survivors = scored[order[:min(8, count)]]
        sigma = max(0.18, 2.7 * 0.955 ** generation)
        parents = survivors[rng.integers(len(survivors), size=24)]
        population = clip(np.vstack([survivors, parents + rng.normal(0, sigma, (24, 2))]))
        generation += 1
    return history


def run(output: Path, seeds: int) -> None:
    rounds = []
    for room in ROOMS:
        gd = gradient_descent(room)
        es = evolution(room, FEATURED_SEED)
        repeated = [evolution(room, seed)[-1] for seed in range(seeds)]
        xx, yy = np.meshgrid(np.linspace(0.3, 13.7, 57), np.linspace(0.3, 9.7, 41))
        grid = np.column_stack([xx.ravel(), yy.ravel()])
        scores = 100 * (1 - room.loss(grid))
        rounds.append({"name": room.name, "walls": room.walls, "target_dbm": room.target,
                       "gd": gd, "evolution": es, "start": room.metrics(START),
                       "surface": {"width": 57, "height": 41, "scores": scores.tolist()},
                       "grid_best": state(room, grid[np.argmax(scores)], len(grid)),
                       "audit": {"seeds": seeds, "evolution_median_score": float(np.median([s['score'] for s in repeated])),
                                 "evolution_min_score": min(s['score'] for s in repeated),
                                 "evolution_max_score": max(s['score'] for s in repeated),
                                 "evolution_wins": sum(s['score'] > gd[-1]['score'] + 0.1 for s in repeated)}})
        print(f"{room.name}: start {room.metrics(START)['score']:.1f}, GD {gd[-1]['score']:.1f}, "
              f"evolution {es[-1]['score']:.1f}; evolution wins {rounds[-1]['audit']['evolution_wins']}/{seeds}")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"seed": FEATURED_SEED, "budget": BUDGET, "rounds": rounds}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("results/results.json"))
    parser.add_argument("--seeds", type=int, default=20)
    args = parser.parse_args()
    if args.seeds < 1:
        parser.error("--seeds must be positive")
    run(args.output, args.seeds)
