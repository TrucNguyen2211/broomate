// FE/src/pages/shared/AccountPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import { useTheme } from '../../contexts/ThemeContext';

function AccountPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role; // 'TENANT' or 'LANDLORD'

  // User data from API
  const [userData, setUserData] = useState(null);
  const [updateFormData, setUpdateFormData] = useState(null);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const districts = [
    'District 1', 'District 2', 'District 3', 'District 4', 'District 5',
    'District 6', 'District 7', 'District 8', 'District 9', 'District 10',
    'Binh Thanh', 'Phu Nhuan', 'Tan Binh', 'Go Vap'
  ];

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const data = userRole === 'TENANT' 
        ? await userService.getTenantProfile()
        : await userService.getLandlordProfile();

      setUserData(data);
      setUpdateFormData({...data});

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistrictToggle = (district) => {
    setUpdateFormData(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations?.includes(district)
        ? prev.preferredLocations.filter(d => d !== district)
        : [...(prev.preferredLocations || []), district]
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image file');
        e.target.value = '';
        return;
      }

      setUpdateFormData({...updateFormData, avatarFile: file});
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Common fields for both roles
      formData.append('name', updateFormData.name);
      if (updateFormData.phone) formData.append('phone', updateFormData.phone);
      if (updateFormData.description) formData.append('description', updateFormData.description);

      // Tenant-specific fields
      if (userRole === 'TENANT') {
        if (updateFormData.budgetPerMonth) formData.append('budgetPerMonth', updateFormData.budgetPerMonth);
        if (updateFormData.stayLength) formData.append('stayLength', updateFormData.stayLength);
        if (updateFormData.moveInDate) formData.append('moveInDate', updateFormData.moveInDate);
        if (updateFormData.age) formData.append('age', updateFormData.age);
        if (updateFormData.gender) formData.append('gender', updateFormData.gender);

        formData.append('smoking', updateFormData.smoking || false);
        formData.append('cooking', updateFormData.cooking || false);
        formData.append('needWindow', updateFormData.needWindow || false);
        formData.append('mightShareBedRoom', updateFormData.mightShareBedRoom || false);
        formData.append('mightShareToilet', updateFormData.mightShareToilet || false);

        if (updateFormData.preferredLocations && updateFormData.preferredLocations.length > 0) {
          updateFormData.preferredLocations.forEach(location => {
            formData.append('preferredLocations', location);
          });
        }
      }

      // Landlord-specific fields
      if (userRole === 'LANDLORD') {
        formData.append('removeAvatar', updateFormData.removeAvatar || false);
      }

      // Avatar for both roles
      if (updateFormData.avatarFile) {
        formData.append('avatar', updateFormData.avatarFile);
      }

      const responseData = userRole === 'TENANT'
        ? await userService.updateTenantProfile(formData)
        : await userService.updateLandlordProfile(formData);

      setUserData(responseData);
      setUpdateFormData({...responseData});
      alert('Profile updated successfully!');
      setShowUpdateModal(false);
      fetchProfile();

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setIsUpdating(true);

    try {
      await userService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (err) {
      console.error('Error changing password:', err);
      alert(err.message || 'Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
            userRole === 'TENANT' ? 'border-teal-600 dark:border-teal-400' : 'border-pink-600 dark:border-pink-400'
          } mx-auto mb-4`}></div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !userData) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className={`px-6 py-2 text-white rounded-lg ${
              userRole === 'TENANT' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-pink-600 hover:bg-pink-700'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  // Dynamic theme colors based on role
  const theme = userRole === 'TENANT' ? {
    gradient: 'from-teal-50 to-white dark:from-gray-900 dark:to-gray-800',
    avatarGradient: 'from-teal-400 to-teal-600',
    buttonPrimary: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
    badge: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    ring: 'focus:ring-teal-500'
  } : {
    gradient: 'from-pink-50 to-white dark:from-gray-900 dark:to-gray-800',
    avatarGradient: 'from-pink-400 to-pink-600',
    buttonPrimary: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
    badge: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    ring: 'focus:ring-pink-500'
  };

  return (
    <div className={`h-full overflow-y-auto bg-gradient-to-br ${theme.gradient} py-8 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {userRole === 'TENANT' ? 'Tenant' : 'Landlord'} Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {userRole === 'TENANT' 
              ? 'Manage your profile and roommate preferences' 
              : 'Manage your landlord profile'
            }
          </p>
        </div>

        {/* Section 1: Current Profile */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Current Profile</h2>
          
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            {(userData.avatar || userData.avatarUrl) ? (
              <img
                src={userData.avatar || userData.avatarUrl}
                alt={userData.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${theme.avatarGradient} flex items-center justify-center text-white text-3xl font-bold`}>
                {userData.name?.split(' ').map(n => n[0]).join('') || '?'}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Common Fields */}
            <ProfileField label="Name" value={userData.name} />
            <ProfileField label="Email" value={userData.email} />
            {userData.phone && <ProfileField label="Phone" value={userData.phone} />}
            
            <div className="flex border-b border-gray-200 dark:border-gray-700 pb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">Account Type:</span>
              <span className={`px-3 py-1 ${theme.badge} rounded-full text-sm font-semibold`}>
                {userRole === 'TENANT' ? 'Tenant' : 'Landlord'}
              </span>
            </div>

            {userData.description && <ProfileField label="Description" value={userData.description} />}

            {/* Tenant-Specific Fields */}
            {userRole === 'TENANT' && (
              <>
                <div className="pt-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-xl">👥</span>
                    Roommate Preferences
                  </h3>
                </div>
                {userData.budgetPerMonth && (
                  <ProfileField 
                    label="Budget/Month" 
                    value={`${userData.budgetPerMonth.toLocaleString()} VND`} 
                  />
                )}
                {userData.stayLength && (
                  <ProfileField label="Stay Length" value={`${userData.stayLength} months`} />
                )}
                {userData.moveInDate && <ProfileField label="Move-in Date" value={userData.moveInDate} />}
                {userData.preferredLocations && userData.preferredLocations.length > 0 && (
                  <ProfileField 
                    label="Preferred Districts" 
                    value={userData.preferredLocations.join(', ')} 
                  />
                )}
              </>
            )}

            {/* Account Status */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 pb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">Account Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                userData.isActive 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {userData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Landlord-Specific Fields */}
            {userRole === 'LANDLORD' && userData.createdAt && (
              <ProfileField 
                label="Member Since" 
                value={new Date(userData.createdAt).toLocaleDateString()} 
              />
            )}
          </div>
        </div>

        {/* Section 2: Account Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h2>
          <div className="space-y-4">
            <button
              onClick={() => {
                setUpdateFormData({...userData});
                setShowUpdateModal(true);
              }}
              className={`w-full bg-gradient-to-r ${theme.buttonPrimary} text-white font-semibold py-3 rounded-lg transition`}
            >
              Update Profile
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Section 3: Logout */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Danger Zone</h2>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white font-semibold py-3 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Section 4: Account Deactivation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mt-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Management</h2>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ <strong>Deactivate Account:</strong> Your account will be hidden but can be reactivated later. Your data will be preserved.
            </p>
          </div>

          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to deactivate your account? You can reactivate it later by logging in.')) {
                try {
                  await userService.deactivateAccount();
                  alert('Account deactivated successfully. Logging out...');
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                  navigate('/login');
                } catch (error) {
                  console.error('Error deactivating account:', error);
                  alert('Failed to deactivate account. Please try again.');
                }
              }
            }}
            className="w-full bg-yellow-500 text-white font-semibold py-3 rounded-lg hover:bg-yellow-600 transition"
          >
            Deactivate Account
          </button>
        </div>
      </div>

      {/* Update Profile Modal - Dynamic based on role */}
      {showUpdateModal && updateFormData && (
        <UpdateProfileModal
          userRole={userRole}
          updateFormData={updateFormData}
          setUpdateFormData={setUpdateFormData}
          handleUpdateProfile={handleUpdateProfile}
          handleAvatarChange={handleAvatarChange}
          handleDistrictToggle={handleDistrictToggle}
          districts={districts}
          isUpdating={isUpdating}
          error={error}
          theme={theme}
          onClose={() => !isUpdating && setShowUpdateModal(false)}
        />
      )}

      {/* Change Password Modal - Same for both roles */}
      {showPasswordModal && (
        <ChangePasswordModal
          passwordData={passwordData}
          setPasswordData={setPasswordData}
          handleChangePassword={handleChangePassword}
          isUpdating={isUpdating}
          onClose={() => !isUpdating && setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}

// Helper Component for Profile Fields
function ProfileField({ label, value }) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 pb-3">
      <span className="font-semibold text-gray-700 dark:text-gray-300 w-48">{label}:</span>
      <span className="text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

// Update Profile Modal Component
function UpdateProfileModal({
  userRole,
  updateFormData,
  setUpdateFormData,
  handleUpdateProfile,
  handleAvatarChange,
  handleDistrictToggle,
  districts,
  isUpdating,
  error,
  theme,
  onClose
}) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Update Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            type="button"
            disabled={isUpdating}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Avatar - Common */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              {updateFormData.avatarFile ? (
                <img
                  src={URL.createObjectURL(updateFormData.avatarFile)}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (updateFormData.avatar || updateFormData.avatarUrl) ? (
                <img
                  src={updateFormData.avatar || updateFormData.avatarUrl}
                  alt="Current"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${theme.avatarGradient} flex items-center justify-center text-white text-2xl font-bold`}>
                  {updateFormData.name?.split(' ').map(n => n[0]).join('') || '?'}
                </div>
              )}
              <input
                type="file"
                onChange={handleAvatarChange}
                accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
                className="text-sm text-gray-700 dark:text-gray-300"
                disabled={isUpdating}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG, GIF, WEBP, BMP, SVG up to 10MB</p>
          </div>

          {/* Name - Common */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              required
              value={updateFormData.name || ''}
              onChange={(e) => setUpdateFormData({...updateFormData, name: e.target.value})}
              className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${theme.ring} focus:border-transparent`}
              disabled={isUpdating}
            />
          </div>

          {/* Phone - Common */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={updateFormData.phone || ''}
              onChange={(e) => setUpdateFormData({...updateFormData, phone: e.target.value})}
              className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${theme.ring} focus:border-transparent`}
              placeholder="0901234567"
              disabled={isUpdating}
            />
          </div>

          {/* Tenant-specific fields */}
          {userRole === 'TENANT' && (
            <>
              {/* Age and Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age</label>
                  <input
                    type="number"
                    value={updateFormData.age || ''}
                    onChange={(e) => setUpdateFormData({...updateFormData, age: parseInt(e.target.value)})}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${theme.ring} focus:border-transparent`}
                    min="18"
                    max="100"
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                  <select
                    value={updateFormData.gender || ''}
                    onChange={(e) => setUpdateFormData({...updateFormData, gender: e.target.value})}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${theme.ring} focus:border-transparent`}
                    disabled={isUpdating}
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Description - Common */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea
              value={updateFormData.description || ''}
              onChange={(e) => setUpdateFormData({...updateFormData, description: e.target.value})}
              rows={userRole === 'TENANT' ? '3' : '4'}
              maxLength="500"
              className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${theme.ring} focus:border-transparent resize-none`}
              placeholder={userRole === 'TENANT' ? 'Tell us about yourself...' : 'Tell tenants about your properties...'}
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(updateFormData.description || '').length}/500</p>
          </div>

          {/* Tenant-specific: Roommate Preferences */}
          {userRole === 'TENANT' && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Roommate Preferences</h4>
              </div>

              {/* Budget and Stay Length */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget per Month (VND)</label>
                  <input
                    type="number"
                    value={updateFormData.budgetPerMonth || ''}
                    onChange={(e) => setUpdateFormData({...updateFormData, budgetPerMonth: parseFloat(e.target.value)})}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${theme.ring} focus:border-transparent`}
                    min="0"
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stay Length (months)</label>
                  <input
                    type="number"
                    value={updateFormData.stayLength || ''}
                    onChange={(e) => setUpdateFormData({...updateFormData, stayLength: parseInt(e.target.value)})}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${theme.ring} focus:border-transparent`}
                    min="1"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Move-in Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Move-in Date</label>
                <input
                  type="date"
                  value={updateFormData.moveInDate || ''}
                  onChange={(e) => setUpdateFormData({...updateFormData, moveInDate: e.target.value})}
                  className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 ${theme.ring} focus:border-transparent`}
                  disabled={isUpdating}
                />
              </div>

              {/* Lifestyle */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                  <input
                    type="checkbox"
                    checked={updateFormData.smoking || false}
                    onChange={(e) => setUpdateFormData({...updateFormData, smoking: e.target.checked})}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    disabled={isUpdating}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">I smoke</span>
                </label>
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                  <input
                    type="checkbox"
                    checked={updateFormData.cooking || false}
                    onChange={(e) => setUpdateFormData({...updateFormData, cooking: e.target.checked})}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    disabled={isUpdating}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">I cook</span>
                </label>
              </div>

              {/* Preferred Districts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preferred Districts</label>
                <div className="max-h-48 overflow-y-auto p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="grid grid-cols-2 gap-2">
                    {districts.map(district => (
                      <label
                        key={district}
                        className={`flex items-center px-3 py-2 border-2 rounded-lg cursor-pointer transition ${
                          updateFormData.preferredLocations?.includes(district)
                            ? 'border-teal-500 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 bg-white dark:bg-gray-800'
                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={updateFormData.preferredLocations?.includes(district) || false}
                          onChange={() => !isUpdating && handleDistrictToggle(district)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                          disabled={isUpdating}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{district}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Room Requirements */}
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                  <input
                    type="checkbox"
                    checked={updateFormData.needWindow || false}
                    onChange={(e) => setUpdateFormData({...updateFormData, needWindow: e.target.checked})}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    disabled={isUpdating}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Need window/balcony</span>
                </label>
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                  <input
                    type="checkbox"
                    checked={updateFormData.mightShareBedRoom || false}
                    onChange={(e) => setUpdateFormData({...updateFormData, mightShareBedRoom: e.target.checked})}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    disabled={isUpdating}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Willing to share bedroom</span>
                </label>
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                  <input
                    type="checkbox"
                    checked={updateFormData.mightShareToilet || false}
                    onChange={(e) => setUpdateFormData({...updateFormData, mightShareToilet: e.target.checked})}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    disabled={isUpdating}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Willing to share toilet</span>
                </label>
              </div>
            </>
          )}

          {/* Landlord-specific info notice */}
          {userRole === 'LANDLORD' && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                📊 <strong>Property Statistics:</strong> Your property stats are automatically updated based on your room listings.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUpdating}
            className={`w-full bg-gradient-to-r ${theme.buttonPrimary} text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUpdating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Change Password Modal Component
function ChangePasswordModal({ passwordData, setPasswordData, handleChangePassword, isUpdating, onClose }) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            type="button"
            disabled={isUpdating}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password *</label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isUpdating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password *</label>
            <input
              type="password"
              required
              minLength="8"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 8 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password *</label>
            <input
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isUpdating}
            />
          </div>
          <button
            type="submit"
            disabled={isUpdating}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AccountPage;