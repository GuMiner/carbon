# server-layer.py
# The wrapper over the MC server to periodically send data to the internet (Carbon)
import os
import re
import requests
import subprocess
import sys
import threading
import time

send_command_lock = threading.Lock()

IS_TESTING = False

_TESTING_URL = 'http://127.0.0.1:5000/projects/mc_server'
_BASE_URL = 'https://helium24.net/carbon/projects/mc_server'
SERVER_PLAYER_URL = f'{_TESTING_URL}/player' if IS_TESTING else f'{_BASE_URL}/player' 
SERVER_MAP_URL = f'{_TESTING_URL}/map' if IS_TESTING else f'{_BASE_URL}/map' 

JAVA_PATH = '/usr/bin/java'  # 'C:\\Program Files\\Microsoft\\jdk-21.0.7.6-hotspot\\bin\\java.exe'
MAP_EXPORTER_PATH = '/opt/shared/minecraft/unmined-cli_0.19.49-dev_linux-x64/unmined-cli'  # 'C:\\Users\\gusgr\\Desktop\\Games\\Minecraft\\unmined-cli_0.19.49-dev_win-64bit\\unmined-cli.exe'
SERVER_PATH = '/opt/shared/minecraft/server'
WORLD_PATH = f'{SERVER_PATH}/world'  # 'C:\\Users\\gusgr\\Desktop\\Games\\Minecraft\\world-packtest'
IMAGE_PATH = '/opt/shared/minecraft/map.png'  # 'C:\\Users\\gusgr\\Desktop\\Games\\Minecraft\\map.png'

IS_ALIVE = True
PLAYERS_ONLINE = 0

def _send_command(command: str, process: subprocess.Popen):
    with send_command_lock:
        print(command)
        process.stdin.write(f'{command}\n'.encode())  # type: ignore
        process.stdin.flush()  # type: ignore


def _send_player_data(name, position):
    response = requests.post(SERVER_PLAYER_URL, json={'name': name, 'position': position})
    if response.status_code == 200:
        print(f"Player data sent successfully: {response.text}")
    else:
        print(f"Failed to send player data: {response.status_code} {response.text}")


def _send_map_data(map_file_name):
    with open(map_file_name, "rb") as f:
        files = {
            "mapFile": ("map.png", f, "image/png")
        }
        response = requests.post(SERVER_MAP_URL, files=files)
        if response.status_code == 200:
            print(f"Player data sent successfully: {response.text}")
        else:
            print(f"Failed to send player data: {response.status_code} {response.text}")


def read_server_data(process: subprocess.Popen):
    global PLAYERS_ONLINE

    while process.poll() is None and IS_ALIVE:
        # print("Waiting for data to read...")
        output = process.stdout.readline().decode()  # type: ignore
        print(output.strip())
        if "ThreadedAnvilChunkStorage: All dimensions are saved" in output:
            break
        elif " has the following entity data: [" in output:
            # Match "[09:25:37] [Server thread/INFO]: GuMiner has the following entity data: [-10.699999988079071d, 112.0d, 11.699999988079071d]""
            # Extract out the player and position
            player_name = re.match(".* (.*) has the following entity data", output)
            if player_name is not None:
                player_name = player_name.group(1)
            else:
                print("No player name found:", output)

            position = re.match(".* entity data: \\[(.*)\\]", output)
            if position is not None:
               position = position.group(1).replace("d", "").split(',')
               if len(position) == 3:
                   position = [int(float(pos)) for pos in position]
               else:
                   print("Invalid position data:", position)
            else:
                print("No position data found:", output)
            
            if player_name is not None and position is not None:
                PLAYERS_ONLINE = PLAYERS_ONLINE + 1
                _send_player_data(player_name, position)


def query_server(process: subprocess.Popen):
    global PLAYERS_ONLINE

    while process.poll() is None and IS_ALIVE:
        time.sleep(30)
        PLAYERS_ONLINE = 0
        _send_command("/list", process)
        _send_command('/data get entity GuMiner Pos', process)
        _send_command('/data get entity huttyblue Pos', process)
        _send_command('/data get entity SolarThor Pos', process)


def _process_map_update(result):
    # Determine map extent from the exported output text, send that in a separate request
    print("Stdout: ", result.stdout)
    print("Stderr: ", result.stderr)
    if os.path.exists(IMAGE_PATH):
        _send_map_data(IMAGE_PATH)
    pass


def update_map():
    map_update_counter = -100  # FIRST_BOOT
    while IS_ALIVE:
        if map_update_counter <= 0:  # About every 5 minutes and upon startup

            if PLAYERS_ONLINE > 0 or map_update_counter < -10:
                if os.path.exists(IMAGE_PATH):
                    os.remove(IMAGE_PATH)
                result = subprocess.run([MAP_EXPORTER_PATH, 'image', 'render', '-c',
                                        f'--world={WORLD_PATH}', f'--output={IMAGE_PATH}'], capture_output=True, text=True)
                _process_map_update(result)
            
            map_update_counter = 60

        map_update_counter -= 1
        time.sleep(5)


def send_data(process: subprocess.Popen):
    global IS_ALIVE

    read_thread = threading.Thread(target=read_server_data, args=(process,))
    read_thread.start()

    query_thread = threading.Thread(target=query_server, args=(process,))
    query_thread.start()

    map_thread = threading.Thread(target=update_map)
    map_thread.start()

    while process.poll() is None and IS_ALIVE:
        time.sleep(30)


def run_game():
    # Run the server, redirecting input and output
    print("Starting process...")
    process = subprocess.Popen([
        JAVA_PATH,
        '-Xmx4G', '-Xms1G', '-XX:SoftMaxHeapSize=3G', '-XX:+UnlockExperimentalVMOptions', '-XX:+UseZGC',
        '-jar', 'server.jar', 'nogui'],
        cwd=SERVER_PATH,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE)  
    
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