import os
from flask import jsonify, current_app, send_file
from datetime import datetime
from werkzeug.utils import secure_filename
from src.models.file_model import File
from src.models.project_model import Project
from src.models.user_model import User
from src.models.filetype_model import FileType

UPLOAD_FOLDER = "uploads/projects"

# -------------------------------
# Upload a file (local storage)
# -------------------------------
def upload_file(request, current_user):
    project_id = request.form.get("project_id")
    filetype_id = request.form.get("filetype_id")
    file = request.files.get("file")  # binary file from form-data

    if not file or not project_id or not filetype_id:
        return jsonify({"msg": "file, project_id and filetype_id are required"}), 400

    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    filetype = FileType.objects(id=filetype_id).first()
    if not filetype:
        return jsonify({"msg": "File type not found"}), 404

    user = User.objects(id=current_user["id"]).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Create project folder if it doesn’t exist
    project_folder = os.path.join(UPLOAD_FOLDER, str(project_id))
    os.makedirs(project_folder, exist_ok=True)

    # Save file locally
    filename = secure_filename(file.filename)
    filepath = os.path.join(project_folder, filename)
    file.save(filepath)

    # Save metadata in DB
    file_doc = File(
        filename=filename,
        path=filepath,
        uploaded_by=user,
        project=project,
        filetype=filetype,
        uploaded_at=datetime.utcnow()
    ).save()

    return jsonify({
        "msg": "File uploaded successfully",
        "file": file_doc.to_dict()
    }), 201


# -------------------------------
# Get all files for a project
# -------------------------------
def get_project_files(project_id, include_archived=False):
    project = Project.objects(id=project_id).first()
    if not project:
        return jsonify({"msg": "Project not found"}), 404

    query = File.objects(project=project)
    if not include_archived:
        query = query.filter(is_archived=False)

    files = query
    return jsonify([f.to_dict() for f in files]), 200


# -------------------------------
# Download a file
# -------------------------------
def download_file(file_id):
    file = File.objects(id=file_id).first()
    if not file:
        return jsonify({"msg": "File not found"}), 404

    if not os.path.exists(file.path):
        return jsonify({"msg": "File missing from storage"}), 404

    return send_file(file.path, as_attachment=True)


# -------------------------------
# Archive / Unarchive a file
# -------------------------------
def archive_file(file_id, archive=True):
    file = File.objects(id=file_id).first()
    if not file:
        return jsonify({"msg": "File not found"}), 404

    file.update(set__is_archived=archive, set__uploaded_at=datetime.utcnow())
    return jsonify({"msg": f"File {'archived' if archive else 'unarchived'} successfully"}), 200


# -------------------------------
# Delete a file permanently
# -------------------------------
def delete_file(file_id):
    file = File.objects(id=file_id).first()
    if not file:
        return jsonify({"msg": "File not found"}), 404

    # Optionally remove physical file
    if os.path.exists(file.path):
        os.remove(file.path)

    file.delete()
    return jsonify({"msg": "File deleted permanently"}), 200
