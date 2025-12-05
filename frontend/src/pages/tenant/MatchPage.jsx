import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageSquare, ArrowLeft } from 'lucide-react';

function MatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Get match data from navigation state
  const matchData = location.state || {};
  const { conversationId, tenantA, tenantB, compatibility } = matchData;

  // Add at top of component
  if (!matchData || !tenantA || !tenantB) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Match data not found</p>
          <button
            onClick={() => navigate('/dashboard/tenant/find-roommates')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg"
          >
            Back to Swiping
          </button>
        </div>
      </div>
    );
  }

  const handleStartChat = () => {
    if (conversationId) {
      navigate('/dashboard/messages', { 
        state: { 
          conversationId: conversationId,
          recipientName: tenantB?.name 
        } 
      });
    } else {
      alert('Conversation not available. Please try again later.');
    }
  };

  const ProfileCard = ({ tenant, position }) => {
    if (!tenant) return null;

    return (
      <div className={`bg-white rounded-3xl p-6 shadow-2xl transform transition hover:scale-105 ${
        position === 'left' ? 'lg:translate-x-4' : 'lg:-translate-x-4'
      }`}>
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src={tenant.avatar || `https://ui-avatars.com/api/?name=${tenant.name}`}
              alt={tenant.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => { 
                e.target.src = `https://ui-avatars.com/api/?name=${tenant.name}`; 
              }}
            />
            {tenant.budget && (
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full px-3 py-1 shadow-lg font-semibold text-sm">
                {tenant.budget}/mo
              </div>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{tenant.name}</h2>

        {tenant.description && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-4 border border-purple-100">
            <p className="text-sm text-gray-700 leading-relaxed text-center">
              {tenant.description}
            </p>
          </div>
        )}

        <div className="space-y-2 text-sm">
          {tenant.moveInDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-semibold text-gray-700">📅 Move-in:</span>
              <span>{tenant.moveInDate}</span>
            </div>
          )}
          {tenant.locations && tenant.locations.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="font-semibold text-gray-700">📍 Locations:</span>
              {tenant.locations.map((loc, idx) => (
                <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                  {loc}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-6xl w-full py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition bg-white px-4 py-2 rounded-lg shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="animate-ping absolute w-32 h-32 rounded-full bg-pink-400 opacity-20"></div>
            <div className="animate-pulse absolute w-48 h-48 rounded-full bg-purple-400 opacity-10"></div>
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ProfileCard tenant={tenantA} position="left" />
            <ProfileCard tenant={tenantB} position="right" />
          </div>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white rounded-3xl px-8 py-6 shadow-2xl transform rotate-[-5deg] animate-bounce">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8" fill="currentColor" />
                <div className="text-center">
                  <h3 className="text-3xl font-black tracking-tight">It's a Match!</h3>
                  {compatibility && (
                    <p className="text-pink-100 text-sm mt-1">{compatibility}% Compatible</p>
                  )}
                </div>
                <Heart className="w-8 h-8" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl mt-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">What's Next?</h3>
            <p className="text-gray-600">Start a conversation or continue exploring</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => navigate('/dashboard/tenant/find-roommates')}
              className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold py-4 rounded-2xl hover:from-gray-200 hover:to-gray-300 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Keep Swiping</span>
            </button>

            <button
              onClick={handleStartChat}
              disabled={!conversationId}
              className="flex-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white font-semibold py-4 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Start Chatting</span>
            </button>
          </div>

          {/* Match Stats */}
          {(compatibility || (tenantA && tenantB)) && (
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl mx-auto">
              {compatibility && (
                <div className="text-center bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100">
                  <div className="text-2xl font-bold text-pink-600">{compatibility}%</div>
                  <div className="text-xs text-gray-600 mt-1">Compatibility</div>
                </div>
              )}
              {tenantA?.locations && tenantB?.locations && (
                <div className="text-center bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">
                    {tenantA.locations.filter(loc => tenantB.locations.includes(loc)).length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Shared Locations</div>
                </div>
              )}
              {tenantA?.budget && tenantB?.budget && (
                <div className="text-center bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.abs(tenantA.budget - tenantB.budget)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Budget Difference</div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
            <p className="text-sm text-gray-700 text-center">
              💡 <strong>Pro Tip:</strong> Start by discussing your move-in timeline and preferred locations!
            </p>
          </div>
        </div>

        {/* Confetti */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-pink-400 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  );
}

export default MatchPage;