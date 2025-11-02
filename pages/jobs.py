
import json
import sqlite3
import uuid
from flask import Blueprint, jsonify, request
import flask_login


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


@jobs.route("/count", methods=["GET"])
@flask_login.login_required
def get_job_count():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM jobs WHERE Status = 'pending'")
    count = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM jobs 
        WHERE Status = 'pending' 
        AND UserId = ?
    """, (flask_login.current_user.id,))
    user_count = cursor.fetchone()[0]
    conn.close()

    return jsonify({"pendingJobs": count, "pendingUserJobs": user_count})


@jobs.route('/<job_id>', methods=['GET', 'POST'])
def update_job(job_id):
    conn = get_db_connection()
    
    if request.method == 'POST':
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
    else:
        # GET request - fetch job by ID
        job = conn.execute("SELECT * FROM jobs WHERE Id = ?", (job_id,)).fetchone()
        conn.close()
        
        if job is None:
            return jsonify({'error': 'Job not found'}), 404
            
        return jsonify({
            'id': job['Id'],
            'userId': job['UserId'],
            'type': job['Type'],
            'data': job['Data'],
            'status': job['Status'], # Replace with 'PASS' to test out client-side chat overview.
            'message': job['Message'],
            'resultData': job['ResultData'],
            'createdAt': job['CreatedAt'],
            'updatedAt': job['UpdatedAt']
        }), 200


@jobs.route("/chat", methods=["POST"])
@flask_login.login_required
def add_chat_job():
    # Get message from request
    data = request.get_json()
    message = data.get("message", "")
    job_type = data.get("jobType", "CodingGenQwen3")
    
    # Create job data
    job_data = {"prompt": message}
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Insert job into database
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO jobs (Id, UserId, Type, Data, Status) VALUES (?, ?, ?, ?, ?)",
        (job_id, flask_login.current_user.id, job_type, str(job_data), "pending")
    )
    conn.commit()
    conn.close()
    
    # Return job ID
    return jsonify({"jobId": job_id})