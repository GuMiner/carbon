#!/bin/bash

# Create the Python script directory
mkdir -p /usr/local/bin

# Copy the Python script
cat > /opt/shared/carbon/system_metrics_collector.py << 'EOF'
#!/usr/bin/env python3
import subprocess
import json
import requests
import time
import os
import psutil
import platform

def get_system_info():
    """Collect basic system information"""
    return {
        "hostname": platform.node(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "timestamp": time.time()
    }

def get_cpu_info():
    """Collect CPU information"""
    cpu_count = psutil.cpu_count()
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_freq = psutil.cpu_freq()
    
    return {
        "cpu_count": cpu_count,
        "cpu_percent": cpu_percent,
        "cpu_freq": cpu_freq.current if cpu_freq else None
    }

def get_memory_info():
    """Collect memory information"""
    memory = psutil.virtual_memory()
    return {
        "total_memory": memory.total,
        "available_memory": memory.available,
        "used_memory": memory.used,
        "memory_percent": memory.percent
    }

def get_disk_info():
    """Collect disk information"""
    disk = psutil.disk_usage('/')
    return {
        "total_disk": disk.total,
        "used_disk": disk.used,
        "free_disk": disk.free,
        "disk_percent": disk.percent
    }

def get_nvtop_info():
    """Collect GPU information using nvtop (if available)"""
    try:
        # Run nvtop in quiet mode to get JSON output
        result = subprocess.run(['/usr/bin/nvtop', '-s'], 
                               capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return json.loads(result.stdout)
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, json.JSONDecodeError, FileNotFoundError):
        pass
    return None

def get_htop_info():
    """Collect process information using htop (if available)"""
    try:
        # Run htop in batch mode to get process info
        result = subprocess.run(['/usr/bin/mpstat', '-o', 'JSON'], 
                               capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return json.loads(result.stdout)
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        pass
    return None

def collect_metrics():
    """Collect all system metrics"""
    metrics = {
        "system_info": get_system_info(),
        "cpu_info": get_cpu_info(),
        "memory_info": get_memory_info(),
        "disk_info": get_disk_info(),
        "nvtop_info": get_nvtop_info(),
        "htop_info": get_htop_info()
    }
    return metrics

def upload_metrics(metrics):
    """Upload metrics to the specified endpoint"""
    try:
        response = requests.post(
            "https://helium24.net/carbon/stats",
            json=metrics,
            timeout=30
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error uploading metrics: {e}")
        return False

def main():
    """Main function to collect and upload metrics"""
    try:
        # Collect all metrics
        metrics = collect_metrics()
        
        # Upload to server
        success = upload_metrics(metrics)
        with open('/opt/shared/carbon/last-metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        
        if success:
            print("Metrics uploaded successfully")
        else:
            print("Failed to upload metrics")

            
    except Exception as e:
        print(f"Error in main function: {e}")

if __name__ == "__main__":
    main()
EOF

# Make the script executable
chmod +x /opt/shared/carbon/system_metrics_collector.py

# Create systemd service file
cat > /etc/systemd/system/system-metrics.service << 'EOF'
[Unit]
Description=Carbon Metrics Collector Service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/shared/carbon/system_metrics_collector.py
User=carbon

[Install]
WantedBy=multi-user.target
EOF

# Create systemd timer file
cat > /etc/systemd/system/system-metrics.timer << 'EOF'
[Unit]
Description=Run Carbon Metrics Collector every 5 minutes
Requires=system-metrics.service

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Reload systemd daemon
systemctl daemon-reload

# Enable and start the timer
systemctl enable system-metrics.timer
systemctl start system-metrics.timer

echo "System metrics collector installed and enabled!"
echo "To check status: systemctl status system-metrics.timer"
echo "To view logs: journalctl -u system-metrics.service"