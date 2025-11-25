import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[--charcoal] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-serif font-bold mb-4">Dykstra Funeral Home</h3>
            <p className="text-gray-300 text-sm">
              Serving families with compassion, dignity, and respect for over generations.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/services" className="text-gray-300 hover:text-white transition-colors">
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="/obituaries" className="text-gray-300 hover:text-white transition-colors">
                  Obituaries
                </Link>
              </li>
              <li>
                <Link href="/pre-planning" className="text-gray-300 hover:text-white transition-colors">
                  Pre-Planning
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>123 Main Street</li>
              <li>Anytown, MI 12345</li>
              <li className="pt-2">
                <a href="tel:+15551234567" className="hover:text-white transition-colors">
                  (555) 123-4567
                </a>
              </li>
              <li>
                <a href="mailto:info@dykstrafh.com" className="hover:text-white transition-colors">
                  info@dykstrafh.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Hours</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>Available 24/7</li>
              <li className="pt-2 text-xs">
                Office Hours:
              </li>
              <li className="text-xs">Monday - Friday: 9am - 5pm</li>
              <li className="text-xs">Saturday: 10am - 2pm</li>
              <li className="text-xs">Sunday: By Appointment</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Dykstra Funeral Home. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
