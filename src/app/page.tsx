import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallToAction from "@/components/CallToAction";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-[--cream] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-[--navy] mb-6">
              Honoring Lives with Compassion & Dignity
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Serving families in the Midwest with personalized funeral services and caring support for over generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="tel:+15551234567"
                className="inline-flex items-center justify-center bg-gradient-to-r from-[--navy] to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-all shadow-md shadow-[--navy]/20"
              >
                Call 24/7: (555) 123-4567
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-[--sage]/10 text-[--navy] px-8 py-4 rounded-lg text-lg font-semibold border border-[--sage]/30 hover:bg-[--sage]/20 transition-all"
              >
                Contact Us
              </Link>
            </div>
            
            {/* Staff Portal Link - For Testing */}
            <div className="mt-8 pt-8 border-t border-gray-300">
              <Link
                href="/staff/dashboard"
                className="inline-flex items-center gap-2 text-sm text-[--sage] hover:text-[--navy] font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Staff Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-[--navy] mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We offer a full range of funeral and memorial services tailored to honor your loved one's unique life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[--cream] p-8 rounded-lg">
              <h3 className="text-2xl font-serif font-bold text-[--navy] mb-4">
                Traditional Funeral Services
              </h3>
              <p className="text-gray-700 mb-4">
                Complete funeral arrangements including visitation, ceremony, and burial services with personalized touches.
              </p>
              <Link href="/services" className="text-[--navy] font-semibold hover:text-[--sage]">
                Learn More →
              </Link>
            </div>

            <div className="bg-[--cream] p-8 rounded-lg">
              <h3 className="text-2xl font-serif font-bold text-[--navy] mb-4">
                Cremation Services
              </h3>
              <p className="text-gray-700 mb-4">
                Dignified cremation options with memorial services designed to celebrate your loved one's life and legacy.
              </p>
              <Link href="/services" className="text-[--navy] font-semibold hover:text-[--sage]">
                Learn More →
              </Link>
            </div>

            <div className="bg-[--cream] p-8 rounded-lg">
              <h3 className="text-2xl font-serif font-bold text-[--navy] mb-4">
                Pre-Planning
              </h3>
              <p className="text-gray-700 mb-4">
                Plan ahead to ensure your wishes are honored and provide peace of mind for your family.
              </p>
              <Link href="/pre-planning" className="text-[--navy] font-semibold hover:text-[--sage]">
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-[--cream]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-[--navy] mb-4">
              Why Choose Dykstra Funeral Home
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-[--sage] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                24/7
              </div>
              <h3 className="text-xl font-semibold text-[--navy] mb-2">
                Available Anytime
              </h3>
              <p className="text-gray-600">
                Around-the-clock support when you need us most
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[--sage] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ❤️
              </div>
              <h3 className="text-xl font-semibold text-[--navy] mb-2">
                Compassionate Care
              </h3>
              <p className="text-gray-600">
                Treating every family with dignity and respect
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[--sage] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✨
              </div>
              <h3 className="text-xl font-semibold text-[--navy] mb-2">
                Personalized Services
              </h3>
              <p className="text-gray-600">
                Customized arrangements to honor unique lives
              </p>
            </div>

            <div className="text-center">
              <div className="bg-[--sage] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🏛️
              </div>
              <h3 className="text-xl font-semibold text-[--navy] mb-2">
                Trusted Legacy
              </h3>
              <p className="text-gray-600">
                Generations of service to our community
              </p>
            </div>
          </div>
        </div>
      </section>

      <CallToAction variant="emergency" />

      <CallToAction variant="secondary" />

      <Footer />
    </>
  );
}
