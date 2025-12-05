// FE/src/components/tenant/AICompatibilityDialog.jsx

import React, { useState } from 'react';
import { X } from 'lucide-react';

function AICompatibilityDialog({
  isOpen,
  onClose,
  questions,
  onSubmitAnswers,
  isLoading,
}) {
  const [answers, setAnswers] = useState({});

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const handleSubmit = () => {
    // Validate all questions are answered
    const allAnswered = questions.every((_, index) => answers[index]?.trim());

    if (!allAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    // Convert to array format
    const answersArray = questions.map((_, index) => answers[index]);
    onSubmitAnswers(answersArray);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">🤖 AI Compatibility Check</h2>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-1 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-gray-600 mb-6">
              Answer these questions to determine your compatibility with this potential
              roommate.
            </p>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Question {index + 1}:
                  </label>
                  <p className="text-gray-700 mb-3">{question}</p>
                  <textarea
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Your answer..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:bg-gray-400"
            >
              {isLoading ? 'Analyzing...' : 'Submit Answers'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AICompatibilityDialog;