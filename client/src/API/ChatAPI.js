// src/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const postMessage = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/chat/sendMessage`, { data });
        return response; 
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const getRoomsList = async () => {
    try {
        const response = await axios.get(`${API_URL}/rooms/`, {  });
        return response; 
    } catch (error) {
        console.error('Error getting rooms list:', error);
        throw error;
    }
};

export const subscribeRoom = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/users/subscribe`,data);
        return response; 
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};