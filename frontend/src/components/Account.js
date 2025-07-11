import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

const Account = () => {
  const { currentUser, logout, updatePassword } = useAuth();
  const navigate = useNavigate();
  
  // State for user stats
  const [userStats, setUserStats] = useState({
    totalAnalyses: 0,
    joinDate: '',
    lastAnalysis: '',
    creditBalance: 0
  });
  
  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // State for UI
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch user stats on component mount
  useEffect(() => {
    if (currentUser) {
      fetchUserStats();
    }
  }, [currentUser]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);

      // Debug: Log current user data
      console.log('Current user data:', currentUser);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      // Fetch stats from backend
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/account-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account statistics');
      }

      const data = await response.json();
      const stats = data.stats;

      // Format the data for display
      const totalAnalyses = stats.totalAnalyses || 0;

      // Debug and fix join date
      console.log('Stats join date:', stats.joinDate);
      console.log('Current user created_at:', currentUser?.created_at);
      console.log('Full current user object:', currentUser);

      let joinDate = 'January 2024'; // Default fallback
      if (stats.joinDate) {
        joinDate = new Date(stats.joinDate).toLocaleDateString();
      } else if (currentUser?.created_at) {
        joinDate = new Date(currentUser.created_at).toLocaleDateString();
      } else if (currentUser?.user_metadata?.created_at) {
        joinDate = new Date(currentUser.user_metadata.created_at).toLocaleDateString();
      }

      const lastAnalysis = stats.lastAnalysis
        ? new Date(stats.lastAnalysis).toLocaleDateString()
        : 'No analyses yet';
      const creditBalance = stats.creditBalance || 0;

      setUserStats({
        totalAnalyses,
        joinDate,
        lastAnalysis,
        creditBalance
      });

    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Failed to load user statistics');

      // Set fallback data even when there's an error
      setUserStats({
        totalAnalyses: 0,
        joinDate: 'January 2024',
        lastAnalysis: 'No analyses yet',
        creditBalance: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordLoading(true);

      // Update password using the context method
      await updatePassword(passwordData.newPassword);

      setMessage('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      setError('');

      // Get auth token properly
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      console.log('Attempting to delete account...');

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete account response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete account error:', errorData);
        throw new Error(errorData.error || 'Failed to delete account');
      }

      const result = await response.json();
      console.log('Account deletion successful:', result);

      // Logout and redirect
      await logout();
      navigate('/');

    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account. Please try again or contact support.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/image_2.png"
          alt="Background"
          className="w-full h-full object-contain opacity-80"
        />
      </div>
      {/* Navigation */}
      <nav className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Hairalyze
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">My Account</h1>
            <p className="text-gray-300 mt-2">Manage your profile and preferences</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Messages */}
            {message && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* User Info Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile Information</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-lg text-gray-800">{currentUser?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Account Statistics</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{userStats.totalAnalyses}</div>
                  <p className="text-blue-800 font-medium">Total Analyses</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{userStats.creditBalance}</div>
                  <p className="text-green-800 font-medium">Credits Remaining</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
                  <div className="text-sm font-bold text-purple-600 mb-2">{userStats.lastAnalysis}</div>
                  <p className="text-purple-800 font-medium">Last Analysis</p>
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Change Password</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className={`px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium transition-all duration-200 ${
                      passwordLoading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-red-600 mb-4">Danger Zone</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Account</h3>
                <p className="text-red-700 mb-4">
                  Once you delete your account, there is no going back. This will permanently delete your account,
                  all your hair analyses, and remove all associated data.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-red-800 font-medium">
                      Are you absolutely sure? This action cannot be undone.
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className={`px-6 py-2 bg-red-600 text-white rounded-lg font-medium transition-colors ${
                          deleteLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                        }`}
                      >
                        {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Support Section */}
            <div className="mt-8 text-center">
              <button
                onClick={() => window.open('mailto:support@hairalyze.com', '_blank')}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                📧 Contact Support
              </button>
              <p className="text-gray-600 text-sm mt-2">
                Need help? We're here to assist you with any questions or concerns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
