import React, { useState, useRef, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import apiClient from '../api';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [connection, setConnection] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // make new connection with signalR
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7049/hubs/chat', {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('SignalR Connected');
          
          loadMessages();
        })
        .catch(err => console.error('SignalR Connection Error:', err));

      
      connection.on('ReceiveMessage', (userId, userName, message, timestamp) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: message,
          sender: userId === 'me' ? 'me' : 'other',
          timestamp: timestamp
        }]);
      });
    }

    return () => {
      if (connection) {
        connection.off('ReceiveMessage');
      }
    };
  }, [connection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await apiClient.get('/chat/messages');
      setMessages(response.data.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.senderId === 'me' ? 'me' : 'other',
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !connection) return;

    try {
      
      await connection.invoke('SendMessage', 'me', 'Me', inputText);
      
      
      await apiClient.post('/chat/messages', {
        senderId: 'me',
        content: inputText
      });

      setInputText("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        <div className="chat-header">
          <h2>Chat</h2>
          <span className="status-indicator">● Online</span>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
              <div className="message-content">
                <p>{msg.text}</p>
                <span className="message-time">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="send-button">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;