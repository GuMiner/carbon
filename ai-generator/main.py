import argparse

import executor

VERSION = 0.1
DATE = '12/2025'

def main():
    parser = argparse.ArgumentParser(description=f'AI Code generator {VERSION} ({DATE})')
    parser.add_argument('--step', type=int, default=1, nargs='?', 
                       help='How many generation tasks to perform (default 1)')
    parser.add_argument('--run', action='store_true', 
                       help='Run until no generation tasks remain')
    parser.add_argument('--stats', action='store_true', 
                       help='Shows statistics of the generator so far')
    
    args = parser.parse_args()
    

    print(parser.description)
    print(f" Step: {args.step}")
    print(f" Run: {args.run}")
    print(f" Stats: {args.stats}")

    if args.stats:
        executor.stats()
    else:
        executor.run(-1 if args.run else args.step)


if __name__ == "__main__":
    main()
