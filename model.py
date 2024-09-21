import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
# pip install scikit-learn
import joblib

# Load dataset (ensure dataset.csv is present in the same directory)
df = pd.read_csv('dataset.csv')

# Convert boolean and categorical variables to numerical
df['panic_button_pressed'] = df['panic_button_pressed'].astype(int)
df['companion_presence'] = df['companion_presence'].astype(int)
df['is_in_safe_zone'] = df['is_in_safe_zone'].astype(int)
df['alert_triggered'] = df['alert_triggered'].astype(int)

label_encoders = {}

# Encode categorical features
for column in ['position', 'activity', 'time_of_day', 'phone_status']:
    le = LabelEncoder()
    df[column] = le.fit_transform(df[column])
    label_encoders[column] = le

# Features and target
X = df.drop(columns=['activity', 'location',
            'panic_button_pressed', 'alert_triggered'])  # Drop non-features
y = df['activity']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)

# Create and train the model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the model and label encoders
joblib.dump(model, 'model.pkl')
joblib.dump(label_encoders, 'label_encoders.pkl')

print("Model and label encoders saved!")