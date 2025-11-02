from flask import Blueprint, render_template, request, redirect, url_for
import flask_login
import sqlite3
from . import base

admin = Blueprint('admin', __name__, url_prefix='/admin', template_folder='../templates/admin')

def get_db_connection():
    conn = sqlite3.connect('data/users.db')
    
    cursor = conn.cursor()
    cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER,
                Message TEXT NOT NULL,
                SentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                Dismissed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (UserId) REFERENCES users (Id)
            )
        ''')

    conn.row_factory = sqlite3.Row
    return conn

def _is_superadmin():
    return flask_login.current_user.id == "carbon"

@admin.route("/")
@flask_login.login_required # ORDER IMPORTANT
def index():
    if not _is_superadmin():
        return render_template("errors/access_denied.html"), 403

    conn = get_db_connection()
    users = conn.execute('SELECT * FROM users').fetchall()

    # Fetch messages from database
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT M.Message, M.SentAt, U.Name FROM messages M JOIN "users" U on M.UserId = U.Id ORDER BY SentAt DESC')
    messages = c.fetchall()
    
    # Fetch access codes
    c.execute('SELECT * FROM access_codes')
    access_codes = c.fetchall()
    conn.close()
    
    return render_template("admin.html", users=users, messages=messages, access_codes=access_codes)

@admin.route('/access-codes/add', methods=['GET', 'POST'])
@flask_login.login_required 
def add_access_code():
    if not _is_superadmin():
        return render_template("errors/access_denied.html"), 403

    if request.method == 'POST':
        code = request.form['code']
        group = request.form['group']
        
        if not code or not group:
            return redirect(url_for('admin.index'))
        
        conn = get_db_connection()
        conn.execute('INSERT INTO access_codes (code, [group]) VALUES (?, ?)', (code, group))
        conn.commit()
        conn.close()
        
        return redirect(url_for('admin.index'))
    
    return render_template('add_access_code.html')

@admin.route('/access-codes/delete/<code_id>', methods=['POST'])
@flask_login.login_required 
def delete_access_code(code_id):
    if not _is_superadmin():
        return render_template("errors/access_denied.html"), 403

    conn = get_db_connection()
    conn.execute('DELETE FROM access_codes WHERE code = ?', (code_id,))
    conn.commit()
    conn.close()
    
    return redirect(url_for('admin.index'))

@admin.route('/users/add', methods=['GET', 'POST'])
@flask_login.login_required 
def add_user():
    if not _is_superadmin():
        return render_template("errors/access_denied.html"), 403

    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        username = request.form['username']
        password = request.form['password']
        
        if not name or not email or not username or not password:
            # flash('All fields are required!')
            return redirect(url_for('admin.add_user'))
        
        pwd_hash = base.hash_password(password)
        
        conn = get_db_connection()
        conn.execute('INSERT INTO users (Name, Email, UserName, PwdHash) VALUES (?, ?, ?, ?)',
                    (name, email, username, pwd_hash))
        conn.commit()
        conn.close()
        
        # flash('User added successfully!')
        return redirect(url_for('admin.add_user'))
    
    return render_template('add_user.html')

@admin.route('/users/delete/<int:user_id>', methods=['POST'])
@flask_login.login_required 
def delete_user(user_id):
    if not _is_superadmin():
        return render_template("errors/access_denied.html"), 403

    conn = get_db_connection()
    conn.execute('DELETE FROM users WHERE Id = ?', (user_id,))
    conn.commit()
    conn.close()
    
    # flash('User deleted successfully!')
    return redirect(url_for('admin.index'))

@admin.route('/users/send-message/<int:user_id>', methods=['GET', 'POST'])
@flask_login.login_required 
def send_message(user_id):
    if not _is_superadmin():
        return render_template("errors/access_denied.html"), 403
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE Id = ?', (user_id,)).fetchone()
    
    if request.method == 'POST':
        message = request.form['message']
        if not message:
            # flash('Message cannot be empty!')
            return redirect(url_for('admin.send_message', user_id=user_id))
        
        conn.execute('INSERT INTO messages (UserId, Message) VALUES (?, ?)',
                    (user_id, message))
        conn.commit()
        conn.close()
        
        # flash('Message sent successfully!')
        return redirect(url_for('admin.index'))
    
    conn.close()
    return render_template('send_message.html', user=user)

@admin.route('/users/edit/<user_name>', methods=['GET', 'POST'])
@flask_login.login_required 
def edit_user(user_name):
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE UserName = ?', (user_name,)).fetchone()
    
    if  user_name != flask_login.current_user.id and not _is_superadmin():
        return render_template("errors/access_denied.html"), 403

    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        
        if not name or not email:
            return redirect(url_for('admin.edit_user', user_name=user_name))
        
        if password:  # Only hash if password is provided
            pwd_hash = base.hash_password(password)
            conn.execute('UPDATE users SET Name = ?, Email = ?, PwdHash = ? WHERE UserName = ?',
                        (name, email, pwd_hash, user_name))
        else:
            conn.execute('UPDATE users SET Name = ?, Email = ? WHERE UserName = ?',
                        (name, email, user_name))
        
        conn.commit()
        conn.close()

        if _is_superadmin():
            return redirect(url_for('admin.index'))
        else:
            return redirect(url_for('projects.index'))
    
    conn.close()

    back_redirect = url_for('admin.index') if _is_superadmin() else url_for('projects.index')
    return render_template('edit_user.html', user=user, back_redirect=back_redirect)