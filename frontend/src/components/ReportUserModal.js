import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import { toast } from 'sonner';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or Advertising', description: 'Unwanted promotional content or spam' },
  { id: 'harassment', label: 'Harassment or Bullying', description: 'Harassment, threats, or bullying behavior' },
  { id: 'inappropriate', label: 'Inappropriate Content', description: 'Sexual, violent, or disturbing content' },
  { id: 'hate_speech', label: 'Hate Speech', description: 'Discriminatory or hateful language' },
  { id: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  { id: 'underage', label: 'Underage User', description: 'User appears to be under 18' },
  { id: 'scam', label: 'Scam or Fraud', description: 'Attempting to scam or defraud users' },
  { id: 'other', label: 'Other', description: 'Another reason not listed here' }
];

export default function ReportUserModal({ isOpen, onClose, reportedUser }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !reportedUser) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    setLoading(true);
    try {
      // Submit report
      await axiosInstance.post('/reports', {
        reported_user_id: reportedUser.id,
        reason: selectedReason,
        additional_details: additionalDetails
      });

      // Block user if requested
      if (blockUser) {
        await axiosInstance.post('/block-user', {
          blocked_user_id: reportedUser.id
        });
        toast.success(`Reported and blocked ${reportedUser.name}`);
      } else {
        toast.success(`Reported ${reportedUser.name}. Thank you for helping keep our community safe.`);
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedReason('');
    setAdditionalDetails('');
    setBlockUser(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <Card className="bg-[#1a2332] border-red-500/30 p-4 sm:p-6 max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-red-500/20 p-1.5 sm:p-2 rounded-lg">
              <Flag className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Report User</h2>
              <p className="text-gray-400 text-xs sm:text-sm">Reporting: {reportedUser.name}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              onClose();
              resetForm();
            }}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Warning Notice */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-yellow-200">
              <p className="font-semibold mb-1">Important Notice</p>
              <p>False reports may result in action being taken against your account. Please only report genuine violations of our Community Guidelines.</p>
            </div>
          </div>
        </div>

        {/* Report Reasons */}
        <div className="mb-4 sm:mb-6">
          <label className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3 block">
            Why are you reporting this user? <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => setSelectedReason(reason.id)}
                className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedReason === reason.id
                    ? 'border-red-500 bg-red-500/20 text-white'
                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-semibold mb-0.5 sm:mb-1 text-sm">{reason.label}</div>
                <div className="text-xs sm:text-sm text-gray-400">{reason.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Details */}
        <div className="mb-4 sm:mb-6">
          <label className="text-xs sm:text-sm font-semibold text-white mb-2 block">
            Additional Details (Optional)
          </label>
          <textarea
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="Provide any additional information that might help us review this report..."
            rows={3}
            className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-500 resize-none text-sm"
            maxLength={500}
          />
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
            {additionalDetails.length}/500 characters
          </p>
        </div>

        {/* Block User Option */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={blockUser}
              onChange={(e) => setBlockUser(e.target.checked)}
              className="mt-0.5 sm:mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="text-white font-semibold mb-0.5 sm:mb-1 text-sm">
                Also block this user
              </div>
              <div className="text-xs sm:text-sm text-gray-400">
                You won't be matched with this user in the future, and they won't be able to send you friend requests.
              </div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={() => {
              onClose();
              resetForm();
            }}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 text-sm py-2 sm:py-2.5"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || loading}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2 sm:py-2.5"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Submitting...
              </div>
            ) : (
              `Submit Report${blockUser ? ' & Block' : ''}`
            )}
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-3 sm:mt-4">
          Our moderation team will review this report within 24 hours. Serious violations may result in immediate action.
        </p>
      </Card>
    </div>
  );
}
