import React, { useState, useRef, useEffect } from 'react';
import { predictActivity } from './api';
import { ReactMic } from 'react-mic';
import ReactRecorder from './components/ReactRecorder';
import CameraCapture from './components/CameraCapture';
import logo from './assets/logo.png';

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
    const [location, setLocation] = useState({ latitude: null, longitude: null });

    const [isCapturing, setIsCapturing] = useState(false);
    const [recording, setRecording] = useState(false);
    const [audioData, setAudioData] = useState(null);
    const [relativePhone, setRelativePhone] = useState('8442011874');
    const [recordingTimeout, setRecordingTimeout] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [mediaStream, setMediaStream] = useState(null);

    // Function to get live location using Geolocation API
    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Error getting location', error);
                }
            );
        } else {
            console.error('Geolocation not supported by this browser.');
        }
    };

    const shareLocation = () => {
        const url = `https://api.whatsapp.com/send?phone=${relativePhone}&text=URGENT!%20The%20user%20is%20in%20trouble.%20Current%20location%3A%20https%3A%2F%2Fwww.google.com%2Fmaps%3Fq%3D${location.latitude},${location.longitude}`;
        window.open(url, '_blank');
    };


    const shareLocationOnWhatsApp = () => {
        const message = `Help! The user is in trouble. Current location: ${location}`;

        const whatsappURL = `https://api.whatsapp.com/send?phone=${policeHelpline}&text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');

        const relatives = relativePhoneNumbers.split(',').map(num => num.trim());
        relatives.forEach(relativePhone => {
            const relativeURL = `https://api.whatsapp.com/send?phone=${relativePhone}&text=${encodeURIComponent(message)}`;
            window.open(relativeURL, '_blank');
        });
    };

    // UseEffect to fetch location when the component is loaded
    useEffect(() => {
        getLocation();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

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
            latitude: location.latitude,
            longitude: location.longitude
        };

        try {
            const result = await predictActivity(data);
            setActivity(result.predicted_activity);

            if (result.predicted_activity === 'trouble') {
                startRecording();
                setIsCapturing(true);
                shareLocation();
            }
        } catch (error) {
            console.error("Error predicting activity", error);
        }
    };

    const startRecording = async () => {
        setRecording(true);
        setAudioData(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);
            videoRef.current.srcObject = stream;
            videoRef.current.play();

            const timeout = setTimeout(() => {
                stopRecording();
            }, 30000);

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

    const onStop = async (recordedBlob) => {
        console.log('Recorded Blob: ', recordedBlob);
        setAudioData(recordedBlob);

        // Prepare form data to send audio blob to server
        const formData = new FormData();
        formData.append('audio', recordedBlob.blob, 'audioFile.wav'); // Append the blob and give it a file name

        try {
            // Send the audio file to the server via POST request
            const response = await fetch('http://localhost:5000/upload-audio', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Audio file saved at:', result.filePath);
            } else {
                console.error('Failed to upload audio');
            }
        } catch (error) {
            console.error('Error uploading audio', error);
        }
    };

    return (
        <div className="flex  flex-col items-center  min-h-screen bg-[url('./assets/bgimg.jpg')] p-4">
            

            <h1 className="text-7xl flex font-serif uppercase text-pink-500 font-bold mb-2 text-center">
                <img src={logo} className="mt-2 h-14 w-12 mr-2" alt="Logo" /> She<span className='text-black' >Suraksha</span> </h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-[61rem] ">
                <div className="grid grid-cols-2 gap-4">
                    {/* First Column */}
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
                        {/* Live Location */}

                        <label className="block mb-1">Live Location</label>
                        <p className="text-sm mb-4 p-2 border border-gray-300 rounded">
                            Latitude: {location.latitude || 'Fetching...'}, Longitude: {location.longitude || 'Fetching...'}
                        </p>

                        <label className="block mb-1">Relative Phone Number</label>
                        <input
                            type="text"
                            value={relativePhone}
                            onChange={(e) => setRelativePhone(e.target.value)}
                            className="w-full mb-4 p-2 border border-gray-300 rounded"
                        />
                    </div>

                    {/* Second Column */}
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
                    className="w-full bg-blue-500 text-white py-2 mt-4 rounded hover:bg-blue-600 transition"
                >
                    Predict Activity
                </button>
            </form>

            {activity && (
                <>
                    <h2 className="mt-2 mb-2 text-xl text-red-500 font-bold">Predicted Activity: {activity}</h2>
                    {activity === 'trouble' && (
                        <>
                            <video ref={videoRef} style={{ display: 'none' }} />
                            <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
                            <div className="flex gap-4">

                                <ReactRecorder autoStartRecording={true} onStop={onStop} />
                                <CameraCapture isCapturing={isCapturing} />
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default App;
