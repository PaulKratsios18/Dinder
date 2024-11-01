import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer>
      <div className="footer__left">
        <a href="/contact">© 2024 Dinder</a>
      </div>
      <div className="footer__container">
      <button
          className="homepage-button"
          onClick={() => {
            const homepageSection = document.getElementById("header");
            if (homepageSection) {
              homepageSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          Return to Top
        </button>
        <button
          className="learn-more-button"
          onClick={() => {
            const aboutSection = document.getElementById("about");
            if (aboutSection) {
              aboutSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          About Us
        </button>
        <button
          className="contact-button"
          onClick={() => {
            const contactSection = document.getElementById("contact");
            if (contactSection) {
              contactSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          Contact Us
        </button>
        <button
          className="services-button"
          onClick={() => {
            const servicesSection = document.getElementById("services");
            if (servicesSection) {
              servicesSection.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          Learn More
        </button>
      </div>
    </footer>
  );
}

export default Footer;