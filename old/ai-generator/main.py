import argparse
import os

import executor

VERSION = 0.2
DATE = '1/2026'

def main():
    parser = argparse.ArgumentParser(description=f'AI Code generator {VERSION} ({DATE})')
    parser.add_argument('--project', type=str, required=True,
                       help="The project folder currently being generated.")
    parser.add_argument('--step', type=int, default=1, nargs='?', 
                       help='How many generation tasks to perform (default 1)')
    parser.add_argument('--run', action='store_true', 
                       help='Run until no generation tasks remain')
    parser.add_argument('--stats', action='store_true', 
                       help='Shows statistics of the generator so far')
    parser.add_argument('--verbose', action='store_true', 
                       help='Enables detailed debug output.')
    
    args = parser.parse_args()
    args.project = os.path.join(os.path.dirname(os.path.abspath(__file__)), args.project)

    print(parser.description)
    print(f" Project: {args.project}")
    print(f" Step: {args.step}")
    print(f" Run: {args.run}")
    print(f" Stats: {args.stats}")

    if args.stats:
        executor.stats()
    else:
        executor.run(args.project, -1 if args.run else args.step, args.verbose)


if __name__ == "__main__":
    main()
