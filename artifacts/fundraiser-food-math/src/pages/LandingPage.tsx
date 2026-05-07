import { PRICING_TIERS, isConfigured } from "@/config/paymentLinks";
import { ArrowRight, Utensils, Calculator, Printer, Check, Users, Clock, LayoutList } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="landing" data-testid="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <Link href="/" className="brand" data-testid="link-home">Fundraiser Food Math</Link>
        <div className="nav-links">
          <a href="#how-it-works" data-testid="link-how-it-works">How It Works</a>
          <a href="#pricing" data-testid="link-pricing">Pricing</a>
          <Link href="/planner" className="nav-cta" data-testid="link-nav-cta">
            Start Planning
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-badge" data-testid="hero-badge">For churches, schools, teams & nonprofits</div>
          <h1 className="hero-headline" data-testid="hero-headline">Plan your food fundraiser without guessing.</h1>
          <p className="hero-subheadline" data-testid="hero-subheadline">
            Get your food quantities, shopping list, prep timeline, volunteer plan, basic budget range, announcement copy, and Canva flyer brief in one ready-to-use fundraiser plan.
          </p>
          <Link href="/planner" className="hero-cta" data-testid="button-hero-cta">
            Build My Fundraiser Plan <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link href="/idea-finder" className="hero-secondary-cta" data-testid="button-hero-idea-finder">
            Help me choose a fundraiser →
          </Link>
          <p className="hero-disclaimer" data-testid="hero-disclaimer">Free to use. No account required.</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="how-section">
        <div className="section-inner">
          <h2 className="section-title">How it works</h2>
          <p className="section-sub">Three steps. No spreadsheet required.</p>
          <div className="steps-grid">
            <div className="step-card" data-testid="card-step-1">
              <div className="step-number"><Utensils className="w-6 h-6" /></div>
              <h3 className="step-title">Fill out your event details</h3>
              <p className="step-desc">Tell us your meal type, expected attendance, price point, and volunteer count.</p>
            </div>
            <div className="step-card" data-testid="card-step-2">
              <div className="step-number"><Calculator className="w-6 h-6" /></div>
              <h3 className="step-title">We do the math</h3>
              <p className="step-desc">Shopping list, food quantities, supply list, cost range, and profit estimate — all calculated instantly.</p>
            </div>
            <div className="step-card" data-testid="card-step-3">
              <div className="step-number"><Printer className="w-6 h-6" /></div>
              <h3 className="step-title">Print and run your event</h3>
              <p className="step-desc">Take your printable plan to the store and your team. No more guessing how many hot dogs to buy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meal types */}
      <section className="meals-section">
        <div className="section-inner">
          <h2 className="section-title">Meals we support</h2>
          <div className="meals-grid">
            {[
              "Hot Dogs", "Burgers", "Baked Potatoes",
              "Breakfast Burritos", "Tacos", "Spaghetti",
              "Pancakes", "Custom Meal",
            ].map((m) => (
              <div key={m} className="meal-chip" data-testid={`chip-meal-${m.replace(/\s/g, "-").toLowerCase()}`}>{m}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing-section">
        <div className="section-inner">
          <h2 className="section-title">Simple pricing</h2>
          <p className="section-sub">Start free. Upgrade to the $19 Founding Event Pack when you want the full plan.</p>
          <div className="pricing-grid">
            {PRICING_TIERS.map((tier) => (
              <div key={tier.id} className={`pricing-card${tier.highlighted ? " pricing-card--highlighted" : ""}`} data-testid={`card-pricing-${tier.id}`}>
                {tier.highlighted && <div className="pricing-badge">Most popular</div>}
                <div className="pricing-name">{tier.name}</div>
                <div className="pricing-price">{tier.price}</div>
                <div className="pricing-desc">{tier.description}</div>
                <ul className="pricing-features">
                  {tier.features.map((f) => (
                    <li key={f} className="pricing-feature">
                      <Check className="w-4 h-4 feature-check" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isConfigured(tier.link) ? (
                  <a href={tier.link} className="pricing-cta" target="_blank" rel="noopener noreferrer" data-testid={`link-pricing-cta-${tier.id}`}>
                    {tier.cta}
                  </a>
                ) : (
                  <Link href="/planner" className={`pricing-cta${tier.id === "free" ? " pricing-cta--free" : ""}`} data-testid={`button-pricing-cta-${tier.id}`}>
                    {tier.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="about-section">
        <div className="section-inner about-inner">
          <div>
            <h2 className="section-title">Built for volunteer-run events</h2>
            <p className="about-text">
              Fundraiser Food Math was built for the event coordinators who are already
              doing too much — the parent volunteer who got asked to "handle food" for 300 people,
              the youth pastor figuring out how many pounds of taco meat to buy, the team mom
              managing a pancake breakfast on a Saturday morning.
            </p>
            <p className="about-text">
              We handle the math. You handle the people.
            </p>
            <Link href="/planner" className="hero-cta about-cta" data-testid="button-about-cta">
              Build My Plan Now
            </Link>
          </div>
          <div className="about-stats">
            {[
              { label: "Meal types supported", value: "8+", icon: <Utensils className="w-6 h-6 text-accent mb-2" /> },
              { label: "Event sections generated", value: "10+", icon: <LayoutList className="w-6 h-6 text-accent mb-2" /> },
              { label: "Time to complete", value: "~5 min", icon: <Clock className="w-6 h-6 text-accent mb-2" /> },
              { label: "Volunteers helped", value: "Countless", icon: <Users className="w-6 h-6 text-accent mb-2" /> },
            ].map((stat) => (
              <div key={stat.label} className="stat-card" data-testid={`card-stat-${stat.label.replace(/\s/g, "-").toLowerCase()}`}>
                {stat.icon}
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="brand" data-testid="footer-brand">Fundraiser Food Math</span>
          <div className="footer-links">
            <a href="/" data-testid="footer-link-home">Home</a>
            <Link href="/planner" data-testid="footer-link-planner">Planner</Link>
            <Link href="/idea-finder" data-testid="footer-link-idea-finder">Idea Finder</Link>
            <a href="#pricing" data-testid="footer-link-pricing">Pricing</a>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Fundraiser Food Math. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}