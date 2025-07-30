import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import './SupportModal.css';

const SupportModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!currentUser) {
        throw new Error('Please log in to submit a support ticket');
      }

      console.log('🎫 Submitting support ticket...', {
        subject: formData.subject,
        priority: formData.priority,
        userEmail: currentUser.email
      });

      // Get the current Supabase user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Insert the support ticket directly to Supabase
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_email: user.email || currentUser.email,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
          status: 'open'
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Support ticket created:', data.id);

      // Success - ticket was created
      setSuccess(true);
      setFormData({ subject: '', message: '', priority: 'normal' });
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Support ticket error:', error);
      alert(`Failed to submit support ticket: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="support-modal-overlay">
      <div className="support-modal">
        <div className="support-modal-header">
          <h2>Contact Support</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>Support Ticket Submitted!</h3>
            <p>We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="support-form">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                required
              >
                <option value="low">Low - General question</option>
                <option value="normal">Normal - Need help</option>
                <option value="high">High - Urgent issue</option>
              </select>
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Brief description of your issue"
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Please describe your issue in detail..."
                rows="6"
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SupportModal;
