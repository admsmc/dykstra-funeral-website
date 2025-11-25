import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Obituaries | Dykstra Funeral Home",
  description: "View current obituaries and pay tribute to loved ones served by Dykstra Funeral Home.",
};

export default function Obituaries() {
  return (
    <>
      <Header />

      <section className="bg-[--cream] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-serif font-bold text-[--navy] mb-6 text-center">
            Obituaries
          </h1>
          <p className="text-xl text-gray-700 text-center max-w-3xl mx-auto">
            Honoring the lives of those we've had the privilege to serve
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search obituaries by name..."
              className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[--sage] focus:border-transparent"
            />
          </div>

          <div className="bg-[--cream] p-12 rounded-lg text-center">
            <h2 className="text-2xl font-serif font-bold text-[--navy] mb-4">
              Current Obituaries
            </h2>
            <p className="text-gray-700 mb-6">
              There are currently no obituaries to display. Please check back soon or contact us for assistance.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-[--navy] text-white px-6 py-3 rounded-md font-semibold hover:bg-[--charcoal] transition-colors"
            >
              Contact Us
            </Link>
          </div>

          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-[--navy] mb-6">
              About Our Obituary Services
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                We understand the importance of creating a meaningful tribute to your loved one. Our obituary services include:
              </p>
              <ul className="space-y-2 ml-6">
                <li>• Professional obituary writing assistance</li>
                <li>• Publication in local newspapers</li>
                <li>• Online memorial pages with photo galleries</li>
                <li>• Guest book for condolences and memories</li>
                <li>• Social media sharing options</li>
                <li>• Email notifications to family and friends</li>
              </ul>
              <p className="pt-4">
                Each online obituary provides a lasting tribute where family and friends can share memories, photos, and condolences. These digital memorials remain accessible indefinitely, allowing future generations to learn about and honor their loved ones.
              </p>
            </div>

            <div className="mt-12 bg-[--sage] text-white p-8 rounded-lg">
              <h3 className="text-2xl font-serif font-bold mb-4">
                Submit an Obituary
              </h3>
              <p className="mb-6">
                If you need assistance creating or submitting an obituary, our staff is here to help. We'll work with you to craft a meaningful tribute that honors your loved one's life and legacy.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-white text-[--sage] px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
              >
                Get Assistance
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
