from flask import Flask, request, jsonify
# pip install flask   
from flask_cors import CORS  # Import CORS
# pip install flask-cors;
import joblib
# pip install joblib
import pandas as pd
# pip install pandas
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Directory where audio files will be stored
UPLOAD_FOLDER = 'uploaded_audios'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# Load your model and label encoders
model = joblib.load('model.pkl')  # Adjust the path as needed
label_encoders = joblib.load('label_encoders.pkl')  # Adjust the path as needed


@app.route('/')
def home():
    return "Welcome to the Activity Prediction API"

@app.route('/predict', methods=['POST'])
def predict():
    # Get JSON data from the request
    data = request.get_json()

    # Prepare the input DataFrame
    input_data = pd.DataFrame({
        'heartbeat': [data['heartbeat']],
        'position': [label_encoders['position'].transform([data['position']])[0]],
        'time_of_day': [label_encoders['time_of_day'].transform([data['time_of_day']])[0]],
        'phone_status': [label_encoders['phone_status'].transform([data['phone_status']])[0]],
        'surrounding_noise_level': [data['surrounding_noise_level']],
        'companion_presence': [data['companion_presence']],
        'is_in_safe_zone': [data['is_in_safe_zone']],
    })

    # Make prediction
    prediction = model.predict(input_data)
    predicted_activity = label_encoders['activity'].inverse_transform(prediction)

    return jsonify({'predicted_activity': predicted_activity[0]})

@app.route('/upload-audio', methods=['POST'])
def upload_audio():
    try:
        # Check if the audio file is present in the request
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio = request.files['audio']
        
        # Define the path where the file will be saved
        file_path = os.path.join(UPLOAD_FOLDER, audio.filename)
        audio.save(file_path)  # Save the file

        return jsonify({"message": "Audio uploaded successfully", "filePath": file_path})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)  # You can change the port if needed
