export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[680px] px-6 py-16">
      <header className="mb-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-accent)]">
          Manifesto
        </p>
        <h1 className="font-serif text-4xl leading-tight text-[var(--color-fg)] md:text-5xl">
          Why arguments matter.
        </h1>
      </header>

      <div className="space-y-6 text-[15px] leading-[1.8] text-[var(--color-muted)]">
        <p>
          The best ideas do not emerge from consensus. They emerge from collision. When a
          proposition meets its strongest possible objection — when someone who genuinely disagrees,
          who has thought carefully about the other side, makes the best available case — something
          clarifying happens. The proposition either breaks, or it gets stronger.
        </p>
        <p>
          This is the oldest technology for finding truth. Socrates did not write down answers. He
          argued. The adversarial method is what the common law is built on: not a single judge
          deciding what is true, but two advocates, each with every incentive to find the weaknesses
          in the other's position.
        </p>
        <p>
          Modern AI systems are optimized for agreement. A language model will, by default,
          construct the most plausible continuation of what you wrote — which often means agreeing
          with whatever implicit premise you embedded in your question. Ask a leading question, get
          a confirming answer. This is a subtle but profound failure mode.
        </p>
        <p>
          Agora is an attempt to reverse this. Instead of one model trying to be helpful, Agora
          assembles a cast — each persona with a distinct worldview, a different model of what
          matters, a different prior about how the world works. The Empiricist demands evidence. The
          Libertarian questions every premise that involves collective action. The Communitarian
          asks what is lost when you optimize for efficiency. None of them are trying to make you
          feel good. They are trying to make the argument.
        </p>

        <h2 className="pt-6 font-serif text-2xl text-[var(--color-fg)]">
          The problem with synthetic agreement
        </h2>
        <p>
          When a single AI model responds to a complex question, it is doing a kind of averaging. It
          has been trained on human-generated text, which contains every viewpoint — but the
          training process, and the RLHF fine-tuning that follows, tends to push toward the center.
          Controversial positions get softened. Counterarguments get briefly acknowledged before the
          model returns to the safe middle.
        </p>
        <p>
          This means that the more consequential the question, the less useful a single model tends
          to be. Climate policy. Economic tradeoffs. Questions where the right answer is genuinely
          contested among thoughtful people. On these questions, a helpful AI will produce an answer
          that sounds balanced but is actually just a hedge.
        </p>
        <p>
          A debate is different. In a debate, each side is trying to win. The goal is not to
          represent all perspectives fairly — it is to make the strongest possible case for one
          position, and then to counter whatever the other side produces. This is uncomfortable. It
          is supposed to be. The discomfort is the mechanism.
        </p>

        <h2 className="pt-6 font-serif text-2xl text-[var(--color-fg)]">
          Six phases, one synthesis
        </h2>
        <p>
          Agora runs each debate through six structured phases. Framing establishes the terms.
          Opening lets each persona make its core argument without interruption. Cross-examination
          is where the weaknesses get exposed — each persona directly challenging the others.
          Rebuttal gives each side the chance to respond. Closing is the final summation. And
          Synthesis attempts something harder: a moderator that has watched the whole exchange tries
          to find what was actually established, where the genuine disagreements lie, and what a
          reasonable person should update.
        </p>
        <p>
          The synthesis is not a declaration of a winner. The goal is not to decide who was right.
          The goal is to leave you in a position to think more clearly — with the strongest version
          of each argument in your head, and a clearer picture of where the real cruxes are.
        </p>

        <h2 className="pt-6 font-serif text-2xl text-[var(--color-fg)]">Why self-hosted</h2>
        <p>
          There is a version of this that could be a cloud product. We chose not to build it that
          way. A cloud product requires us to make decisions about what debates are allowed, which
          personas can exist, what arguments can be made. We do not want to make those decisions. We
          are not confident we would make them well.
        </p>
        <p>
          Self-hosting puts those decisions with you. You control the instance, the personas, the
          models. You can run Agora on questions that no cloud product would touch — internal
          company debates, contested policy questions, arguments about your own beliefs. You bring
          your own API keys, so you control the cost and the provider.
        </p>
        <p>
          This is not a workaround for moderation. It is a philosophical position: tools that help
          people think more clearly should be owned by the people using them.
        </p>

        <h2 className="pt-6 font-serif text-2xl text-[var(--color-fg)]">Open by design</h2>
        <p>
          Agora is MIT-licensed. The entire platform is open — the debate engine, the API, the UI,
          the persona format. You can read every line of code that processes your debates. You can
          modify the personas. You can add phases. You can fork it and build something different.
        </p>
        <p>
          We do not collect telemetry by default. We do not have a dashboard showing which debates
          are happening on which instances. We do not know who is using Agora or what they are
          arguing about.
        </p>
        <p>That is the point.</p>

        <div className="mt-12 border-t border-[var(--color-border)] pt-8">
          <p className="font-mono text-xs text-[var(--color-muted)]">
            Agora contributors · MIT License ·{" "}
            <a
              href="https://github.com/your-org/agora"
              className="hover:text-[var(--color-fg)] transition-colors underline underline-offset-4"
            >
              github.com/your-org/agora
            </a>
          </p>
        </div>
      </div>
    </article>
  );
}
