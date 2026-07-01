from pathlib import Path
import tempfile
import unittest

import optimizer


class OptimizerTest(unittest.TestCase):
    def test_default_training_converges_and_learns_parameters(self) -> None:
        data = optimizer.generate_data()
        result = optimizer.train(data)

        self.assertEqual(result.status, "converged")
        self.assertLess(result.final_loss, result.initial_loss * 0.05)
        self.assertAlmostEqual(result.w, 3.0, delta=0.2)
        self.assertAlmostEqual(result.b, 2.0, delta=0.2)

    def test_fixed_seed_training_is_reproducible(self) -> None:
        first = optimizer.train(optimizer.generate_data(seed=optimizer.DEFAULT_SEED))
        second = optimizer.train(optimizer.generate_data(seed=optimizer.DEFAULT_SEED))

        self.assertEqual(first.status, second.status)
        self.assertAlmostEqual(first.w, second.w, places=12)
        self.assertAlmostEqual(first.b, second.b, places=12)
        self.assertAlmostEqual(first.final_loss, second.final_loss, places=12)
        self.assertEqual(first.losses, second.losses)

    def test_unsafe_learning_rate_reports_non_success(self) -> None:
        data = optimizer.generate_data()
        result = optimizer.train(data, learning_rate=2.0, max_iterations=100)

        self.assertIn(result.status, {"diverged", "max_iterations"})
        self.assertNotEqual(result.status, "converged")

    def test_visualization_file_is_generated(self) -> None:
        data = optimizer.generate_data()
        result = optimizer.train(data)

        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "training_result.png"
            returned_path = optimizer.plot_training_result(data, result, output_path)

            self.assertEqual(returned_path, output_path)
            self.assertTrue(output_path.exists())
            self.assertGreater(output_path.stat().st_size, 1000)
            self.assertEqual(output_path.read_bytes()[:8], b"\x89PNG\r\n\x1a\n")


if __name__ == "__main__":
    unittest.main()
