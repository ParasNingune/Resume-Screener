from flask import Flask, request, jsonify
from resume_matcher import match_resumes_with_job

app = Flask(__name__)

@app.route("/match_resumes", methods=["POST"])
def match_resumes():
    data = request.json
    job_description = data.get("job_description")
    resume_folder = data.get("resume_folder")

    if not job_description or not resume_folder:
        return jsonify({"error": "Missing job description or resume folder"}), 400

    ranked_resumes = match_resumes_with_job(job_description, resume_folder)
    return jsonify({"ranked_resumes": ranked_resumes})

if __name__ == "__main__":
    app.run(debug=True)
