// src/api.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/predict'; // Adjust port if necessary

export const predictActivity = async (data) => {
    try {
        const response = await axios.post(API_URL, data);
        return response.data;
    } catch (error) {
        console.error("Error making API call", error);
        throw error;
    }
};
