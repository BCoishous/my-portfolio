import "./Contact.css";

function Contact() {
  return (
    <section id="contact" className="contact">
      <p className="section-label">Contact</p>
      <div className="contact-inner">
        <h2 className="contact-heading">
          Open to opportunities.
          <br />
          Let's talk.
        </h2>
        <p className="contact-sub">
          I am graduating in August 2026 and actively looking for full stack,
          cloud, or data roles in St. John's. If you are building something
          interesting I would like to hear about it.
        </p>
        <div className="contact-links">
          <a href="mailto:Brandon.Coish@gmail.com" className="btn btn-primary">
            Brandon.Coish@gmail.com
          </a>
          <a
            href="https://www.linkedin.com/in/brandon-coish-"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/BCoishous"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
