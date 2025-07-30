import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './AdminSupport.css';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      console.log('👨‍💼 Loading all support tickets...');

      // Load tickets directly from Supabase (bypassing RLS for admin)
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading tickets:', error);
        // If RLS blocks us, we'll show a message
        if (error.code === 'PGRST116') {
          alert('Admin access required. Please contact the developer to set up admin access.');
        }
      } else {
        console.log(`✅ Loaded ${tickets.length} support tickets`);
        setTickets(tickets);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      console.log(`👨‍💼 Updating ticket ${ticketId} status to: ${status}`);

      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating ticket status:', error);
        alert('Failed to update ticket status. You may need admin permissions.');
      } else {
        console.log(`✅ Ticket ${ticketId} status updated to: ${status}`);
        loadTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({...selectedTicket, status});
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const respondToTicket = async (ticketId) => {
    try {
      console.log(`👨‍💼 Responding to ticket ${ticketId}`);

      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          admin_response: response,
          admin_responded_at: new Date().toISOString(),
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error responding to ticket:', error);
        alert('Failed to send response. You may need admin permissions.');
      } else {
        console.log(`✅ Response sent to ticket ${ticketId}`);
        setResponse('');
        loadTickets();
        alert('Response sent successfully!');
      }
    } catch (error) {
      console.error('Error sending response:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'normal': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-support-container">
        <div className="loading">Loading support tickets...</div>
      </div>
    );
  }

  return (
    <div className="admin-support-container">
      <div className="admin-header">
        <h1>Support Tickets</h1>
        <div className="ticket-stats">
          <span className="stat">Total: {tickets.length}</span>
          <span className="stat">Open: {tickets.filter(t => t.status === 'open').length}</span>
          <span className="stat">In Progress: {tickets.filter(t => t.status === 'in_progress').length}</span>
        </div>
      </div>

      <div className="admin-content">
        <div className="tickets-sidebar">
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({tickets.length})
            </button>
            <button 
              className={filter === 'open' ? 'active' : ''}
              onClick={() => setFilter('open')}
            >
              Open ({tickets.filter(t => t.status === 'open').length})
            </button>
            <button 
              className={filter === 'in_progress' ? 'active' : ''}
              onClick={() => setFilter('in_progress')}
            >
              In Progress ({tickets.filter(t => t.status === 'in_progress').length})
            </button>
          </div>

          <div className="tickets-list">
            {filteredTickets.map(ticket => (
              <div 
                key={ticket.id}
                className={`ticket-item ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="ticket-header">
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                  >
                    {ticket.priority}
                  </span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(ticket.status) }}
                  >
                    {ticket.status}
                  </span>
                </div>
                <h3>{ticket.subject}</h3>
                <p className="ticket-meta">
                  {ticket.user_email} • {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="ticket-details">
          {selectedTicket ? (
            <div>
              <div className="ticket-detail-header">
                <h2>{selectedTicket.subject}</h2>
                <div className="ticket-actions">
                  <select 
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="ticket-info">
                <p><strong>From:</strong> {selectedTicket.user_email}</p>
                <p><strong>Priority:</strong> {selectedTicket.priority}</p>
                <p><strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</p>
                {selectedTicket.updated_at !== selectedTicket.created_at && (
                  <p><strong>Updated:</strong> {new Date(selectedTicket.updated_at).toLocaleString()}</p>
                )}
              </div>

              <div className="ticket-message">
                <h3>Message:</h3>
                <div className="message-content">{selectedTicket.message}</div>
              </div>

              {selectedTicket.admin_response && (
                <div className="admin-response">
                  <h3>Your Response:</h3>
                  <div className="response-content">{selectedTicket.admin_response}</div>
                  <p className="response-date">
                    Sent: {new Date(selectedTicket.admin_responded_at).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="response-form">
                <h3>Send Response:</h3>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response here..."
                  rows="4"
                />
                <button 
                  onClick={() => respondToTicket(selectedTicket.id)}
                  disabled={!response.trim()}
                  className="send-response-btn"
                >
                  Send Response
                </button>
              </div>
            </div>
          ) : (
            <div className="no-ticket-selected">
              <p>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
