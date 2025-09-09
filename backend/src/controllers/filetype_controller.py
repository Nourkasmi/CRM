from flask import jsonify
from src.models.filetype_model import FileType

# -------------------------------
# Create a new file type
# -------------------------------
def create_filetype(data):
    name = data.get("name")
    description = data.get("description", "")

    if not name:
        return jsonify({"msg": "File type name is required"}), 400

    if FileType.objects(name=name).first():
        return jsonify({"msg": "File type already exists"}), 400

    filetype = FileType(name=name, description=description).save()

    return jsonify({
        "msg": "File type created successfully",
        "filetype": filetype.to_dict()
    }), 201


# -------------------------------
# Get all file types
# -------------------------------
def get_filetypes():
    filetypes = FileType.objects()
    return jsonify([ft.to_dict() for ft in filetypes]), 200


# -------------------------------
# Delete a file type
# -------------------------------
def delete_filetype(filetype_id):
    filetype = FileType.objects(id=filetype_id).first()
    if not filetype:
        return jsonify({"msg": "File type not found"}), 404

    filetype.delete()
    return jsonify({"msg": "File type deleted successfully"}), 200
