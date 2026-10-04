import random
import unittest

import numpy as np

from experiment import BOUNDS, ROOMS, START, nsga_ii, gradient_descent


class ExperimentTests(unittest.TestCase):
    def test_wall_attenuation_and_finite_signal(self):
        empty, office = ROOMS[:2]
        self.assertTrue(np.all(office.signal(START) <= empty.signal(START)))
        for room in ROOMS:
            for point in ([4.5, 5], [9, 5], [0.3, 0.3], [13.7, 9.7]):
                self.assertTrue(np.isfinite(room.signal(np.array(point))).all())

    def test_equal_budgets_bounds_and_incumbent_monotonicity(self):
        for room in ROOMS:
            for history in (gradient_descent(room, 160), nsga_ii(room, 7, 160)):
                self.assertEqual(history[-1]['evaluations'], 160)
                positions = np.array([s['position'] for s in history])
                self.assertTrue(np.all(positions >= BOUNDS[:, 0]))
                self.assertTrue(np.all(positions <= BOUNDS[:, 1]))
                self.assertTrue(np.all(np.diff([s['score'] for s in history]) >= -1e-8))
                for snapshot in history:
                    self.assertAlmostEqual(snapshot['score'], room.metrics(np.array(snapshot['position']))['score'])

    def test_coverage_count_plateau_has_zero_local_gradient(self):
        room = ROOMS[-1]
        probes = np.array([START + [.03, 0], START - [.03, 0],
                           START + [0, .03], START - [0, .03]])
        self.assertTrue(np.all(room.loss(probes) == room.loss(START)[0]))
        history = gradient_descent(room, 160)
        self.assertTrue(all(np.array_equal(s['position'], START) for s in history))
        self.assertGreater(nsga_ii(room, 7, 1200)[-1]['coverage'], history[-1]['coverage'])

    def test_seed_reproducibility(self):
        self.assertEqual(nsga_ii(ROOMS[1], 7, 100), nsga_ii(ROOMS[1], 7, 100))

    def test_nsga_ii_partial_generation_and_rng_isolation(self):
        numpy_state, python_state = np.random.get_state(), random.getstate()
        history = nsga_ii(ROOMS[-1], 7, 100)
        self.assertEqual([s['evaluations'] for s in history], [1, 32, 64, 96, 100])
        self.assertEqual(len(history[1]['population']), 32)
        self.assertTrue(np.array_equal(np.array(history[0]['position']), START))
        self.assertTrue(np.array_equal(np.random.get_state()[1], numpy_state[1]))
        self.assertEqual(random.getstate(), python_state)


if __name__ == '__main__':
    unittest.main()
