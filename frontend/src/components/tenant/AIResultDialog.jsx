// FE/src/components/tenant/AIResultDialog.jsx

import React from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

function AIResultDialog({ isOpen, onClose, result, onAccept, onReject }) {
  if (!isOpen || !result) return null;

  const { score, reason } = result;

  // Determine score category
  const getScoreCategory = (score) => {
    if (score >= 70) return { label: 'High', color: 'green', icon: CheckCircle };
    if (score >= 50) return { label: 'Medium', color: 'yellow', icon: AlertCircle };
    return { label: 'Low', color: 'red', icon: XCircle };
  };

  const category = getScoreCategory(score);
  const Icon = category.icon;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          {/* Header */}
          <div
            className={`bg-gradient-to-r ${
              category.color === 'green'
                ? 'from-green-500 to-green-600'
                : category.color === 'yellow'
                ? 'from-yellow-500 to-yellow-600'
                : 'from-red-500 to-red-600'
            } text-white px-6 py-4 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Compatibility Score</h2>
                <p className="text-sm opacity-90">{category.label} Match</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-1 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Score */}
          <div className="p-6 text-center border-b">
            <div className="text-6xl font-bold text-gray-800 mb-2">{score}</div>
            <div className="text-gray-600">out of 100</div>
          </div>

          {/* Reason */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Analysis:</h3>
            <ul className="space-y-2">
              {reason.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
            <button
              onClick={onReject}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              ← Swipe Left (Reject)
            </button>
            <button
              onClick={onAccept}
              className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
            >
              Swipe Right (Accept) →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AIResultDialog;