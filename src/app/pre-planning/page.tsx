import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallToAction from "@/components/CallToAction";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pre-Planning Services | Dykstra Funeral Home",
  description: "Plan ahead with peace of mind. Pre-arrange your funeral services and relieve your family of difficult decisions during emotional times.",
};

export default function PrePlanning() {
  return (
    <>
      <Header />

      <section className="bg-[--cream] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-serif font-bold text-[--navy] mb-6 text-center">
            Pre-Planning Services
          </h1>
          <p className="text-xl text-gray-700 text-center max-w-3xl mx-auto">
            Planning ahead provides peace of mind and ensures your wishes are honored while relieving your family of difficult decisions.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[--navy] mb-6">
                Why Pre-Plan?
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start">
                  <span className="text-[--sage] text-2xl mr-3">✓</span>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Peace of Mind</h3>
                    <p>Knowing your arrangements are in place provides comfort to you and your family.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-[--sage] text-2xl mr-3">✓</span>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Your Wishes Honored</h3>
                    <p>Ensure your funeral reflects your values, preferences, and personality.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-[--sage] text-2xl mr-3">✓</span>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Relieve Family Burden</h3>
                    <p>Spare loved ones from making difficult decisions during grief.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-[--sage] text-2xl mr-3">✓</span>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Financial Protection</h3>
                    <p>Lock in today's prices and protect against inflation.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-[--sage] text-2xl mr-3">✓</span>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">No Rush Decisions</h3>
                    <p>Make thoughtful choices without time pressure or emotional stress.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[--cream] p-8 rounded-lg">
              <h2 className="text-2xl font-serif font-bold text-[--navy] mb-6">
                What You Can Pre-Plan
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li>• Type of service (traditional, cremation, memorial)</li>
                <li>• Location and timing of services</li>
                <li>• Casket or urn selection</li>
                <li>• Burial or cremation preferences</li>
                <li>• Music, readings, and ceremony details</li>
                <li>• Flower arrangements</li>
                <li>• Obituary content and photos</li>
                <li>• Memorial contributions</li>
                <li>• Guest registry and memory books</li>
                <li>• Reception arrangements</li>
              </ul>
            </div>
          </div>

          <div className="bg-[--navy] text-white p-12 rounded-lg mb-16">
            <h2 className="text-3xl font-serif font-bold mb-6 text-center">
              The Pre-Planning Process
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-[--sage] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-xl mb-3">Initial Consultation</h3>
                <p className="text-gray-200">
                  Meet with our caring staff to discuss your wishes, preferences, and budget. This can be done in person or virtually.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-[--sage] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-xl mb-3">Document Your Choices</h3>
                <p className="text-gray-200">
                  We'll help you record all details of your service preferences and create a comprehensive plan.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-[--sage] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-xl mb-3">Secure Your Plan</h3>
                <p className="text-gray-200">
                  Choose a payment option that works for you. We'll keep your plan on file for when it's needed.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[--navy] mb-6">
                Payment Options
              </h2>
              <div className="space-y-4">
                <div className="border-l-4 border-[--sage] pl-4">
                  <h3 className="font-semibold text-lg text-[--navy] mb-2">
                    Pay in Full
                  </h3>
                  <p className="text-gray-700">
                    Make a single payment and lock in current prices, protecting against future inflation.
                  </p>
                </div>
                <div className="border-l-4 border-[--sage] pl-4">
                  <h3 className="font-semibold text-lg text-[--navy] mb-2">
                    Payment Plans
                  </h3>
                  <p className="text-gray-700">
                    Spread payments over time with flexible monthly installment options.
                  </p>
                </div>
                <div className="border-l-4 border-[--sage] pl-4">
                  <h3 className="font-semibold text-lg text-[--navy] mb-2">
                    Insurance Assignment
                  </h3>
                  <p className="text-gray-700">
                    Assign a life insurance policy to cover your funeral expenses.
                  </p>
                </div>
                <div className="border-l-4 border-[--sage] pl-4">
                  <h3 className="font-semibold text-lg text-[--navy] mb-2">
                    Trust Accounts
                  </h3>
                  <p className="text-gray-700">
                    Set up a revocable or irrevocable funeral trust for your arrangements.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[--cream] p-8 rounded-lg">
              <h2 className="text-2xl font-serif font-bold text-[--navy] mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-gray-700 mb-6">
                Our compassionate pre-planning specialists are here to guide you through every step of the process. There's no obligation, and all information is kept confidential.
              </p>
              <div className="space-y-4">
                <a
                  href="tel:+15551234567"
                  className="block w-full bg-[--navy] text-white px-6 py-3 rounded-md text-center font-semibold hover:bg-[--charcoal] transition-colors"
                >
                  Call to Schedule: (555) 123-4567
                </a>
                <Link
                  href="/contact"
                  className="block w-full bg-[--sage] text-white px-6 py-3 rounded-md text-center font-semibold hover:bg-[--navy] transition-colors"
                >
                  Request Information
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CallToAction variant="secondary" />

      <Footer />
    </>
  );
}
