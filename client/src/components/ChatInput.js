import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

const ChatInput = () => {
    const [message, setMessage] = useState('');

    const handleSendMessage =async () => {
        if (message.trim()) {
            try {
                // const response = await postMessage({message:message, roomId:roomId, userId:userId});
                // console.log('Message sent successfully:', response);
                // setMessage(''); // Clear the input after sending
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    };


    return (
        <Box 
            display="flex" 
            alignItems="center" 
            sx={{ padding: 2, border: '1px solid #ccc', borderRadius: '4px' }}
        >
            <TextField
                variant="outlined"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{ flexGrow: 1, marginRight: 1 }}
                style={{background:"white"}}
            />
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSendMessage}
            >
                Send
            </Button>
        </Box>
    );
};

export default ChatInput;
