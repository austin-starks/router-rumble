# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy>=2.0,<3", "pymoo==0.6.1.5"]
# ///
"""Run Router Rumble, bundle the replay, and open it in your browser."""
import argparse
import subprocess
import sys
import webbrowser
from pathlib import Path

from experiment import run

ROOT = Path(__file__).resolve().parent

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seed', type=int, default=7)
    parser.add_argument('--budget', type=int, default=1200)
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    if args.seed < 0 or args.budget < 32:
        parser.error('seed must be nonnegative and budget must be at least 32')
    run(ROOT / 'results/results.json', 20, args.seed, args.budget)
    subprocess.run([sys.executable, str(ROOT / 'build_preview.py')], cwd=ROOT, check=True)
    if not args.no_open:
        webbrowser.open((ROOT / 'demo.html').as_uri())
