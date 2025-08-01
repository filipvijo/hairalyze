import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

const HairAnalystChat = ({ analysisData, submissionData, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  // const [conversationId, setConversationId] = useState(null); // Removed unused variable
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();

  const defaultWelcomeMessage = {
    id: 'welcome-' + Date.now(),
    type: 'ai',
    content: "Hi! I'm your AI Hair Analyst. I've reviewed your hair analysis and I'm here to answer any questions you have about your hair care routine, products, styling tips, or anything else related to your hair health. What would you like to know?",
    timestamp: new Date().toISOString()
  };

  // Load chat history when component mounts
  const loadChatHistory = async () => {
    if (!submissionData?.id) {
      console.log('❌ No submission ID, starting fresh chat. SubmissionData:', submissionData);
      setMessages([defaultWelcomeMessage]);
      setIsLoadingHistory(false);
      return;
    }

    try {
      console.log('🔄 Loading chat history for submission:', submissionData.id);
      console.log('🔧 Full submission data:', submissionData);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      // Use environment variable for API URL
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const fetchUrl = `${apiUrl}/api/chat/${submissionData.id}`;
      console.log('🔧 Loading chat history for submission:', submissionData.id);

      const response = await fetch(fetchUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to load chat history: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success && data.messages && data.messages.length > 0) {
        console.log('✅ Loaded', data.messages.length, 'previous messages');
        setMessages(data.messages);
        // setConversationId(data.conversation?.id); // Removed unused variable
      } else {
        console.log('📝 No previous chat history, starting fresh');
        setMessages([defaultWelcomeMessage]);
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      setMessages([defaultWelcomeMessage]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save chat history to database
  const saveChatHistory = async (updatedMessages) => {
    if (!submissionData?.id || updatedMessages.length === 0) {
      console.log('❌ Cannot save chat - missing submission ID or no messages:', {
        submissionId: submissionData?.id,
        messageCount: updatedMessages.length
      });
      return;
    }

    try {
      console.log('💾 Saving chat history:', {
        submissionId: submissionData.id,
        messageCount: updatedMessages.length
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('❌ No auth token for saving chat');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/chat/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId: submissionData.id,
          messages: updatedMessages,
          title: 'Hair Analysis Chat'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Chat history saved successfully:', result);
      } else {
        const errorText = await response.text();
        console.error('❌ Save failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error saving chat history:', error);
    }
  };

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadChatHistory();
  }, [submissionData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Suggested questions for better UX
  const suggestedQuestions = [
    "What specific products would work best for my hair type?",
    "How can I improve my hair strength score?",
    "What styling techniques suit my hair texture?",
    "How often should I wash my hair?",
    "What ingredients should I avoid?"
  ];

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: 'user-' + Date.now(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Get authentication token based on provider
      let token = null;

      if (currentUser.isFirebaseUser) {
        // Firebase user - get Firebase token
        token = await currentUser.getIdToken();
      } else {
        // Supabase user - get Supabase token
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
        if (!token) {
          throw new Error('Supabase authentication token not available. Please log in again.');
        }
      }
      // Use environment variable for API URL
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.post(`${apiUrl}/api/chat-analyst`, {
        message: messageText.trim(),
        analysisData,
        submissionData,
        chatHistory: messages.slice(-5) // Send last 5 messages for context
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': currentUser.isFirebaseUser ? currentUser.uid : currentUser.id,
          'Content-Type': 'application/json'
        }
      });

      const aiMessage = {
        id: 'ai-' + (Date.now() + 1),
        type: 'ai',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessagesWithUser, aiMessage];
      setMessages(finalMessages);

      // Save the complete conversation (user message + AI response)
      await saveChatHistory(finalMessages);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Sorry, I had trouble processing your question. Please try again.');
      
      const errorMessage = {
        id: 'error-' + (Date.now() + 1),
        type: 'ai',
        content: "I apologize, but I'm having trouble connecting right now. Please try asking your question again in a moment.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleSuggestedQuestion = (question) => {
    sendMessage(question);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent to-primary text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">💬 AI Hair Analyst</h2>
            <p className="text-white/80 text-sm">Ask me anything about your hair analysis</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your chat history...</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-accent to-primary'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p
                  className={`whitespace-pre-wrap ${
                    message.type === 'user'
                      ? 'font-medium'
                      : ''
                  }`}
                  style={message.type === 'user' ? { color: '#ffffff' } : {}}
                >{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-600 mb-3">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your hair care routine, products, styling tips..."
              className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default HairAnalystChat;
