"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    alert("Thank you for contacting us. We will reach out to you shortly.");
  };

  return (
    <>
      <Header />

      <section className="bg-[--cream] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-serif font-bold text-[--navy] mb-6 text-center">
            Contact Us
          </h1>
          <p className="text-xl text-gray-700 text-center max-w-3xl mx-auto">
            We're here to help you during this difficult time. Reach out to us anytime.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[--navy] mb-6">
                Get in Touch
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-[--navy] mb-2">
                    24/7 Immediate Assistance
                  </h3>
                  <a
                    href="tel:+15551234567"
                    className="text-2xl text-[--sage] hover:text-[--navy] transition-colors"
                  >
                    (555) 123-4567
                  </a>
                  <p className="text-gray-600 mt-2">
                    Available anytime, day or night
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-[--navy] mb-2">
                    Email
                  </h3>
                  <a
                    href="mailto:info@dykstrafh.com"
                    className="text-[--sage] hover:text-[--navy] transition-colors"
                  >
                    info@dykstrafh.com
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-[--navy] mb-2">
                    Location
                  </h3>
                  <p className="text-gray-700">
                    123 Main Street<br />
                    Anytown, MI 12345
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-[--navy] mb-2">
                    Office Hours
                  </h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>Monday - Friday: 9:00 AM - 5:00 PM</li>
                    <li>Saturday: 10:00 AM - 2:00 PM</li>
                    <li>Sunday: By Appointment</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[--cream] p-8 rounded-lg">
              <h2 className="text-2xl font-serif font-bold text-[--navy] mb-6">
                Send Us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[--sage] focus:border-transparent"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[--sage] focus:border-transparent"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-gray-700 font-semibold mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[--sage] focus:border-transparent"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[--sage] focus:border-transparent"
                    value={formData.message}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[--navy] text-white px-6 py-3 rounded-md font-semibold hover:bg-[--charcoal] transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
