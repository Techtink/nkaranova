import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';
import './Footer.scss';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              Tailor Connect
            </Link>
            <p className="footer-tagline">
              Connecting you with talented tailors worldwide.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <FiTwitter />
              </a>
              <a href="#" className="social-link" aria-label="Facebook">
                <FiFacebook />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h4>For Customers</h4>
            <ul>
              <li><Link to="/tailors">Find Tailors</Link></li>
              <li><Link to="/gallery">Browse Gallery</Link></li>
              <li><Link to="/ai-search">AI Search</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>For Tailors</h4>
            <ul>
              <li><Link to="/register?role=tailor">Join as Tailor</Link></li>
              <li><Link to="/tailor/dashboard">Dashboard</Link></li>
              <li><Link to="/help/tailors">Help Center</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Tailor Connect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
