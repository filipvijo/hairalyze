import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './History.css';

const History = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadChatHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/chat/history`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load chat history: ${response.status}`);
      }

      const data = await response.json();
      setChatHistory(data.conversations || []);
    } catch (err) {
      console.error('❌ Error loading chat history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (message, maxLength = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const openChat = (conversation) => {
    // Navigate to the submission page with the chat open
    navigate(`/submissions`, { 
      state: { 
        openChatForSubmission: conversation.submissionId,
        chatHistory: conversation.messages 
      } 
    });
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your chat history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="error-message">
          <h2>❌ Error Loading History</h2>
          <p>{error}</p>
          <button onClick={loadChatHistory} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const containerStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/images/image_8.png)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="history-container" style={containerStyle}>
      <div className="history-header">
        <h1>💬 Chat History</h1>
        <p>Your previous conversations with the AI Hair Analyst</p>
        <button onClick={() => navigate('/submissions')} className="back-button">
          ← Back to Submissions
        </button>
      </div>

      {chatHistory.length === 0 ? (
        <div className="no-history">
          <div className="no-history-icon">💭</div>
          <h2>No Chat History Yet</h2>
          <p>Start a conversation with the AI Hair Analyst to see your chat history here.</p>
          <button onClick={() => navigate('/submissions')} className="start-chat-button">
            Go to Submissions
          </button>
        </div>
      ) : (
        <div className="history-list">
          {chatHistory.map((conversation, index) => (
            <div key={conversation._id || index} className="history-item">
              <div className="history-item-header">
                <h3>{conversation.title || `Chat ${index + 1}`}</h3>
                <span className="history-date">
                  {formatDate(conversation.createdAt)}
                </span>
              </div>
              
              <div className="history-preview">
                {conversation.messages && conversation.messages.length > 0 ? (
                  <div className="message-preview">
                    <strong>Last message:</strong> {truncateMessage(
                      conversation.messages[conversation.messages.length - 1]?.content || 'No messages'
                    )}
                  </div>
                ) : (
                  <div className="message-preview">No messages in this conversation</div>
                )}
              </div>

              <div className="history-stats">
                <span className="message-count">
                  {conversation.messages?.length || 0} messages
                </span>
                <button 
                  onClick={() => openChat(conversation)}
                  className="continue-chat-button"
                >
                  Continue Chat →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
