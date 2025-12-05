import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Basic Information
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    avatar: null,
    description: '',
    
    // Tenant-specific fields
    age: '',
    gender: '',
    stayLengthMonths: 6,
    moveInDate: '',
    smoking: false,
    cooking: false,
    budgetPerMonth: '',
    preferredDistricts: [],
    needWindow: false,
    needWashingMachine: false,
    mightShareBedRoom: false,
    mightShareToilet: false
  });

  const districts = [
    'District 1', 'District 2', 'District 3', 'District 4', 'District 5',
    'District 6', 'District 7', 'District 8', 'District 9', 'District 10',
    'Binh Thanh', 'Phu Nhuan', 'Tan Binh', 'Go Vap'
  ];

  const handleDistrictToggle = (district) => {
    setFormData(prev => ({
      ...prev,
      preferredDistricts: prev.preferredDistricts.includes(district)
        ? prev.preferredDistricts.filter(d => d !== district)
        : [...prev.preferredDistricts, district]
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB per requirements)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file type (only accept specific image types)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, PNG, GIF, WEBP, BMP, or SVG)');
        e.target.value = ''; // Clear the input
        return;
      }
      
      setFormData({...formData, avatar: file});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Navigate to step 3 for tenants
    if (step === 2 && role === 'TENANT') {
      setStep(3);
      return;
    }
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData();
      
      // Add basic fields
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('confirmPassword', formData.confirmPassword);
      formDataToSend.append('name', formData.name);
      
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.avatar) formDataToSend.append('avatar', formData.avatar);

      // Add tenant-specific fields
      if (role === 'TENANT') {
        if (formData.age) formDataToSend.append('age', formData.age);
        if (formData.gender) formDataToSend.append('gender', formData.gender);
        if (formData.stayLengthMonths) formDataToSend.append('stayLengthMonths', formData.stayLengthMonths);
        if (formData.moveInDate) formDataToSend.append('moveInDate', formData.moveInDate);
        if (formData.budgetPerMonth) formDataToSend.append('budgetPerMonth', formData.budgetPerMonth);
        
        formDataToSend.append('smoking', formData.smoking);
        formDataToSend.append('cooking', formData.cooking);
        formDataToSend.append('needWindow', formData.needWindow);
        formDataToSend.append('needWashingMachine', formData.needWashingMachine);
        formDataToSend.append('mightShareBedRoom', formData.mightShareBedRoom);
        formDataToSend.append('mightShareToilet', formData.mightShareToilet);
        
        // Add preferredDistricts array
        if (formData.preferredDistricts && formData.preferredDistricts.length > 0) {
          formData.preferredDistricts.forEach(district => {
            formDataToSend.append('preferredDistricts', district);
          });
        }
      }

      // ✅ Use authService instead of direct fetch
      const data = role === 'TENANT' 
        ? await authService.signupTenant(formDataToSend)
        : await authService.signupLandlord(formDataToSend);

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
        avatarUrl: data.avatarUrl
      }));

      // Show success message
      alert('Account created successfully! Redirecting to dashboard...');

      // Redirect based on role
      if (data.role === 'TENANT') {
        navigate('/dashboard/tenant');
      } else if (data.role === 'LANDLORD') {
        navigate('/dashboard/landlord');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== STEP 1: ROLE SELECTION ====================
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-400 to-teal-400 rounded-full mb-4">
              <span className="text-2xl">🏠</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Join Broomate</h1>
            <p className="text-gray-600 mt-2">Choose how you want to use Broomate</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Tenant Card */}
            <button
              onClick={() => {
                setRole('TENANT');
                setStep(2);
                setError('');
              }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all border-2 border-transparent hover:border-pink-400 text-left"
            >
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">As Tenant</h3>
              <p className="text-gray-600 mb-4">
                I'm looking for a place to stay and want to find compatible roommates
              </p>
              <div className="flex items-center text-pink-600 font-semibold">
                Get Started <span className="ml-2">→</span>
              </div>
            </button>

            {/* Landlord Card */}
            <button
              onClick={() => {
                setRole('LANDLORD');
                setStep(2);
                setError('');
              }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all border-2 border-transparent hover:border-teal-400 text-left"
            >
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🏠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">As Landlord</h3>
              <p className="text-gray-600 mb-4">
                I have rooms to rent out and want to find quality tenants
              </p>
              <div className="flex items-center text-teal-600 font-semibold">
                Get Started <span className="ml-2">→</span>
              </div>
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 2: BASIC INFORMATION ====================
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-teal-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step 2 of {role === 'TENANT' ? '3' : '2'}</span>
              <span className="text-sm text-gray-500">Basic Information</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-400 to-teal-400 h-2 rounded-full transition-all"
                style={{width: role === 'TENANT' ? '66%' : '100%'}}
              ></div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Account</h2>
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="0901234567"
                  disabled={isLoading}
                />
              </div>

              {/* Age and Gender (for Tenants only) */}
              {role === 'TENANT' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="25"
                      min="18"
                      max="100"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      disabled={isLoading}
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="At least 8 characters"
                  minLength="8"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Re-enter your password"
                  disabled={isLoading}
                />
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo (Optional)</label>
                <div className="flex items-center gap-4">
                  {formData.avatar && (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src={URL.createObjectURL(formData.avatar)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
                    onChange={handleAvatarChange}
                    disabled={isLoading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WEBP, BMP, SVG up to 10MB</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About You (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  maxLength="500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="Tell us a bit about yourself..."
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold py-3 rounded-lg hover:from-teal-600 hover:to-teal-700 transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    role === 'TENANT' ? 'Continue' : 'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 3: TENANT PREFERENCES ====================
  if (step === 3 && role === 'TENANT') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-teal-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step 3 of 3</span>
              <span className="text-sm text-gray-500">Your Preferences</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-pink-400 to-teal-400 h-2 rounded-full" style={{width: '100%'}}></div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Roommate Preferences</h2>
              <p className="text-sm text-gray-500 mt-1">💡 You can change these later in settings</p>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Living Preferences */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Living Preferences</h3>
                
                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget per Month (VND)</label>
                  <input
                    type="number"
                    value={formData.budgetPerMonth}
                    onChange={(e) => setFormData({...formData, budgetPerMonth: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="5000000"
                    min="0"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Example: 5,000,000 VND</p>
                </div>

                {/* Preferred Districts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Districts
                  </label>
                  <div className="max-h-64 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {districts.map(district => (
                        <label
                          key={district}
                          className={`flex items-center px-3 py-2 border-2 rounded-lg cursor-pointer transition ${
                            formData.preferredDistricts.includes(district)
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-pink-300 bg-white'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.preferredDistricts.includes(district)}
                            onChange={() => !isLoading && handleDistrictToggle(district)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                            disabled={isLoading}
                          />
                          <span className="ml-2 text-sm text-gray-700">{district}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.preferredDistricts.length} district{formData.preferredDistricts.length !== 1 ? 's' : ''} selected
                  </p>
                </div>

                {/* Move-in Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Move-in Date</label>
                  <input
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => setFormData({...formData, moveInDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                {/* Stay Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Intended Stay Length</label>
                  <select
                    value={formData.stayLengthMonths}
                    onChange={(e) => setFormData({...formData, stayLengthMonths: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isLoading}
                  >
                    <option value={1}>1 month</option>
                    <option value={3}>3 months</option>
                    <option value={6}>6 months</option>
                    <option value={12}>12 months</option>
                    <option value={24}>24+ months</option>
                  </select>
                </div>
              </div>

              {/* Lifestyle */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Lifestyle</h3>
                
                {/* Smoking */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Do you smoke?</p>
                    <p className="text-sm text-gray-500">This helps match you with compatible roommates</p>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="smoking"
                        checked={formData.smoking === true}
                        onChange={() => setFormData({...formData, smoking: true})}
                        className="w-4 h-4 text-pink-600"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm font-medium">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="smoking"
                        checked={formData.smoking === false}
                        onChange={() => setFormData({...formData, smoking: false})}
                        className="w-4 h-4 text-pink-600"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm font-medium">No</span>
                    </label>
                  </div>
                </div>

                {/* Cooking */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Do you cook?</p>
                    <p className="text-sm text-gray-500">Important for shared kitchen usage</p>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="cooking"
                        checked={formData.cooking === true}
                        onChange={() => setFormData({...formData, cooking: true})}
                        className="w-4 h-4 text-pink-600"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm font-medium">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="cooking"
                        checked={formData.cooking === false}
                        onChange={() => setFormData({...formData, cooking: false})}
                        className="w-4 h-4 text-pink-600"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm font-medium">No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Room Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Room Requirements</h3>
                
                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.needWindow}
                      onChange={(e) => setFormData({...formData, needWindow: e.target.checked})}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      disabled={isLoading}
                    />
                    <span className="ml-3 text-gray-700">Need window/balcony</span>
                  </label>

                  <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.needWashingMachine}
                      onChange={(e) => setFormData({...formData, needWashingMachine: e.target.checked})}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      disabled={isLoading}
                    />
                    <span className="ml-3 text-gray-700">Need washing machine</span>
                  </label>
                </div>

                {/* Sharing Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Sharing Preferences</label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mightShareBedRoom}
                        onChange={(e) => setFormData({...formData, mightShareBedRoom: e.target.checked})}
                        className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        disabled={isLoading}
                      />
                      <span className="ml-3 text-gray-700">Willing to share bedroom</span>
                    </label>

                    <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mightShareToilet}
                        onChange={(e) => setFormData({...formData, mightShareToilet: e.target.checked})}
                        className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        disabled={isLoading}
                      />
                      <span className="ml-3 text-gray-700">Willing to share toilet/bathroom</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-3 border-2 border-pink-300 text-pink-600 font-semibold rounded-lg hover:bg-pink-50 transition"
                  disabled={isLoading}
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-pink-700 transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default SignupPage;