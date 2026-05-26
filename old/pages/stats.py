from datetime import datetime
from flask import Blueprint, jsonify, render_template, request
import sqlite3

stats = Blueprint('stats', __name__, url_prefix='/stats', template_folder='../templates/stats')


def insert_data(data):
    conn = sqlite3.connect('data/stats.db')
    c = conn.cursor()
    
    # Extract data from JSON structure
    system_timestamp = data['system_info']['timestamp']
    cpu_freq = data['cpu_info']['cpu_freq']
    memory_percent = data['memory_info']['memory_percent']
    disk_percent = data['disk_info']['disk_percent']
    
    # Extract nvtop_info (first entry)
    nvtop = data['nvtop_info'][0]
    gpu_clock = nvtop['gpu_clock']
    mem_clock = nvtop['mem_clock']
    temp = nvtop['temp']
    power_draw = nvtop['power_draw']
    gpu_util = nvtop['gpu_util']
    mem_util = nvtop['mem_util']
    
    # Extract htop_info (first entry)
    htop = data['htop_info']['sysstat']['hosts'][0]['statistics'][0]['cpu-load'][0]
    cpu = htop['cpu']
    usr = htop['usr']
    nice = htop['nice']
    sys = htop['sys']
    idle = htop['idle']
    
    # Insert into database
    c.execute('''
        INSERT INTO system_data 
        (timestamp, cpu_freq, memory_percent, disk_percent,
         gpu_clock, mem_clock, temp, power_draw, gpu_util, mem_util,
         cpu, usr, nice, sys, idle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (system_timestamp, cpu_freq, memory_percent, disk_percent,
          gpu_clock, mem_clock, temp, power_draw, gpu_util, mem_util,
          cpu, usr, nice, sys, idle))
    
    conn.commit()
    conn.close()


def get_chart_data(metric='cpu_util'):
    conn = sqlite3.connect('data/stats.db')
    c = conn.cursor()
    
    # Map metric names to database columns
    metric_map = {
        'cpu_util': 'cpu_freq',
        'memory_util': 'memory_percent',
        'disk_util': 'disk_percent',
        'gpu_util': 'gpu_util',
        'temp': 'temp'
    }
    
    column = metric_map.get(metric, 'cpu')
    
    # Get data points for chart
    c.execute(f'SELECT id, {column}, timestamp FROM system_data ORDER BY id DESC LIMIT 30')
    rows = c.fetchall()
    
    # Reverse to get chronological order
    rows.reverse()
    
    labels = [datetime.fromtimestamp(row[2]).strftime("%Y-%m-%d %H:%M:%S") for row in rows]
    series = [str(row[1]).replace('%', '').replace('C', '') for row in rows]
    
    conn.close()
    return {'labels': labels, 'series': [series]}

@stats.get("/chart-data/<metric>")
def chart_data(metric):
    """Endpoint to get chart data for a specific metric"""
    try:
        data = get_chart_data(metric)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_most_recent():
    conn = sqlite3.connect('data/stats.db')
    c = conn.cursor()
    
    # Get the most recent entry by ID (assuming auto-increment means newer IDs are more recent)
    c.execute('SELECT * FROM system_data ORDER BY id DESC LIMIT 1')
    rows = c.fetchall()
    
    columns = [description[0] for description in c.description]

    json_data = []
    for row in rows:
        # Convert row to dictionary
        entry = dict(zip(columns, row))
        
        # Convert to proper JSON structure
        json_data.append({
            "system_info": {
                "timestamp": entry['timestamp']
            },
            "cpu_info": {
                "cpu_freq": entry['cpu_freq']
            },
            "memory_info": {
                "memory_percent": entry['memory_percent']
            },
            "disk_info": {
                "disk_percent": entry['disk_percent']
            },
            "nvtop_info": [{
                "gpu_clock": entry['gpu_clock'],
                "mem_clock": entry['mem_clock'],
                "temp": entry['temp'],
                "power_draw": entry['power_draw'],
                "gpu_util": entry['gpu_util'],
                "mem_util": entry['mem_util']
            }],
            "htop_info": {
                "sysstat": {
                    "hosts": [{
                        "statistics": [{
                            "cpu-load": [{
                                "cpu": entry['cpu'],
                                "usr": entry['usr'],
                                "nice": entry['nice'],
                                "sys": entry['sys'],
                                "idle": entry['idle']
                            }]
                        }]
                    }]
                }
            }
        })
        
    conn.close()
    return json_data


@stats.get("/")
def index():
    return render_template("stats.html")


@stats.post("/")
def stat_upload():
    try:
        # Get JSON data from POST request
        data = request.get_json()
        
        # Validate data
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Insert data into database
        insert_data(data)
        
        return jsonify({'message': 'Data successfully stored'}), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500