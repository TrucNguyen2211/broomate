// FE/src/pages/tenant/FindRoommatesPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { X, Heart, Loader, MapPin, DollarSign, Calendar, ChevronLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import aiService from '../../services/aiService';
import aiSessionManager from '../../utils/aiSessionManager';
import AICompatibilityDialog from '../../components/tenant/AICompatibilityDialog';
import AIResultDialog from '../../components/tenant/AIResultDialog';

// ✅ Match Modal Component (unchanged)
function MatchModal({ profile, onClose }) {
  const navigate = useNavigate();

  const handleOpenChat = () => {
    if (profile.conversationId) {
      navigate('/dashboard/messages', {
        state: {
          conversationId: profile.conversationId,
          recipientName: profile.name,
          recipientAvatar: profile.avatar
        }
      });
      onClose();
    } else {
      alert('Conversation not ready yet. Please try again in a moment.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="animate-bounce text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">It's a Match!</h2>
          <p className="text-gray-600">You and {profile.name} liked each other</p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}`}
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <div>
              <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
              <p className="text-sm text-gray-600">
                {profile.age && `${profile.age} years old`}
              </p>
            </div>
          </div>
          
          {profile.description && (
            <p className="text-sm text-gray-700 line-clamp-3">{profile.description}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
          >
            Keep Swiping
          </button>
          <button
            onClick={handleOpenChat}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition shadow-lg"
          >
            💬 Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Main Component with AI Integration
const FindRoommatesPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState('Fetching roommate profiles...');
  
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  
  const [swipeCount, setSwipeCount] = useState(0);
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);

  // ✅ NEW: AI State
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showAIResultDialog, setShowAIResultDialog] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);

  const currentProfile = profiles[currentIndex];
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setMessage('Fetching roommate profiles...');

    try {
      const data = await tenantService.getProfiles();

      if (!data.tenants || data.tenants.length === 0) {
        setMessage('No more roommates available right now. Check back later! 🔄');
        setProfiles([]);
      } else {
        setProfiles(data.tenants);
        setCurrentIndex(0);
        setMessage('');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setIsError(true);
      setMessage('Unable to load profiles. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // ✅ NEW: Handle AI Compatibility Check
  const handleCheckCompatibility = async () => {
    if (!currentProfile) return;

    // Check cache first
    const cachedResult = aiSessionManager.loadResult(currentProfile.id);

    if (cachedResult) {
      console.log('✅ Using cached AI result');
      setAiResult(cachedResult);
      setShowAIResultDialog(true);
      return;
    }

    // No cache - Start AI flow
    try {
      setIsAILoading(true);

      // Step 1: Generate questions
      const questionsResponse = await aiService.generateQuestions(
        {
          name: user.name || 'User',
          age: user.age,
          gender: user.gender,
          smoking: user.smoking,
          cooking: user.cooking,
          budgetPerMonth: user.budgetPerMonth,
          stayLength: user.stayLength,
          moveInDate: user.moveInDate,
          preferredLocations: user.preferredLocations || [],
          description: user.description || ''
        },
        {
          name: currentProfile.name,
          age: currentProfile.age,
          gender: currentProfile.gender,
          smoking: currentProfile.smoking,
          cooking: currentProfile.cooking,
          budgetPerMonth: currentProfile.budgetPerMonth,
          stayLength: currentProfile.stayLength,
          moveInDate: currentProfile.moveInDate,
          preferredLocations: currentProfile.preferredLocations || [],
          description: currentProfile.description || ''
        }
      );

      setAiQuestions(questionsResponse.Question);
      setShowAIDialog(true);
    } catch (error) {
      console.error('❌ Failed to generate AI questions:', error);
      alert('AI service is unavailable. You can still swipe manually or try again later.');
    } finally {
      setIsAILoading(false);
    }
  };

  // ✅ NEW: Handle Answer Submission
  const handleSubmitAnswers = async (answers) => {
    try {
      setIsAILoading(true);

      // Format Q&A history
      const historyString = aiQuestions
        .map((q, i) => `\n[Q${i + 1}]: ${q}\n[A${i + 1}]: ${answers[i]}`)
        .join('');

      // Step 2: Get compatibility score
      const scoreResponse = await aiService.scoreCompatibility(
        {
          name: user.name || 'User',
          age: user.age,
          gender: user.gender,
          smoking: user.smoking,
          cooking: user.cooking,
          budgetPerMonth: user.budgetPerMonth,
          stayLength: user.stayLength,
          moveInDate: user.moveInDate,
          preferredLocations: user.preferredLocations || [],
          description: user.description || ''
        },
        {
          name: currentProfile.name,
          age: currentProfile.age,
          gender: currentProfile.gender,
          smoking: currentProfile.smoking,
          cooking: currentProfile.cooking,
          budgetPerMonth: currentProfile.budgetPerMonth,
          stayLength: currentProfile.stayLength,
          moveInDate: currentProfile.moveInDate,
          preferredLocations: currentProfile.preferredLocations || [],
          description: currentProfile.description || ''
        },
        historyString
      );

      // Save to sessionStorage
      aiSessionManager.saveResult(currentProfile.id, {
        score: scoreResponse.Score,
        reason: scoreResponse.ReasonBulletPoints,
        questions: aiQuestions,
        answers,
      });

      setAiResult({
        score: scoreResponse.Score,
        reason: scoreResponse.ReasonBulletPoints
      });
      setShowAIDialog(false);
      setShowAIResultDialog(true);
    } catch (error) {
      console.error('❌ Failed to get compatibility score:', error);
      alert('Failed to calculate compatibility. Please try again.');
    } finally {
      setIsAILoading(false);
    }
  };

  // ✅ UPDATED: Handle Swipe with AI Result Dialog Actions
  const handleSwipe = async (action) => {
    if (isSwipeInProgress || currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];

    if (!profile || !profile.id) {
      console.error('Invalid profile:', profile);
      alert('Unable to process swipe. Profile data is missing.');
      setCurrentIndex(prev => prev + 1);
      return;
    }

    console.log('Swiping on profile:', {
      userId: profile.id,
      name: profile.name,
      action: action
    });
    
    setIsSwipeInProgress(true);
    setSwipeCount(prev => prev + 1);

    try {
      const response = await tenantService.swipe(profile.id, action);
      
      console.log('Swipe response:', response);

      // Clear AI cache for this tenant
      aiSessionManager.clearResult(profile.id);

      // Check if it's a match
      if (response.isMatch && response.matchDetail) {
        console.log('🎉 MATCH DETAILS:', response.matchDetail);
        setMatchedProfile({
          ...profile,
          matchId: response.matchDetail.matchId,
          conversationId: response.matchDetail.conversationId,
          matchedAt: response.matchDetail.matchedAt
        });
        setShowMatchModal(true);
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);
      
      // Close AI result dialog if open
      setShowAIResultDialog(false);
    } catch (error) {
      console.error('Error swiping:', error);
      alert('Failed to record swipe. Please try again.');
    } finally {
      setIsSwipeInProgress(false);
    }
  };

  const handleCloseMatch = () => {
    setShowMatchModal(false);
    setMatchedProfile(null);
  };

  // Loading state
  if (isLoading && profiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/tenant')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Find Roommates</h1>
          <p className="text-gray-600">Swipe right to connect with potential roommates</p>
          {swipeCount > 0 && (
            <p className="text-sm text-purple-600 mt-2">
              You've swiped on {swipeCount} profile{swipeCount !== 1 ? 's' : ''} today
            </p>
          )}
          {profiles.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {profiles.length - currentIndex} profile{profiles.length - currentIndex !== 1 ? 's' : ''} remaining
            </p>
          )}
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-center font-medium ${
            isError ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {message}
            {isError && (
              <button
                onClick={fetchProfiles}
                className="block mx-auto mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Profile Card */}
        {currentProfile ? (
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Swipe Progress Overlay */}
            {isSwipeInProgress && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-10">
                <Loader className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Processing...</p>
              </div>
            )}

            {/* Profile Content */}
            <div className="p-6 md:p-8">
              {/* Avatar and Name Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <img
                    src={currentProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentProfile.name)}&size=160&background=A78BFA&color=fff`}
                    alt={currentProfile.name}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-purple-200 shadow-lg"
                    onError={(e) => { 
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentProfile.name)}&size=160&background=A78BFA&color=fff`;
                    }}
                  />
                  {currentProfile.isActive !== undefined && (
                    <div className={`absolute -bottom-2 -right-2 ${currentProfile.isActive ? 'bg-green-500' : 'bg-gray-400'} text-white rounded-full px-3 py-1 shadow-lg font-semibold text-xs`}>
                      {currentProfile.isActive ? 'Active' : 'Inactive'}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{currentProfile.name}</h2>
                {currentProfile.email && (
                  <p className="text-sm text-gray-500">{currentProfile.email}</p>
                )}
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {currentProfile.budgetPerMonth && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-gray-600 font-medium">Budget</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {currentProfile.budgetPerMonth.toLocaleString()} VND/mo
                    </p>
                  </div>
                )}
                {currentProfile.stayLength && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600 font-medium">Stay Length</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{currentProfile.stayLength} months</p>
                  </div>
                )}
              </div>

              {/* Move-in Date */}
              {currentProfile.moveInDate && (
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 mb-6 border border-teal-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Move-in Date</span>
                    <span className="text-base font-bold text-gray-900">{currentProfile.moveInDate}</span>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {currentProfile.phone && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">📞 Phone</span>
                    <span className="text-base font-semibold text-gray-900">{currentProfile.phone}</span>
                  </div>
                </div>
              )}

              {/* Preferred Locations */}
              {currentProfile.preferredLocations && currentProfile.preferredLocations.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Preferred Locations</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.preferredLocations.map((loc, index) => (
                      <span key={index} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium border border-purple-200">
                        📍 {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio Section */}
              {currentProfile.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>✨</span>
                    About Me
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{currentProfile.description}</p>
                  </div>
                </div>
              )}

              {/* ✅ NEW: AI Compatibility Button */}
              <div className="mb-4">
                <button
                  onClick={handleCheckCompatibility}
                  disabled={isAILoading || isSwipeInProgress}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold py-4 rounded-2xl hover:from-teal-600 hover:to-cyan-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-6 h-6" />
                  <span>{isAILoading ? 'Loading AI...' : '🤖 Check Compatibility with AI'}</span>
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Answer 5 quick questions to see your compatibility score
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center pt-4">
                <button
                  onClick={() => handleSwipe('REJECT')}
                  disabled={isSwipeInProgress}
                  className="flex-1 max-w-[160px] bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold py-4 rounded-2xl hover:from-gray-200 hover:to-gray-300 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  <X className="w-6 h-6" />
                  <span>Pass</span>
                </button>

                <button
                  onClick={() => handleSwipe('ACCEPT')}
                  disabled={isSwipeInProgress}
                  className="flex-1 max-w-[160px] bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-4 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  <Heart className="w-6 h-6" fill="currentColor" />
                  <span>Like</span>
                </button>
              </div>
            </div>
          </div>
        ) : !isLoading && !isError && (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="text-6xl mb-4">😊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h3>
            <p className="text-gray-600 mb-6">
              You've seen all available profiles. New profiles are added daily!
            </p>
            <button
              onClick={fetchProfiles}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition"
            >
              Refresh Profiles
            </button>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 Tip: Use AI to check compatibility before swiping</p>
          <p className="mt-1">🔒 Your preferences are private until you match</p>
        </div>
      </div>

      {/* ✅ Match Modal */}
      {showMatchModal && matchedProfile && (
        <MatchModal
          profile={matchedProfile}
          onClose={handleCloseMatch}
        />
      )}

      {/* ✅ NEW: AI Dialogs */}
      <AICompatibilityDialog
        isOpen={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        questions={aiQuestions}
        onSubmitAnswers={handleSubmitAnswers}
        isLoading={isAILoading}
      />

      <AIResultDialog
        isOpen={showAIResultDialog}
        onClose={() => setShowAIResultDialog(false)}
        result={aiResult}
        onAccept={() => handleSwipe('ACCEPT')}
        onReject={() => handleSwipe('REJECT')}
      />
    </div>
  );
};

export default FindRoommatesPage;