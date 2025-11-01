import base64
from enum import Enum
import json
import random
import requests
import ollama
import os
import subprocess
import time
import uuid

# Constants
JOBS_ENDPOINT = "https://helium24.net/carbon/jobs"

POLL_INTERVAL_SECONDS = 60
SHORT_POLL_INTERVAL_SECONDS = 10

class JobStatus(Enum):
    PASS = 'PASS'
    FAIL = 'FAIL'

class JobType(Enum):
    IMAGE_GEN_SD35 = "ImageGenSd35"
    CODING_GEN_QWEN3 = "CodingGenQwen3"
    CHAT_LLAMA4_SCOUT = "ChatLlama4Scout"

def _create_guid_directory(path):
    guid = str(uuid.uuid4())
    directory_path = os.path.join(path, guid)
    os.makedirs(directory_path, exist_ok=True)
    return directory_path

def _load_image_from_directory(path):
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.lower().endswith('.png'):
                with open(file, 'rb') as f:
                    return base64.b64encode(f.read()).decode('utf-8')
    
    raise Exception(f"No output image found in {path}")

def _perform_ollama_query(prompt, model):
    # Call the local Ollama server with model, not using the streaming API.
    start_time = time.time()
    try:
        response = ollama.chat(
            model=model,
            messages=[
                {
                    'role': 'user',
                    'content': prompt
                }
            ]
        )
    
        # Return the generated response
        return {
            'status': JobStatus.PASS,
            'message': 'Job completed successfully',
            'result_data': { 'response': response['message']['content'] },
            'duration': time.time() - start_time
        }
    
    except ollama.ResponseError as e:
        print('Error:', e.error)
        return {
            'status': JobStatus.FAIL,
            'message': f'Job failed: {e.error}',
            'result_data': {},
            'duration': time.time() - start_time
        }
    except Exception as e:
        return {
            'status': 'FAIL',
            'message': f'Job failed with error: {str(e)}',
            'result_data': {},
            'duration': time.time() - start_time
        }

def execute_chat_llama4_job(job_data):
    return _perform_ollama_query(job_data.get('prompt', ''), 'llama4:scout')

def execute_coding_gen_qwen3_job(job_data):
    return _perform_ollama_query(job_data.get('prompt', ''), 'qwen3-coder:30b-a3b-fp16')


def execute_image_gen_sd35_job(job_data):
    """
    Execute the ImageGenSd35 job in a separate process.
    """
    prompt = job_data['prompt']

    # Don't assume all the extra details are in the job data yet
    # But still provide the standard SD3.5 large parameters
    steps = job_data.get('steps', '40')
    seed = job_data.get('seed', str(random.randint(0, 65535)))
    cfg_scale = job_data.get('cfg_scale', '4.5')

    SD35PATH = '/opt/shared/stablediffusion3.5'
    OUTPUT_PATH = f'{SD35PATH}/outputs'

    start_time = time.time()
    try:
        job_directory = _create_guid_directory(OUTPUT_PATH)

        # Avoids AMD ROCM crashing, but still uses the GPU for reasonable inference times
        env = os.environ.copy()
        env['HSA_OVERRIDE_GFX_VERSION'] = '11.0.0'

        # Ensure we run in the venv and standard path
        result = subprocess.run(
            [f'{SD35PATH}/.venv/bin/python', 'sd3_infer.py',
             '--prompt', prompt,
             '--steps', steps,
             '--seed', seed,
             '--cfg', cfg_scale,
             '--out_dir', job_directory],
            env=env,
            cwd=SD35PATH,
            capture_output=True,
            text=True,
            timeout=600  # 10 minutes timeout
        )

        image_data = _load_image_from_directory(job_directory)

        return {
            'status': 'PASS',
            'message': f'Job completed successfully: {result.stdout}',
            'result_data': { 'image': image_data, 'seed': seed },
            'duration': time.time() - start_time
        }
    except subprocess.TimeoutExpired:
        return {
            'status': 'FAIL',
            'message': 'Job timed out after 10 minutes',
            'result_data': {},
            'duration': time.time() - start_time
        }
    except Exception as e:
        return {
            'status': 'FAIL',
            'message': f'Job failed with error: {str(e)}',
            'result_data': {},
            'duration': time.time() - start_time
        }

def send_job_result(job_id, result_data):
    """
    Send job result back to the server.
    """
    url = f"{JOBS_ENDPOINT}/{job_id}"
    payload = {
        'result': result_data['status'],
        'message': result_data['message'],
        'data': result_data['result_data']
    }
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print(f"Successfully sent result for job {job_id}")
        else:
            print(f"Failed to send result for job {job_id}: {response.status_code}")
    except Exception as e:
        print(f"Error sending result for job {job_id}: {e}")

def process_jobs():
    """
    Main function to periodically query for jobs and process them.
    """
    short_poll_count = 0
    while True:
        try:
            # Query for jobs
            response = requests.get(JOBS_ENDPOINT)
            if response.status_code != 200:
                print(f"Failed to fetch jobs: {response.status_code}")
                time.sleep(POLL_INTERVAL_SECONDS)
                continue

            jobs = response.json()

            # Process each job
            for job in jobs:
                job_id = job.get('id')
                job_type = job.get('type')
                job_data = job.get('data')

                print(f"Processing {JobType} job {job_id}")
                if job_type == JobType.IMAGE_GEN_SD35:
                    result = execute_image_gen_sd35_job(job_data)
                elif job_type == JobType.CODING_GEN_QWEN3:
                    result = execute_coding_gen_qwen3_job(job_data)
                elif job_type == JobType.CHAT_LLAMA4_SCOUT:
                    result = execute_chat_llama4_job(job_data)
                else:
                    print(f"Skipping unsupported job type: {job_type}")
                    result = {
                        'status': 'FAIL',
                        'message': 'Unsupported job type',
                        'result_data': {}
                    }
                
                send_job_result(job_id, result)

            # Ensure we check more frequently if any jobs have recently come in.
            if any(jobs):
                short_poll_count = 6
            elif short_poll_count > 0:
                short_poll_count -= 1

            # Wait before next query
            if short_poll_count > 0:
                time.sleep(SHORT_POLL_INTERVAL_SECONDS)
            else:
                time.sleep(POLL_INTERVAL_SECONDS)

        except Exception as e:
            print(f"Error in main loop: {e}")
            time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    process_jobs()