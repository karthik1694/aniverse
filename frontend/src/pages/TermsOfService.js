import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
        <p className="text-gray-400 text-center mb-12">Last Updated: December 1, 2025</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using otakucafe.fun ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p className="leading-relaxed mb-4">
              Permission is granted to temporarily access the Service for personal, non-commercial use only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. User Conduct</h2>
            <p className="leading-relaxed mb-4">
              You agree to use the Service only for lawful purposes. You are prohibited from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting or transmitting any unlawful, threatening, abusive, defamatory, obscene, or otherwise objectionable content</li>
              <li>Impersonating any person or entity</li>
              <li>Violating any applicable local, state, national or international law</li>
              <li>Harassing, stalking, or harming another individual</li>
              <li>Transmitting spam, chain letters, or other unsolicited email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Age Restrictions</h2>
            <p className="leading-relaxed">
              You must be at least 13 years old to use this Service. By using the Service, you represent and warrant that you meet this age requirement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Account Termination</h2>
            <p className="leading-relaxed">
              We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Disclaimer</h2>
            <p className="leading-relaxed">
              The Service is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
            <p className="leading-relaxed">
              In no event shall otakucafe.fun or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any changes by updating the "Last Updated" date. Your continued use of the Service after any modifications indicates your acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Contact Information</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms, please contact us at support@otakucafe.fun
            </p>
          </section>
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
