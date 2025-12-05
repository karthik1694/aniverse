import { ArrowLeft, Mail, MessageSquare, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContactUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f2e] to-[#0f1318] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="bg-[#2b3544] rounded-xl p-6 md:p-8 shadow-xl">
          <h1 className="text-4xl font-bold mb-8 text-center text-white">Contact Us</h1>
          <p className="text-gray-300 mb-8 text-center">
            Have questions, feedback, or need assistance? We're here to help!
          </p>

          <div className="space-y-8">
            {/* Contact Methods */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* General Support */}
                <div className="bg-[#1a1f2e] rounded-lg p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-cyan-500/20 p-2 rounded-lg">
                      <Mail className="h-5 w-5 text-cyan-400" />
                    </div>
                    <h3 className="font-semibold text-white">General Support</h3>
                  </div>
                  <a 
                    href="mailto:support@otakucafe.fun" 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    support@otakucafe.fun
                  </a>
                  <p className="text-gray-400 text-sm mt-2">For general inquiries and help</p>
                </div>

                {/* Billing */}
                <div className="bg-[#1a1f2e] rounded-lg p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="font-semibold text-white">Billing & Refunds</h3>
                  </div>
                  <a 
                    href="mailto:billing@otakucafe.fun" 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    billing@otakucafe.fun
                  </a>
                  <p className="text-gray-400 text-sm mt-2">For payment and subscription issues</p>
                </div>

                {/* Privacy */}
                <div className="bg-[#1a1f2e] rounded-lg p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Mail className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white">Privacy Concerns</h3>
                  </div>
                  <a 
                    href="mailto:privacy@otakucafe.fun" 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    privacy@otakucafe.fun
                  </a>
                  <p className="text-gray-400 text-sm mt-2">For data and privacy requests</p>
                </div>

                {/* Moderation */}
                <div className="bg-[#1a1f2e] rounded-lg p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-red-500/20 p-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-red-400" />
                    </div>
                    <h3 className="font-semibold text-white">Report Issues</h3>
                  </div>
                  <a 
                    href="mailto:moderation@otakucafe.fun" 
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    moderation@otakucafe.fun
                  </a>
                  <p className="text-gray-400 text-sm mt-2">For reporting violations or concerns</p>
                </div>
              </div>
            </section>

            {/* Response Time */}
            <section className="bg-[#1a1f2e] rounded-lg p-5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <h3 className="font-semibold text-white">Response Time</h3>
              </div>
              <p className="text-gray-300">
                We aim to respond to all inquiries within <span className="text-cyan-400 font-semibold">24-48 hours</span> during business days.
                For urgent matters, please include "URGENT" in your email subject line.
              </p>
            </section>

            {/* Additional Info */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Additional Resources</h2>
              <div className="space-y-3">
                <a 
                  href="/guidelines" 
                  className="block text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  → Community Guidelines
                </a>
                <a 
                  href="/privacy" 
                  className="block text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  → Privacy Policy
                </a>
                <a 
                  href="/terms" 
                  className="block text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  → Terms of Service
                </a>
                <a 
                  href="/refund" 
                  className="block text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  → Refund Policy
                </a>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-gray-400 text-sm">
            Last Updated: December 2024
          </div>
        </div>
      </div>
    </div>
  );
}
