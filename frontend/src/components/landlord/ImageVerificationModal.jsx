// FE/src/components/landlord/ImageVerificationModal.jsx

import React from 'react';
import { X, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

function ImageVerificationModal({ isOpen, onClose, verificationResults, onProceed }) {
  if (!isOpen) return null;

  const hasRejected = verificationResults.some(r => !r.isOriginal);
  const allPassed = verificationResults.every(r => r.isOriginal);
  const isVerifying = verificationResults.some(r => r.status === 'verifying');

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className={`px-6 py-4 flex items-center justify-between ${
            hasRejected ? 'bg-red-500' : allPassed ? 'bg-green-500' : 'bg-blue-500'
          } text-white`}>
            <div className="flex items-center gap-3">
              {hasRejected ? (
                <AlertTriangle className="w-6 h-6" />
              ) : allPassed ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <Loader className="w-6 h-6 animate-spin" />
              )}
              <h2 className="text-xl font-bold">
                {isVerifying ? 'Verifying Images...' : hasRejected ? 'Verification Failed' : 'All Images Verified'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-1 rounded-full transition"
              disabled={isVerifying}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {verificationResults.map((result, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-xl p-4 ${
                    result.status === 'verifying'
                      ? 'border-blue-200 bg-blue-50'
                      : result.isOriginal
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <img
                      src={URL.createObjectURL(result.file)}
                      alt={result.file.name}
                      className="w-20 h-20 rounded-lg object-cover border-2 border-white shadow"
                    />

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {result.status === 'verifying' ? (
                          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : result.isOriginal ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-semibold text-gray-900 truncate max-w-[300px]">
                          {result.file.name}
                        </span>
                      </div>

                      {result.status === 'verifying' ? (
                        <p className="text-sm text-blue-700">Checking image authenticity...</p>
                      ) : result.isOriginal ? (
                        <p className="text-sm text-green-700">✓ Image appears to be original</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-red-700 font-semibold">
                            ✗ This image cannot be used
                          </p>
                          <p className="text-xs text-red-600">{result.reason}</p>
                          {result.stolen_source && (
                            <p className="text-xs text-gray-600">
                              Source: <a href={result.stolen_source} target="_blank" rel="noopener noreferrer" className="underline">
                                {result.stolen_source.substring(0, 50)}...
                              </a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasRejected && !isVerifying && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Note:</strong> Only verified original images will be uploaded. 
                  Rejected images have been removed from your selection.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {!isVerifying && (
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel Upload
              </button>
              <button
                onClick={onProceed}
                disabled={!allPassed && hasRejected}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {allPassed ? 'Continue' : hasRejected ? 'Remove Rejected & Continue' : 'Proceed'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ImageVerificationModal;