import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallToAction from "@/components/CallToAction";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Funeral Services | Dykstra Funeral Home",
  description: "Complete funeral and memorial services including traditional funerals, cremation, celebration of life ceremonies, and burial services.",
};

export default function Services() {
  return (
    <>
      <Header />

      <section className="bg-[--cream] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-serif font-bold text-[--navy] mb-6 text-center">
            Our Services
          </h1>
          <p className="text-xl text-gray-700 text-center max-w-3xl mx-auto">
            We provide personalized funeral and memorial services designed to honor your loved one's unique life and legacy.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-[--navy] mb-4">
                  Traditional Funeral Services
                </h2>
                <p className="text-gray-700 mb-4">
                  Our traditional funeral services provide a meaningful way to honor your loved one with dignity and respect. We handle every detail with care, allowing you to focus on celebrating their life and supporting one another.
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Visitation and viewing arrangements</li>
                  <li>• Funeral ceremony planning</li>
                  <li>• Graveside services</li>
                  <li>• Professional staff assistance</li>
                  <li>• Coordination with clergy and celebrants</li>
                  <li>• Custom floral and memorial arrangements</li>
                </ul>
              </div>
              <div className="bg-[--cream] p-8 rounded-lg">
                <h3 className="text-xl font-semibold text-[--navy] mb-4">
                  What's Included
                </h3>
                <p className="text-gray-700">
                  Complete funeral arrangements including transportation, preparation, facility use, staff services, and coordination with cemetery and other service providers.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1 bg-[--cream] p-8 rounded-lg">
                <h3 className="text-xl font-semibold text-[--navy] mb-4">
                  Cremation Options
                </h3>
                <p className="text-gray-700">
                  We offer various cremation packages with optional memorial services, allowing you to create a meaningful tribute that reflects your family's wishes and budget.
                </p>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-serif font-bold text-[--navy] mb-4">
                  Cremation Services
                </h2>
                <p className="text-gray-700 mb-4">
                  Cremation provides families with flexible options for honoring their loved ones. We offer dignified cremation services with opportunities for memorial ceremonies and permanent memorialization.
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Direct cremation services</li>
                  <li>• Cremation with memorial service</li>
                  <li>• Cremation with traditional funeral</li>
                  <li>• Urn selection and customization</li>
                  <li>• Ash scattering coordination</li>
                  <li>• Keepsake jewelry options</li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-[--navy] mb-4">
                  Memorial Services
                </h2>
                <p className="text-gray-700 mb-4">
                  Memorial services celebrate a life lived without the deceased present. These personalized ceremonies can be held at our facility, your place of worship, or a meaningful location.
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Celebration of life ceremonies</li>
                  <li>• Video tribute creation</li>
                  <li>• Memory table displays</li>
                  <li>• Guest registry and memory books</li>
                  <li>• Reception coordination</li>
                  <li>• Custom program design</li>
                </ul>
              </div>
              <div className="bg-[--cream] p-8 rounded-lg">
                <h3 className="text-xl font-semibold text-[--navy] mb-4">
                  Personalization
                </h3>
                <p className="text-gray-700">
                  Every memorial service is unique. We work with you to incorporate personal touches, from favorite music and photos to special readings and meaningful symbols.
                </p>
              </div>
            </div>

            <div className="bg-[--sage] text-white p-8 rounded-lg">
              <h2 className="text-3xl font-serif font-bold mb-4">
                Additional Services
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Grief Support</h3>
                  <p className="text-gray-100">Resources and counseling referrals for families navigating loss</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Veterans Services</h3>
                  <p className="text-gray-100">Honoring those who served with military funeral honors</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Obituary Assistance</h3>
                  <p className="text-gray-100">Professional writing and placement services</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Online Memorials</h3>
                  <p className="text-gray-100">Digital tributes for family and friends to share memories</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Casket Selection</h3>
                  <p className="text-gray-100">Wide variety of quality caskets and burial containers</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Floral Arrangements</h3>
                  <p className="text-gray-100">Beautiful flowers and memorial displays</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CallToAction variant="primary" />

      <Footer />
    </>
  );
}
