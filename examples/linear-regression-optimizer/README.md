# Linear Regression Optimizer Example

This example is a small Loop Engineering test task. It trains a one-dimensional linear regression model with batch gradient descent on deterministic synthetic data from:

```text
y = 3x + 2 + noise
```

The goal is to demonstrate a bounded implementation loop with observable convergence, divergence handling, tests, and a generated visualization. It is not a production machine-learning library.

## Setup

Create and activate a virtual environment from the repository root:

```bash
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r examples/linear-regression-optimizer/requirements.txt
```

## Run Tests

```bash
python3 -m unittest discover examples/linear-regression-optimizer -p 'test_*.py'
```

The tests verify that training converges, learns parameters close to `w = 3` and `b = 2`, repeats deterministically with the fixed seed, reports non-success for an unsafe learning rate, and can generate the visualization.

## Run The Example

```bash
python3 examples/linear-regression-optimizer/optimizer.py
```

The script prints the training status and writes:

```text
examples/linear-regression-optimizer/training_result.png
```

The generated image contains the synthetic data with the fitted line and the loss curve over training iterations. The image is generated output and should not be committed.

## Loop Evidence

Completion evidence for this task should map validation output back to these checks:

- final loss is at least 95% lower than initial loss;
- learned `w` is within `0.2` of `3.0`;
- learned `b` is within `0.2` of `2.0`;
- fixed-seed runs are deterministic within floating-point tolerance;
- unsafe learning rates report divergence or another non-success status;
- the example script generates `training_result.png`;
- this README documents setup, tests, execution, visualization, and evidence.
