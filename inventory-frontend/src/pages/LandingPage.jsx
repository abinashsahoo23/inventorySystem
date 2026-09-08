import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import Roles from "../components/landing/Roles";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";
import "../components/landing/LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <main className="landing-main">
        <Hero />
        <Features />
        <HowItWorks />
        <Roles />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
