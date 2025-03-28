from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from resume_matcher import match_resumes_with_job

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

UPLOAD_FOLDER = "uploaded_resumes"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/match_resumes", methods=["POST"])
def match_resumes():
    job_description = request.form.get("job_description")
    if "resumes" not in request.files or not job_description:
        return jsonify({"error": "Missing job description or resumes"}), 400

    uploaded_files = request.files.getlist("resumes")
    for file in uploaded_files:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

    ranked_resumes = match_resumes_with_job(job_description, UPLOAD_FOLDER)
    return jsonify({"ranked_resumes": ranked_resumes})

if __name__ == "__main__":
    app.run(debug=True)
