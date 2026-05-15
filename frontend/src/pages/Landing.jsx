import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ChevronDown } from "lucide-react";
import Logo from "../components/Logo";
import PopupBanner from "../components/PopupBanner";
import api, { BACKEND_URL } from "../lib/api";

function absUrl(u) { if (!u) return ""; return u.startsWith("http") ? u : `${BACKEND_URL}${u}`; }

const WHY = [
  {
    t: "One Room. Every Right Person.",
    d: "The founders, decision-makers and craftspeople you'd otherwise chase for months — gathered, available, walking the same floor as you.",
  },
  {
    t: "Deals Reserved for the Room.",
    d: "Exhibitors bring bazaar-only pricing, trade terms and festive-season bundles you won't find online or in stores. Walk out with offers that pay for the trip.",
  },
  {
    t: "Discover Before Anyone Else.",
    d: "Unannounced launches, limited collections and private previews — most reach the open market months later, often at a different price.",
  },
  {
    t: "Conversations That Open Doors.",
    d: "Sourcing partners, distributors, capital, hires, mentors — built over a quiet afternoon, not another cold message. The kind of meetings that don't happen on calendars.",
  },
  {
    t: "Curated, Not Crowded.",
    d: "Every exhibitor is a vetted LVB Rama member. No filler stalls, no time-wasters — two unhurried hours here is a month of qualified meetings elsewhere.",
  },
  {
    t: "An Experience Worth Showing Up For.",
    d: "Considered hospitality, refined details and the company of people who take their craft seriously. The kind of room you want to be seen in.",
  },
];

const FAQS = [
  { q: "Who can attend Rama Bazaar 1.0?", a: "Visitors are open to all by registration. Exhibitor stalls are exclusive to LVB Rama members on a first-come, first-served basis." },
  { q: "Is registration free?", a: "Yes, visitor registration is complimentary. Exhibitor onboarding follows the LVB Rama member fee structure." },
  { q: "Will I get a QR pass?", a: "After visitor registration, a personal QR code is generated. Carry it to the venue for instant check-in." },
  { q: "How can I become a sponsor?", a: "Reach out via the contact section. Title, featured, and inline sponsor placements are available." },
];

