import unittest

import numpy as np

from experiment import BOUNDS, ROOMS, START, evolution, gradient_descent


class ExperimentTests(unittest.TestCase):
    def test_wall_attenuation_and_finite_signal(self):
        empty, office = ROOMS[:2]
        self.assertTrue(np.all(office.signal(START) <= empty.signal(START)))
        for room in ROOMS:
            for point in ([4.5, 5], [9, 5], [0.3, 0.3], [13.7, 9.7]):
                self.assertTrue(np.isfinite(room.signal(np.array(point))).all())

    def test_equal_budgets_bounds_and_incumbent_monotonicity(self):
        for room in ROOMS:
            for history in (gradient_descent(room, 160), evolution(room, 7, 160)):
                self.assertEqual(history[-1]['evaluations'], 160)
                positions = np.array([s['position'] for s in history])
                self.assertTrue(np.all(positions >= BOUNDS[:, 0]))
                self.assertTrue(np.all(positions <= BOUNDS[:, 1]))
                self.assertTrue(np.all(np.diff([s['score'] for s in history]) >= -1e-8))
                for snapshot in history:
                    self.assertAlmostEqual(snapshot['score'], room.metrics(np.array(snapshot['position']))['score'])

    def test_seed_reproducibility(self):
        self.assertEqual(evolution(ROOMS[1], 7, 100), evolution(ROOMS[1], 7, 100))


if __name__ == '__main__':
    unittest.main()
