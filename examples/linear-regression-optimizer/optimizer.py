"""Minimal batch-gradient-descent linear regression example."""

from __future__ import annotations

from dataclasses import dataclass
import math
from pathlib import Path
import random


DEFAULT_SEED = 7
DEFAULT_SAMPLE_COUNT = 80
DEFAULT_LEARNING_RATE = 0.08
DEFAULT_MAX_ITERATIONS = 2000
DEFAULT_TOLERANCE = 1e-12
DEFAULT_OUTPUT_PATH = Path(__file__).with_name("training_result.png")


@dataclass(frozen=True)
class DataSet:
    x: tuple[float, ...]
    y: tuple[float, ...]


@dataclass(frozen=True)
class TrainingResult:
    w: float
    b: float
    initial_loss: float
    final_loss: float
    iterations: int
    status: str
    losses: tuple[float, ...]


def generate_data(
    sample_count: int = DEFAULT_SAMPLE_COUNT,
    seed: int = DEFAULT_SEED,
    noise_scale: float = 0.08,
) -> DataSet:
    """Generate deterministic points from y = 3x + 2 + noise."""
    rng = random.Random(seed)
    xs = tuple(-1.0 + 2.0 * i / (sample_count - 1) for i in range(sample_count))
    ys = tuple(3.0 * x + 2.0 + rng.uniform(-noise_scale, noise_scale) for x in xs)
    return DataSet(xs, ys)


def predict(x_values: tuple[float, ...], w: float, b: float) -> tuple[float, ...]:
    return tuple(w * x + b for x in x_values)


def mean_squared_error(
    x_values: tuple[float, ...], y_values: tuple[float, ...], w: float, b: float
) -> float:
    errors = [(w * x + b) - y for x, y in zip(x_values, y_values)]
    return sum(error * error for error in errors) / len(errors)


def train(
    data: DataSet,
    learning_rate: float = DEFAULT_LEARNING_RATE,
    max_iterations: int = DEFAULT_MAX_ITERATIONS,
    tolerance: float = DEFAULT_TOLERANCE,
    divergence_patience: int = 6,
) -> TrainingResult:
    """Train w and b with batch gradient descent."""
    w = 0.0
    b = 0.0
    loss = mean_squared_error(data.x, data.y, w, b)
    losses = [loss]
    status = "max_iterations"
    rising_steps = 0

    for iteration in range(1, max_iterations + 1):
        predictions = predict(data.x, w, b)
        errors = tuple(predicted - actual for predicted, actual in zip(predictions, data.y))
        gradient_w = 2.0 * sum(error * x for error, x in zip(errors, data.x)) / len(data.x)
        gradient_b = 2.0 * sum(errors) / len(data.x)

        w -= learning_rate * gradient_w
        b -= learning_rate * gradient_b
        next_loss = mean_squared_error(data.x, data.y, w, b)
        losses.append(next_loss)

        if not math.isfinite(next_loss):
            status = "diverged"
            break

        if next_loss > loss:
            rising_steps += 1
            if rising_steps >= divergence_patience:
                status = "diverged"
                break
        else:
            rising_steps = 0

        if abs(loss - next_loss) < tolerance:
            status = "converged"
            loss = next_loss
            break

        loss = next_loss

    return TrainingResult(
        w=w,
        b=b,
        initial_loss=losses[0],
        final_loss=losses[-1],
        iterations=len(losses) - 1,
        status=status,
        losses=tuple(losses),
    )


def plot_training_result(
    data: DataSet,
    result: TrainingResult,
    output_path: Path = DEFAULT_OUTPUT_PATH,
) -> Path:
    """Write a PNG with the fitted line and training loss curve."""
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fitted = predict(data.x, result.w, result.b)

    figure, axes = plt.subplots(1, 2, figsize=(10, 4))

    axes[0].scatter(data.x, data.y, s=18, label="synthetic data")
    axes[0].plot(data.x, fitted, color="tab:red", label="fitted line")
    axes[0].set_title("Data and fitted line")
    axes[0].set_xlabel("x")
    axes[0].set_ylabel("y")
    axes[0].legend()

    axes[1].plot(range(len(result.losses)), result.losses, color="tab:blue")
    axes[1].set_title("Loss curve")
    axes[1].set_xlabel("iteration")
    axes[1].set_ylabel("mean squared error")

    figure.suptitle(f"status={result.status}, w={result.w:.3f}, b={result.b:.3f}")
    figure.tight_layout()
    figure.savefig(output_path)
    plt.close(figure)
    return output_path


def run_example(output_path: Path = DEFAULT_OUTPUT_PATH) -> TrainingResult:
    data = generate_data()
    result = train(data)
    plot_training_result(data, result, output_path)
    return result


def main() -> None:
    output_path = DEFAULT_OUTPUT_PATH
    result = run_example(output_path)
    improvement = 100.0 * (result.initial_loss - result.final_loss) / result.initial_loss
    print(f"status: {result.status}")
    print(f"w: {result.w:.6f}")
    print(f"b: {result.b:.6f}")
    print(f"initial_loss: {result.initial_loss:.6f}")
    print(f"final_loss: {result.final_loss:.6f}")
    print(f"loss_reduction: {improvement:.2f}%")
    print(f"iterations: {result.iterations}")
    print(f"visualization: {output_path}")


if __name__ == "__main__":
    main()
