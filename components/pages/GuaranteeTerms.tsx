type Section = {
  h: string;
  intro?: string;
  items?: string[];
  paragraph?: string;
};

const sections: Section[] = [
  {
    h: "Eligibility",
    intro: "Our On-Time Delivery Promise applies where:",
    items: [
      "The booking has been accepted and confirmed by Infinite Distributions.",
      "A delivery deadline has been agreed upon before collection.",
      "The shipment is collected at the agreed pickup time.",
      "The sender and recipient are available to hand over and receive the goods.",
    ],
  },
  {
    h: "Delivery timeframes",
    intro: "The agreed delivery deadline may include, but is not limited to:",
    items: [
      "Express delivery",
      "Same-day delivery",
      "Within a specified number of hours",
      "Next business day",
      "Multi-day deliveries",
      "Any other delivery timeframe agreed at the time of booking",
    ],
  },
  {
    h: "Same-day deliveries",
    items: [
      "Same-day delivery is available upon request and is subject to driver availability and service capacity.",
      "A same-day delivery is only considered confirmed once accepted by Infinite Distributions.",
      "If a same-day booking is accepted, the agreed delivery deadline will be confirmed at the time of booking.",
    ],
  },
  {
    h: "Exclusions",
    intro: "This guarantee does not apply where delays are caused by:",
    items: [
      "Incorrect, incomplete or inaccurate pickup or delivery information.",
      "Incorrect recipient contact details.",
      "The sender or recipient being unavailable.",
      "Goods not being ready for collection at the agreed pickup time.",
      "Delays caused by the sender or recipient during pickup or delivery.",
      "Changes to the booking, delivery address or delivery instructions after confirmation.",
      "Restricted access to buildings, loading docks, gated premises or secure sites.",
      "Dangerous conditions that make delivery unsafe.",
      "Vehicle breakdowns or accidents that could not reasonably have been prevented.",
      "Road closures due to police, emergency services or government authorities.",
      "Severe weather, floods, bushfires, storms or other natural disasters.",
      "Industrial action, public emergencies or any event beyond the reasonable control of Infinite Distributions.",
    ],
  },
  {
    h: "Refunds",
    items: [
      "Where the On-Time Delivery Promise applies, the refund is limited to the courier fee paid for the affected delivery.",
      "The guarantee does not cover any indirect, consequential or business losses resulting from a delayed delivery.",
      "Refunds or account credits will be processed after the delivery has been completed and the claim has been assessed.",
    ],
  },
  {
    h: "General",
    paragraph:
      "Infinite Distributions reserves the right to decline any booking where the requested delivery timeframe cannot reasonably be achieved.",
  },
];

export default function GuaranteeTerms() {
  return (
    <section className="bg-white pt-36 pb-24">
      <div className="container-site max-w-4xl">
        <p className="section-label">On-Time Delivery Promise</p>
        <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-tight text-ink">
          Terms &amp; Conditions
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">
          If we miss an agreed delivery deadline for reasons within our control, your delivery is
          free. These terms set out exactly when the promise applies, what&apos;s excluded, and how
          refunds work.
        </p>

        <div className="mt-14 space-y-12">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {s.h}
              </h2>
              {s.intro && <p className="mt-4 text-lg leading-relaxed text-ink/75">{s.intro}</p>}
              {s.paragraph && (
                <p className="mt-4 text-lg leading-relaxed text-ink/75">{s.paragraph}</p>
              )}
              {s.items && (
                <ul className="mt-5 space-y-3">
                  {s.items.map((it) => (
                    <li key={it} className="flex gap-3 text-lg leading-relaxed text-ink/75">
                      <span className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-electric" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <p className="mt-16 border-t border-slate-200 pt-8 text-sm text-ink/55">
          Questions about the On-Time Delivery Promise? Email{" "}
          <a
            href="mailto:infinitedistributionsmelb@gmail.com"
            className="font-semibold text-electric hover:underline"
          >
            infinitedistributionsmelb@gmail.com
          </a>{" "}
          or call 0421 042 007.
        </p>
      </div>
    </section>
  );
}
