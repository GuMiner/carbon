# server-layer.py
# The wrapper over the MC server to periodically send data to the internet (Carbon)
import subprocess
import sys
import threading
import time

def read_data(process: subprocess.Popen):
    while process.poll() is None:
        output = process.stdout.readline().decode()  # type: ignore
        print(output.strip())
        if "ThreadedAnvilChunkStorage: All dimensions are saved" in output:
            break


def send_data(process: subprocess.Popen):
    read_thread = threading.Thread(target=read_data, args=(process,))
    read_thread.start()

    while process.poll() is None:
        user_control = sys.stdin.readline().strip()
        if user_control == "quit":
            print("Stopping server...")
            process.stdin.write('/stop\n'.encode()) # type: ignore
            process.stdin.flush() # type: ignore
            read_thread.join()
            break
        elif user_control == "list":
            print("Sending list command...")
            process.stdin.write('/list\n'.encode()) # type: ignore
            process.stdin.flush() # type: ignore


def run_game():
    java_path = 'C:\\Program Files\\Microsoft\\jdk-21.0.7.6-hotspot\\bin\\java.exe'
    
    # Run the server, redirecting input and output
    print("Starting process...")
    process = subprocess.Popen([
        java_path,
        '-XX:+UseZGC', '-XX:+ZGenerational', '-Xmx4096M', '-Xms4096M',
        '-jar', 'server.jar', 'nogui'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)  
    
    is_launched = False
    while process.poll() is None:
        output = process.stdout.readline().decode()  # type: ignore
        while output != "":
            print(output.strip())
            if "For help, type" in output:
                is_launched = True
                output = ""
            else:
                output = process.stdout.readline().decode()  # type: ignore
        time.sleep(1)

        # Check if the game has launched and send data every second
        if is_launched:
            send_data(process)

    print("Process finished with exit code:", process.returncode)


if __name__ == "__main__":
    run_game()