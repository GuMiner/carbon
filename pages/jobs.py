
import json
import sqlite3
from dataclasses import dataclass
from flask import Blueprint, jsonify, request

jobs = Blueprint('jobs', __name__, url_prefix='/jobs', template_folder='../templates/jobs')

def get_db_connection():
    conn = sqlite3.connect('data/jobs.db')
    
    cursor = conn.cursor()
    # Create jobs table if it doesn't exist
    cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                Id TEXT PRIMARY KEY,
                UserId TEXT NOT NULL,
                Type TEXT NOT NULL,
                Data TEXT NOT NULL,
                Status TEXT DEFAULT 'pending',
                Message TEXT,
                ResultData TEXT,
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

    conn.row_factory = sqlite3.Row
    return conn


@jobs.route('/')
def index():
    conn = get_db_connection()
    
    # Return job details
    jobs = conn.execute("SELECT * FROM jobs WHERE Status = 'pending' ORDER BY Id")
    
    job_list = []
    for job in jobs:
        job_list.append({
            'id': job['Id'],
            'type': job['Type'],
            'data': job['Data']
        })

    return jsonify(job_list)


@jobs.route('/<job_id>', methods=['POST'])
def update_job(job_id):
    conn = get_db_connection()
    
    # Get the JSON data from the request
    data = request.get_json()
    
    # Validate that result data is provided
    if not data or 'status' not in data or 'message' not in data or 'result_data' not in data:
        return jsonify({'error': 'All result data fields are required'}), 400
    
    result = data['result']
    
    # Update the job with the result
    conn.execute('''
        UPDATE jobs 
        SET Status = ?, Message = ?, ResultData = ?, UpdatedAt = CURRENT_TIMESTAMP
        WHERE Id = ?
    ''', (result.get('status', 'unknown'), result.get('message', ''), 
          json.dumps(result.get('result_data', {})), job_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Job updated successfully'}), 200
