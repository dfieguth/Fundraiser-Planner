import { PRICING_TIERS } from "@/config/paymentLinks";
import { ArrowRight, Utensils, Calculator, Printer, Check, Users, Clock, LayoutList } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="landing" data-testid="landing-page">
      {/* Nav */}
      <header className="landing-nav">
        <Link href="/" className="brand" data-testid="link-home">Fundraiser Food Math</Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#how-it-works" data-testid="link-how-it-works">How It Works</a>
          <a href="#pricing" data-testid="link-pricing">Pricing</a>
          <Link href="/planner" className="nav-cta" data-testid="link-nav-cta">
            Start Planning
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main>
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-inner">
          <div className="hero-badge" data-testid="hero-badge">For churches, schools, teams & nonprofits</div>
          <h1 id="hero-heading" className="hero-headline" data-testid="hero-headline">Plan your food fundraiser without guessing.</h1>
          <p className="hero-subheadline" data-testid="hero-subheadline">
            Choose a supported meal, enter your expected attendance, and get dependable food quantities plus a practical shopping plan. You also receive helpful prep, volunteer, and communication extras for running the event.
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
              <h3 className="step-title">Choose a meal and attendance</h3>
              <p className="step-desc">Pick a supported meal and enter how many guests you expect.</p>
            </div>
            <div className="step-card" data-testid="card-step-2">
              <div className="step-number"><Calculator className="w-6 h-6" /></div>
              <h3 className="step-title">We do the math</h3>
              <p className="step-desc">Get dependable quantities, package guidance, and a practical shopping list calculated for your event.</p>
            </div>
            <div className="step-card" data-testid="card-step-3">
              <div className="step-number"><Printer className="w-6 h-6" /></div>
              <h3 className="step-title">Print and run your event</h3>
              <p className="step-desc">Take the food plan to the store, with prep, volunteer, and communication tools as helpful bonuses.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-section" aria-labelledby="trust-heading">
        <div className="section-inner trust-inner">
          <div>
            <p className="eyebrow">Clear about the math</p>
            <h2 id="trust-heading" className="section-title trust-title">A planning estimate you can inspect.</h2>
            <p className="trust-copy">
              Fundraiser Food Math shows the assumptions behind each estimate so your team can review quantities before buying. It is a planning tool—not a promise of exact attendance, prices, or leftovers.
            </p>
          </div>
          <ul className="trust-list">
            <li><Check className="w-5 h-5" /><span><strong>Serving assumptions are visible</strong><br />Review the buffer and serving logic before you shop.</span></li>
            <li><Check className="w-5 h-5" /><span><strong>No account required</strong><br />Start with the free planner and decide when you are ready to save.</span></li>
            <li><Check className="w-5 h-5" /><span><strong>Real support is available</strong><br />Questions about a plan? <a href="mailto:devin@ghfc.org">Contact the team</a>.</span></li>
          </ul>
        </div>
      </section>

      {/* Meal types */}
      <section className="meals-section">
        <div className="section-inner">
          <h2 className="section-title">Meals we support</h2>
          <div className="meals-grid">
            {[
              "Hot Dogs", "Burgers", "Baked Potato Bar",
              "Taco Bar", "Walking Tacos", "Spaghetti Dinner",
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
            {PRICING_TIERS.filter((tier) => tier.id !== "custom").map((tier) => (
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
                <Link href="/planner" className={`pricing-cta${tier.id === "free" ? " pricing-cta--free" : ""}`} data-testid={`button-pricing-cta-${tier.id}`}>
                  {tier.cta}
                </Link>
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
              the youth pastor figuring out how many pounds of taco meat to buy, or the
              coordinator managing a spaghetti dinner on a Saturday night.
            </p>
            <p className="about-text">
              We handle the meal math. You handle the people. Prep, volunteer, and communication tools are there to support you.
            </p>
            <Link href="/planner" className="hero-cta about-cta" data-testid="button-about-cta">
              Build My Plan Now
            </Link>
          </div>
          <div className="about-stats">
            {[
              { label: "Meal types supported", value: "6", icon: <Utensils className="w-6 h-6 text-accent mb-2" /> },
              { label: "Event sections generated", value: "10+", icon: <LayoutList className="w-6 h-6 text-accent mb-2" /> },
              { label: "Time to complete", value: "~5 min", icon: <Clock className="w-6 h-6 text-accent mb-2" /> },
               { label: "Signup required", value: "None", icon: <Users className="w-6 h-6 text-accent mb-2" /> },
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
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="brand" data-testid="footer-brand">Fundraiser Food Math</span>
           <nav className="footer-links" aria-label="Footer navigation">
            <a href="/" data-testid="footer-link-home">Home</a>
            <Link href="/planner" data-testid="footer-link-planner">Planner</Link>
            <Link href="/idea-finder" data-testid="footer-link-idea-finder">Idea Finder</Link>
            <a href="#pricing" data-testid="footer-link-pricing">Pricing</a>
           </nav>
          <p className="footer-copy">© {new Date().getFullYear()} Fundraiser Food Math. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}