export default function Landing() {
  const [settings, setSettings] = useState({});
  const [featured, setFeatured] = useState([]);
  const [sponsors, setSponsors] = useState({ featured: [], footer: [] });

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data || {})).catch(() => {});
    api.get("/roster").then((r) => setFeatured((r.data.exhibitors || []).filter((e) => e.featured).slice(0, 6))).catch(() => {});
    api.get("/roster/sponsors").then((r) => setSponsors(r.data || {})).catch(() => {});
  }, []);

  return (
    <div data-testid="landing-page" className="relative">
      <PopupBanner />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-xl mx-auto px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center">
          <div className="eyebrow animate-fadeUp">An Exclusive LVB Rama Event</div>
          <div className="mt-8 flex justify-center animate-fadeUp">
            <Logo size="xl" />
          </div>
          <p className="mt-10 text-base sm:text-lg leading-relaxed animate-fadeUp" style={{ color: "#3b3b46" }}>
            An invitation-only exhibition where ambitious brands meet meaningful capital, mentors and community.
          </p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto animate-fadeUp">
            <Link data-testid="hero-cta-visitor" to="/register" className="btn-gold">Visitor Registration</Link>
            <Link data-testid="hero-cta-exhibitor" to="/exhibitor/register" className="btn-outline-gold">Exhibitor Registration</Link>
            <Link data-testid="hero-cta-roster" to="/roster" className="btn-outline-gold">View Digital Roster</Link>
            <Link data-testid="hero-cta-myqr" to="/my-qr" className="btn-outline-gold">Show My QR Code</Link>
          </div>

          {(settings.start_date || settings.venue) && (
            <div className="mt-12 flex items-center justify-center gap-6 text-xs uppercase" style={{ letterSpacing: "0.22em", color: "#7a7868" }}>
              {settings.start_date && (
                <span className="inline-flex items-center gap-2"><Calendar size={14} style={{ color: "#b2873d" }} /> {settings.start_date}</span>
              )}
              {settings.venue && (
                <span className="inline-flex items-center gap-2"><MapPin size={14} style={{ color: "#b2873d" }} /> {settings.venue}</span>
              )}
            </div>
          )}

          <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} aria-label="Scroll" className="mt-10 inline-flex flex-col items-center gap-1 text-xs" style={{ color: "#7a7868", letterSpacing: "0.22em" }}>
            <span className="uppercase">Explore</span><ChevronDown size={14} />
          </button>
        </div>
      </section>

      <div className="divider-thin" />

      {/* ABOUT */}
      <section id="about" className="max-w-xl mx-auto px-6 py-16">
        <div className="eyebrow">About</div>
        <h2 className="font-serif-display text-4xl sm:text-5xl leading-tight mt-3">A premium space for distinguished businesses.</h2>
        <p className="mt-6 text-base leading-relaxed" style={{ color: "#3b3b46" }}>
          Rama Bazaar 1.0 is the inaugural exhibition of LVB Rama — a deliberately curated stage where founders, family businesses and category leaders come together to showcase, collaborate and grow. Expect quiet luxury, considered conversations and the right room at the right time.
        </p>
      </section>

      <div className="divider-thin" />

      {/* WHY */}
      <section className="max-w-xl mx-auto px-6 py-16">
        <div className="eyebrow">Why Visit</div>
        <h2 className="font-serif-display text-3xl sm:text-4xl mt-3">Six reasons people clear their calendar.</h2>
        <p className="mt-4 text-base leading-relaxed" style={{ color: "#3b3b46" }}>
          Most exhibitions chase footfall. Rama Bazaar 1.0 chases the right footfall — and rewards the people who show up.
        </p>
        <div className="mt-8 space-y-6">
          {WHY.map((w, i) => (
            <div key={i} className="card-luxe p-6">
              <div className="eyebrow" style={{ color: "#b2873d" }}>{String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-serif-display text-2xl mt-2">{w.t}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#3b3b46" }}>{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-thin" />

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="max-w-xl mx-auto px-6 py-16">
          <div className="eyebrow">Featured Exhibitors</div>
          <h2 className="font-serif-display text-3xl sm:text-4xl mt-3">A glimpse of the roster.</h2>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {featured.map((e) => (
              <Link key={e.id} to={`/roster#${e.id}`} className="card-luxe p-4 hover:shadow-gold transition-shadow">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#efeae0] border" style={{ borderColor: "#d8bc84" }}>
                  {e.logo_url ? <img src={absUrl(e.logo_url)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-serif-display" style={{ color: "#b2873d" }}>{e.business_name?.[0]}</div>}
                </div>
                <div className="mt-3 font-serif-display text-lg leading-tight">{e.business_name}</div>
                <div className="text-xs mt-0.5" style={{ color: "#7a7868" }}>{e.category}</div>
              </Link>
            ))}
          </div>
          <Link to="/roster" className="mt-8 inline-flex items-center gap-2 eyebrow" style={{ color: "#b2873d" }}>View full roster →</Link>
        </section>
      )}

      {/* FEATURED SPONSORS */}
      {sponsors.featured?.length > 0 && (
        <>
          <div className="divider-thin" />
          <section className="max-w-xl mx-auto px-6 py-16">
            <div className="eyebrow">Title & Featured Sponsors</div>
            <h2 className="font-serif-display text-3xl mt-3">In gracious partnership.</h2>
            <div className="mt-6 grid grid-cols-1 gap-3">
              {sponsors.featured.map((s) => (
                <a key={s.id} href={s.link || "#"} target="_blank" rel="noreferrer" className="card-luxe overflow-hidden">
                  <div className="aspect-[16/7] bg-[#efeae0] overflow-hidden">
                    {s.media_type === "video" ? <video src={absUrl(s.media_url)} muted loop playsInline className="w-full h-full object-cover"/> : <img src={absUrl(s.media_url)} alt={s.name} className="w-full h-full object-cover" loading="lazy"/>}
                  </div>
                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="font-serif-display text-lg">{s.name}</span>
                    <span className="eyebrow" style={{ color: "#b2873d" }}>Visit →</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="divider-thin" />

      {/* VENUE */}
      <section className="max-w-xl mx-auto px-6 py-16">
        <div className="eyebrow">Venue & Date</div>
        <h2 className="font-serif-display text-3xl sm:text-4xl mt-3">{settings.venue || "Venue to be announced"}</h2>
        <p className="mt-3 text-sm" style={{ color: "#3b3b46" }}>{settings.venue_address || ""}</p>
        {settings.start_date && <p className="mt-2 text-sm" style={{ color: "#3b3b46" }}>{settings.start_date}{settings.end_date ? ` — ${settings.end_date}` : ""}</p>}
        {settings.maps_link && (
          <a href={settings.maps_link} target="_blank" rel="noreferrer" className="mt-6 inline-flex btn-outline-gold">Open in Maps</a>
        )}
      </section>

      <div className="divider-thin" />

      {/* FAQ */}
      <section className="max-w-xl mx-auto px-6 py-16">
        <div className="eyebrow">FAQ</div>
        <h2 className="font-serif-display text-3xl mt-3">Questions, gracefully answered.</h2>
        <div className="mt-8 space-y-2">
          {FAQS.map((f, i) => <Faq key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      <div className="divider-thin" />

      {/* CONTACT */}
      <section className="max-w-xl mx-auto px-6 py-16 text-center">
        <div className="eyebrow">Contact</div>
        <h2 className="font-serif-display text-3xl mt-3">Reach the Rama Bazaar desk.</h2>
        <p className="mt-3 text-sm" style={{ color: "#3b3b46" }}>For sponsorships, partnerships and exhibitor support.</p>
        <a href="mailto:hello@ramabazaar.in" className="mt-6 inline-flex btn-gold">Write to us</a>
      </section>

      {/* FOOTER SPONSOR */}
      {sponsors.footer?.length > 0 && (
        <section className="max-w-xl mx-auto px-6 pb-10">
          <div className="card-luxe overflow-hidden">
            <div className="aspect-[3/1] bg-[#efeae0]">
              <a href={sponsors.footer[0].link || "#"} target="_blank" rel="noreferrer">
                <img src={absUrl(sponsors.footer[0].media_url)} alt={sponsors.footer[0].name} className="w-full h-full object-cover" loading="lazy"/>
              </a>
            </div>
          </div>
        </section>
      )}

      <footer className="max-w-xl mx-auto px-6 pb-24 text-center">
        <Logo size="sm" />
        <div className="mt-3 eyebrow" style={{ color: "#7a7868" }}>© Rama Bazaar 1.0 · LVB Rama</div>
      </footer>
    </div>
  );
}

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: "rgba(178,135,61,0.18)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="font-serif-display text-lg pr-4">{q}</span>
        <span style={{ color: "#b2873d" }} className="text-xl">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed" style={{ color: "#3b3b46" }}>{a}</p>}
    </div>
  );
}
