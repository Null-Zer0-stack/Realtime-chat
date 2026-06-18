import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import apiClient from '../api';
import './Chat.css';

const Chat = ({ setIsLoggedIn }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [connection, setConnection] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserIdVisible, setCurrentUserIdVisible] = useState("");
  const [friendIdInput, setFriendIdInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserName(payload.name || payload.unique_name || "User");
        
        if (payload.userIdVisible) {
          setCurrentUserIdVisible(payload.userIdVisible);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setCurrentUserName("User");
      }
    }
  }, []);

  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await apiClient.get('/chat/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  
  useEffect(() => {
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
        })
        .catch(err => console.error('SignalR Connection Error:', err));

      connection.on('ReceiveMessage', (senderId, senderName, receiverId, message, timestamp) => {
        if (selectedFriend && 
            (senderId === selectedFriend.id.toString() || receiverId === selectedFriend.id.toString())) {
          setMessages(prev => {
            const isDuplicate = prev.some(m => m.text === message && m.timestamp === timestamp);
            if (isDuplicate) return prev;
            return [...prev, {
              id: Date.now() + Math.random(),
              senderId: senderId,
              senderName: senderName,
              text: message,
              timestamp: timestamp
            }];
          });
        }
      });
    }

    return () => {
      if (connection) {
        connection.off('ReceiveMessage');
      }
    };
  }, [connection, selectedFriend]);

  
  useEffect(() => {
    if (selectedFriend && connection) {
      loadMessages(selectedFriend.id.toString());
    }
  }, [selectedFriend, connection]);

 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (friendId) => {
    try {
      const response = await apiClient.get(`/chat/messages/${friendId}`);
      setMessages(response.data.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.content,
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  
  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendIdInput.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiClient.get(`/chat/user/${friendIdInput.trim()}`);
      const foundUser = response.data;
      
      
      if (!users.some(u => u.id === foundUser.id)) {
        setUsers([...users, foundUser]);
      }
      
      
      setSelectedFriend(foundUser);
      setFriendIdInput("");
    } catch (error) {
      alert('User not found! Please check the ID and try again.');
      console.error('Error finding user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedFriend || !connection) {
      console.log('Cannot send:', { hasText: inputText.trim(), hasFriend: selectedFriend, hasConnection: connection });
      return;
    }

    try {
      console.log('Sending message to:', selectedFriend.id);
      
      
      await apiClient.post('/chat/messages', {
        senderId: currentUserName, 
        senderName: currentUserName,
        receiverId: selectedFriend.id.toString(),
        content: inputText
      });

      setInputText("");
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleLogout = () => {
    if (connection) {
      connection.stop();
    }
    localStorage.removeItem('token');
    if (setIsLoggedIn) {
      setIsLoggedIn(false);
    }
    navigate('/');
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-left">
            <h2>Chat</h2>
            {currentUserIdVisible && (
              <span className="my-user-id">
                Your ID: <strong>{currentUserIdVisible}</strong>
              </span>
            )}
            {selectedFriend && (
              <span className="chatting-with">
                Chatting with: <strong>{selectedFriend.name}</strong>
              </span>
            )}
          </div>
          <div className="header-right">
            <span className="status-indicator">● Online</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <div className="chat-body">
          
          <div className="users-sidebar">
            <h3>Online Users</h3>
            
            <div className="add-friend-section">
              <form onSubmit={handleAddFriend} className="add-friend-form">
                <input
                  type="text"
                  placeholder="Enter friend's ID..."
                  value={friendIdInput}
                  onChange={(e) => setFriendIdInput(e.target.value.toUpperCase())}
                  maxLength="8"
                  className="friend-id-input"
                />
                <button type="submit" disabled={isLoading} className="add-friend-btn">
                  {isLoading ? '...' : 'Add'}
                </button>
              </form>
            </div>

            <div className="users-list">
              {users.map(user => (
                <div
                  key={user.id}
                  className={`user-item ${selectedFriend?.id === user.id ? 'active' : ''}`}
                  onClick={() => setSelectedFriend(user)}
                >
                  <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-id">ID: {user.userIdVisible}</span>
                  </div>
                  {user.isOnline && <span className="online-dot">●</span>}
                </div>
              ))}
            </div>
          </div>

    
          <div className="chat-area">
            {selectedFriend ? (
              <>
                <div className="chat-messages">
                  {messages.map((msg) => {
                    const isMe = msg.senderName === currentUserName;
                    return (
                      <div key={msg.id} className={`message ${isMe ? 'sent' : 'received'}`}>
                        <div className="message-content">
                          {!isMe && <span className="sender-name">{msg.senderName}</span>}
                          <p>{msg.text}</p>
                          <span className="message-time">{msg.timestamp}</span>
                        </div>
                      </div>
                    );
                  })}
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
                  <button type="submit" className="send-button" disabled={!inputText.trim()}>
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="no-chat-selected">
                <div className="no-chat-icon">💬</div>
                <h3>Select a user to start chatting</h3>
                <p>Enter a friend's ID or click on a user from the list to begin conversation</p>
                {currentUserIdVisible && (
                  <div className="your-id-display">
                    <p>Your User ID: <strong>{currentUserIdVisible}</strong></p>
                    <p className="share-id-hint">Share this ID with friends so they can add you!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;