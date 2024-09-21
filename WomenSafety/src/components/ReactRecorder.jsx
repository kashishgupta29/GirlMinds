import React, { useEffect, useState } from 'react';
import { ReactMic } from 'react-mic';
import { Mic, MicOff, Download, Trash2 } from 'lucide-react'

const AudioTimer = ({ isRunning, elapsedTime, setElapsedTime }) => {
    useEffect(() => {
        let interval = null;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsedTime((prevTime) => prevTime + 1);
            }, 1000);
        } else if (!isRunning && elapsedTime !== 0) {
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, elapsedTime, setElapsedTime]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return <span className="text-lg font-mono">{formatTime(elapsedTime)}</span>;
};

const ReactRecorder = ({ autoStartRecording = false }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [voice, setVoice] = useState(false);
    const [recordBlobLink, setRecordBlobLink] = useState(null);
    const [recordingStatus, setRecordingStatus] = useState('');
    const [audioBlob, setAudioBlob] = useState(null);

    useEffect(() => {
        if (autoStartRecording) {
            startHandle();
            const timeout = setTimeout(stopHandle, 30000);
            return () => clearTimeout(timeout);
        }
    }, [autoStartRecording]);

    const onStop = (recordedBlob) => {
        setRecordBlobLink(recordedBlob.blobURL);
        setAudioBlob(recordedBlob.blob);
        setIsRunning(false);
        setRecordingStatus('Recording saved!');

        // Create a new blob for download as MP4
        const mp4Blob = new Blob([recordedBlob.blob], { type: 'audio/mp4' });
        downloadAudio(mp4Blob); // Use the new blob for downloading
    };

    const startHandle = () => {
        setElapsedTime(0);
        setIsRunning(true);
        setVoice(true);
        setRecordingStatus('Recording started...');
    };

    const stopHandle = () => {
        setIsRunning(false);
        setVoice(false);
    };

    const clearHandle = () => {
        setIsRunning(false);
        setVoice(false);
        setRecordBlobLink(null);
        setAudioBlob(null);
        setElapsedTime(0);
        setRecordingStatus('');
    };

    const downloadAudio = (blob) => {
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'audio/mp4' }));
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `recording_${new Date().toISOString()}.mp4`; // Change extension to .mp4
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    };


    const handleManualDownload = () => {
        if (audioBlob) {
            downloadAudio(audioBlob);
        }
    };

    return (
        <div className="w-full max-w-lg h-min  ">
            <h1 className="text-2xl font-bold mb-4">Audio Recording</h1>
        <div className='p-4 bg-white rounded-lg shadow-md' >

            {recordingStatus && (
                <div className={`alert ${recordingStatus.includes('saved') ? 'alert-success' : 'alert-error'} mb-4`}>
                    {recordingStatus}
                </div>
            )}
            <div className='flex items-baseline gap-2 mb-4'>
                <h2 className="text-2xl font-semibold">Audio Recorder:</h2>
                <AudioTimer
                    isRunning={isRunning}
                    elapsedTime={elapsedTime}
                    setElapsedTime={setElapsedTime}
                />
            </div>
            <ReactMic
                record={voice}
                className="sound-wave w-full h-16 mb-4"
                onStop={onStop}
                strokeColor="#000000"
                backgroundColor="#ffffff"
            />
            <div className="flex space-x-2 mb-4">
                {!voice ? (
                    <button onClick={startHandle} className="flex items-center bg-green-400 p-2 rounded-lg">
                        <Mic className="mr-2 h-4 w-4" />
                        Start
                    </button>
                ) : (
                    <button onClick={stopHandle} variant="destructive" className="flex items-center bg-red-400 p-2 rounded-lg">
                        <MicOff className="mr-2 h-4 w-4" />
                        Stop
                    </button>
                )}
                {recordBlobLink && (
                    <>
                        <button onClick={handleManualDownload} variant="outline" className="flex items-center bg-blue-400 p-2 rounded-lg">
                            <Download className="mr-2 h-4 w-4" />
                            Download MP4
                        </button>
                        <button onClick={clearHandle} variant="ghost" className="flex items-center bg-slate-400 p-2 rounded-lg">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear
                        </button>
                    </>
                )}
            </div>
            {recordBlobLink && (
                <audio controls src={recordBlobLink} className="w-full" />
            )}
        </div>
        </div>

    );
};

export default ReactRecorder;
