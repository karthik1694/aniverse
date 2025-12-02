import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, DollarSign } from 'lucide-react';

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] to-[#16213e] text-white">
      {/* Header */}
      <div className="border-b border-cyan-500/10 bg-[#0a0e1a]/95 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-cyan-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <DollarSign className="h-10 w-10 text-cyan-400" />
          <h1 className="text-4xl font-bold text-center">Refund Policy</h1>
        </div>
        <p className="text-gray-400 text-center mb-12">Last Updated: December 1, 2025</p>

        <div className="space-y-8 text-gray-300">
          <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl">
            <p className="text-lg leading-relaxed">
              otakucafe.fun is currently <strong className="text-green-400">FREE</strong> to use! We don't charge any fees for our core features including matching, chatting, and making friends.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Free Services</h2>
            <p className="leading-relaxed mb-4">
              All basic features of otakucafe.fun are provided free of charge, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account creation and profile setup</li>
              <li>Interest-based matching with other anime fans</li>
              <li>Text chat and messaging</li>
              <li>Friend system and connections</li>
              <li>Basic profile customization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Premium Features (Future)</h2>
            <p className="leading-relaxed mb-4">
              We may introduce optional premium features in the future. If we do:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All current free features will remain free</li>
              <li>Premium features will be clearly labeled</li>
              <li>Pricing will be transparent and disclosed before purchase</li>
              <li>Users will have the choice to upgrade or continue using free features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Refund Eligibility (If Premium Features are Introduced)</h2>
            <p className="leading-relaxed mb-4">
              Should we introduce paid features in the future, refunds may be available under the following conditions:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Request made within 7 days of purchase</li>
              <li>Technical issues preventing use of the service</li>
              <li>Accidental or unauthorized charges</li>
              <li>Service not functioning as described</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Non-Refundable Circumstances</h2>
            <p className="leading-relaxed mb-4">
              The following would not be eligible for refunds:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Change of mind after using the service</li>
              <li>Violation of Terms of Service leading to account suspension</li>
              <li>Partially used subscription periods (prorated refunds may apply)</li>
              <li>Third-party purchases not made through our official channels</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Refund Process</h2>
            <p className="leading-relaxed mb-4">
              If premium features are available and you need a refund:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Contact our support team at support@otakucafe.fun</li>
              <li>Provide your account email and transaction details</li>
              <li>Explain the reason for your refund request</li>
              <li>We will review and respond within 3-5 business days</li>
              <li>Approved refunds will be processed to the original payment method within 7-10 business days</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Subscription Cancellation</h2>
            <p className="leading-relaxed">
              If we offer subscriptions in the future, you can cancel at any time. Upon cancellation, you will retain access to premium features until the end of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
            <p className="leading-relaxed">
              For any questions about refunds or billing, please contact us at billing@otakucafe.fun
            </p>
          </section>

          <div className="bg-cyan-500/10 border border-cyan-500/30 p-6 rounded-xl">
            <p className="text-lg leading-relaxed">
              <strong>Remember:</strong> otakucafe.fun is currently completely FREE! We're committed to keeping our core features accessible to all anime fans. 🎌
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
