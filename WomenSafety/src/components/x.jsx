import React, { useState, useRef, useEffect } from 'react';
import { predictActivity } from './api'; // Assuming you have an API utility to predict activity
import ReactRecorder from './components/ReactRecorder'; // Custom Recorder Component
import CameraCapture from './components/CameraCapture'; // Custom Camera Capture Component

function App() {
    const [activity, setActivity] = useState('');
    const [heartbeat, setHeartbeat] = useState(110);
    const [position, setPosition] = useState('standing');
    const [timeOfDay, setTimeOfDay] = useState('morning');
    const [phoneStatus, setPhoneStatus] = useState('active');
    const [surroundingNoiseLevel, setSurroundingNoiseLevel] = useState(90);
    const [companionPresence, setCompanionPresence] = useState(0);
    const [isInSafeZone, setIsInSafeZone] = useState('Yes');
    const [panicButtonPressed, setPanicButtonPressed] = useState(0);
    const [alertTriggered, setAlertTriggered] = useState(0);

    const [relativePhone, setRelativePhone] = useState('8442011874');
    const [policeHelpline] = useState('112');
    const [location, setLocation] = useState({ latitude: '', longitude: '' });

    const [isCapturing, setIsCapturing] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recordingTimeout, setRecordingTimeout] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [mediaStream, setMediaStream] = useState(null);

    // Use Geolocation to get user location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.error("Error fetching location", error);
            }
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate important fields
        if (!heartbeat || !position || !location.latitude || !location.longitude) {
            alert("Please ensure all fields are filled correctly.");
            return;
        }

        const data = {
            heartbeat,
            position,
            time_of_day: timeOfDay,
            phone_status: phoneStatus,
            surrounding_noise_level: surroundingNoiseLevel,
            companion_presence: companionPresence,
            is_in_safe_zone: isInSafeZone === 'Yes' ? 1 : 0,
            panic_button_pressed: panicButtonPressed,
            alert_triggered: alertTriggered,
            location: `${location.latitude},${location.longitude}`,
        };

        try {
            const result = await predictActivity(data);
            setActivity(result.predicted_activity);

            if (result.predicted_activity === 'trouble') {
                setIsCapturing(true);
                startRecording();
                shareLocation();
            }
        } catch (error) {
            console.error("Error predicting activity", error);
        }
    };

    const shareLocation = () => {
        const url = `https://api.whatsapp.com/send?phone=${relativePhone}&text=URGENT!%20The%20user%20is%20in%20trouble.%20Current%20location%3A%20https%3A%2F%2Fwww.google.com%2Fmaps%3Fq%3D${location.latitude},${location.longitude}`;
        window.open(url, '_blank');
    };

    const startRecording = async () => {
        setRecording(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            setMediaStream(stream);
            videoRef.current.srcObject = stream;
            videoRef.current.play();

            const timeout = setTimeout(() => {
                stopRecording();
            }, 30000); // 30 seconds auto-stop

            setRecordingTimeout(timeout);
        } catch (err) {
            console.error("Error accessing media devices.", err);
        }
    };

    const stopRecording = () => {
        setRecording(false);
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (recordingTimeout) {
            clearTimeout(recordingTimeout);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-2 text-center">Activity Prediction</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1">Heartbeat</label>
                        <input
                            type="number"
                            value={heartbeat}
                            onChange={(e) => setHeartbeat(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        />
                        <label className="block mb-1">Position</label>
                        <select
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        >
                            <option value="lying down">Lying Down</option>
                            <option value="sitting">Sitting</option>
                            <option value="standing">Standing</option>
                        </select>
                        <label className="block mb-1">Phone Status</label>
                        <select
                            value={phoneStatus}
                            onChange={(e) => setPhoneStatus(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        >
                            <option value="active">Active</option>
                            <option value="idle">Idle</option>
                            <option value="off">Off</option>
                        </select>
                        <label className="block mb-1">Is in Safe Zone?</label>
                        <select
                            value={isInSafeZone}
                            onChange={(e) => setIsInSafeZone(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                        <label className="block mb-1">Relative Phone Number</label>
                        <input
                            type="text"
                            value={relativePhone}
                            onChange={(e) => setRelativePhone(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        />
                        <label className="block mb-1">Live Location</label>
                        <p className="text-sm mb-4 p-2 border border-gray-300 rounded">
                            Latitude: {location.latitude || 'Fetching...'}, Longitude: {location.longitude || 'Fetching...'}
                        </p>
                    </div>
                    <div>
                        <label className="block mb-1">Time of Day</label>
                        <select
                            value={timeOfDay}
                            onChange={(e) => setTimeOfDay(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        >
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                            <option value="evening">Evening</option>
                            <option value="night">Night</option>
                        </select>
                        <label className="block mb-1">Surrounding Noise Level</label>
                        <input
                            type="number"
                            value={surroundingNoiseLevel}
                            onChange={(e) => setSurroundingNoiseLevel(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        />
                        <label className="block mb-1">Companion Presence</label>
                        <select
                            value={companionPresence}
                            onChange={(e) => setCompanionPresence(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        >
                            <option value={0}>No</option>
                            <option value={1}>Yes</option>
                        </select>
                        <label className="block mb-1">Panic Button Pressed</label>
                        <select
                            value={panicButtonPressed}
                            onChange={(e) => setPanicButtonPressed(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        >
                            <option value={0}>No</option>
                            <option value={1}>Yes</option>
                        </select>
                        <label className="block mb-1">Alert Triggered</label>
                        <select
                            value={alertTriggered}
                            onChange={(e) => setAlertTriggered(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        >
                            <option value={0}>No</option>
                            <option value={1}>Yes</option>
                        </select>
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white p-2 rounded mt-4"
                >
                    Predict Activity
                </button>
            </form>

            <h2 className="mt-8 text-xl">
                Predicted Activity: <span className="font-bold">{activity}</span>
            </h2>

            {activity === 'trouble' && (
                <>
                    <ReactRecorder />
                    <CameraCapture videoRef={videoRef} canvasRef={canvasRef} />
                </>
            )}
        </div>
    );
}

export default App;
