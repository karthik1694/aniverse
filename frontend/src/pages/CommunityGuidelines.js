import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Heart, Shield, Users, AlertTriangle } from 'lucide-react';

export default function CommunityGuidelines() {
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
        <h1 className="text-4xl font-bold mb-8 text-center">Community Guidelines</h1>
        <p className="text-gray-400 text-center mb-12">Creating a safe and welcoming space for all anime fans</p>

        <div className="space-y-8 text-gray-300">
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-6 rounded-xl">
            <p className="text-lg leading-relaxed">
              otakucafe.fun is built on the foundation of connecting anime fans worldwide. To maintain a positive and safe environment for everyone, we ask all members to follow these guidelines.
            </p>
          </div>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-6 w-6 text-pink-400" />
              <h2 className="text-2xl font-bold text-white">Be Respectful</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Treat everyone with kindness and respect</li>
              <li>Respect different opinions about anime and preferences</li>
              <li>Use appropriate language - no hate speech, slurs, or discriminatory remarks</li>
              <li>Be mindful of cultural differences</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Stay Safe</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Do not share personal information (phone numbers, addresses, etc.)</li>
              <li>Report suspicious or inappropriate behavior immediately</li>
              <li>Do not engage in or encourage illegal activities</li>
              <li>Protect your account - do not share your login credentials</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Be a Good Community Member</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Keep conversations appropriate and on-topic</li>
              <li>No spam, advertising, or self-promotion without permission</li>
              <li>Do not impersonate others or create fake accounts</li>
              <li>Help create a welcoming environment for new members</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Prohibited Content</h2>
            </div>
            <p className="leading-relaxed mb-4">
              The following types of content are strictly prohibited:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Explicit sexual content or pornography</li>
              <li>Violence, gore, or disturbing content</li>
              <li>Harassment, bullying, or threats</li>
              <li>Doxxing or sharing others' private information</li>
              <li>Copyright infringement or pirated content links</li>
              <li>Content promoting self-harm or dangerous activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Reporting Violations</h2>
            <p className="leading-relaxed mb-4">
              If you witness or experience any violations of these guidelines:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the "Report" button available in chat and profiles</li>
              <li>Provide as much detail as possible about the violation</li>
              <li>Do not engage with the violator - report and block them</li>
              <li>Contact us at developer.otakucafe@gmail.com for serious concerns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Consequences</h2>
            <p className="leading-relaxed mb-4">
              Violations of these guidelines may result in:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Warning</li>
              <li>Temporary suspension</li>
              <li>Permanent ban from the platform</li>
              <li>Legal action in cases of illegal activity</li>
            </ul>
            <p className="leading-relaxed mt-4">
              The severity of the consequence depends on the nature and frequency of the violation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Updates to Guidelines</h2>
            <p className="leading-relaxed">
              We may update these Community Guidelines as needed. Continued use of the service after changes indicates your acceptance of the updated guidelines.
            </p>
          </section>

          <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-xl">
            <p className="text-lg leading-relaxed">
              Thank you for helping us create a positive community! Together, we can build the best place for anime fans to connect and make friends. 🎌
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
