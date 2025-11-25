import Link from "next/link";

interface CallToActionProps {
  variant?: "primary" | "secondary" | "emergency";
}

export default function CallToAction({ variant = "primary" }: CallToActionProps) {
  if (variant === "emergency") {
    return (
      <section className="bg-[--navy] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Need Immediate Assistance?
          </h2>
          <p className="text-xl mb-6 text-gray-200">
            We're available 24 hours a day, 7 days a week
          </p>
          <a
            href="tel:+15551234567"
            className="inline-block bg-white text-[--navy] px-8 py-4 rounded-md text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Call Now: (555) 123-4567
          </a>
        </div>
      </section>
    );
  }

  if (variant === "secondary") {
    return (
      <section className="bg-[--cream] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-serif font-bold mb-4 text-[--navy]">
                Plan Ahead
              </h3>
              <p className="text-gray-700 mb-6">
                Pre-planning your funeral arrangements provides peace of mind and relieves your family of difficult decisions during emotional times.
              </p>
              <Link
                href="/pre-planning"
                className="inline-block bg-[--sage] text-white px-6 py-3 rounded-md hover:bg-[--navy] transition-colors"
              >
                Learn About Pre-Planning
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-serif font-bold mb-4 text-[--navy]">
                Contact Us
              </h3>
              <p className="text-gray-700 mb-6">
                Our compassionate staff is here to help guide you through every step. Reach out today for personalized support.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-[--sage] text-white px-6 py-3 rounded-md hover:bg-[--navy] transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[--sage] text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-serif font-bold mb-4">
          How Can We Help You Today?
        </h2>
        <p className="text-xl mb-8 text-gray-100">
          Our caring team is here to support you during this difficult time
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:+15551234567"
            className="inline-block bg-white text-[--sage] px-8 py-3 rounded-md text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Call: (555) 123-4567
          </a>
          <Link
            href="/contact"
            className="inline-block bg-[--navy] text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-[--charcoal] transition-colors"
          >
            Send a Message
          </Link>
        </div>
      </div>
    </section>
  );
}
