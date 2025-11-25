import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallToAction from "@/components/CallToAction";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Dykstra Funeral Home",
  description: "Learn about Dykstra Funeral Home's history, values, and commitment to serving families in the Midwest with compassion and dignity.",
};

export default function About() {
  return (
    <>
      <Header />

      <section className="bg-[--cream] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-serif font-bold text-[--navy] mb-6 text-center">
            About Dykstra Funeral Home
          </h1>
          <p className="text-xl text-gray-700 text-center max-w-3xl mx-auto">
            A trusted partner for families during life's most difficult moments
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-[--navy] mb-6">
              Our Story
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                For generations, Dykstra Funeral Home has been a cornerstone of our community, providing compassionate care and professional service to families during their most difficult times. Our commitment to excellence and personal attention has made us a trusted name in funeral service throughout the Midwest.
              </p>
              <p>
                Founded on principles of dignity, respect, and service, we understand that every life is unique and deserves to be honored in a meaningful way. Our experienced staff takes pride in creating personalized services that celebrate the individual lives of those we serve.
              </p>
              <p>
                We are honored to serve families of all faiths and backgrounds, and we work closely with clergy, celebrants, and family members to ensure that each service reflects the wishes and values of your loved one.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[--cream]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-[--navy] mb-12 text-center">
            Our Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-serif font-bold text-[--navy] mb-4">
                Compassion
              </h3>
              <p className="text-gray-700">
                We treat every family with kindness, empathy, and understanding. Your grief is our concern, and we're here to support you every step of the way.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-serif font-bold text-[--navy] mb-4">
                Integrity
              </h3>
              <p className="text-gray-700">
                We conduct our business with honesty and transparency, providing clear information and fair pricing without hidden fees or pressure.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-serif font-bold text-[--navy] mb-4">
                Excellence
              </h3>
              <p className="text-gray-700">
                We maintain the highest standards in all aspects of our service, from facilities and equipment to staff training and attention to detail.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-[--navy] mb-6">
              Our Facilities
            </h2>
            <p className="text-gray-700 mb-6">
              Our modern funeral home is designed to provide comfort and peace during difficult times. We offer:
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <ul className="space-y-3 text-gray-700">
                <li>• Spacious visitation rooms</li>
                <li>• Chapel for services</li>
                <li>• Private family rooms</li>
                <li>• Reception and gathering areas</li>
              </ul>
              <ul className="space-y-3 text-gray-700">
                <li>• Modern audio/visual equipment</li>
                <li>• Ample parking</li>
                <li>• Wheelchair accessibility</li>
                <li>• Comfortable, welcoming atmosphere</li>
              </ul>
            </div>

            <h2 className="text-3xl font-serif font-bold text-[--navy] mb-6 mt-12">
              Community Involvement
            </h2>
            <p className="text-gray-700 mb-4">
              We believe in giving back to the community that has supported us for so many years. We are actively involved in local organizations and support various charitable causes throughout the region.
            </p>
            <p className="text-gray-700">
              Our staff members volunteer their time and expertise to help families in need and participate in community events that strengthen the bonds within our neighborhoods.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[--navy] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold mb-6">
            Our Commitment to You
          </h2>
          <p className="text-xl text-gray-200 mb-6">
            When you choose Dykstra Funeral Home, you're choosing a partner who will walk beside you through one of life's most challenging experiences. We promise to:
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div>
              <p className="text-gray-200">✓ Listen to your needs and wishes</p>
            </div>
            <div>
              <p className="text-gray-200">✓ Provide honest, transparent pricing</p>
            </div>
            <div>
              <p className="text-gray-200">✓ Handle all details with care</p>
            </div>
            <div>
              <p className="text-gray-200">✓ Respect your cultural and religious traditions</p>
            </div>
            <div>
              <p className="text-gray-200">✓ Be available 24/7 when you need us</p>
            </div>
            <div>
              <p className="text-gray-200">✓ Treat your family like our own</p>
            </div>
          </div>
        </div>
      </section>

      <CallToAction variant="secondary" />

      <Footer />
    </>
  );
}
