import "./About.css";

function About() {
  return (
    <section id="about" className="about">
      <p className="section-label">About</p>
      <div className="about-grid">
        <div className="about-text">
          <p>
            I made a career change that most people would not have considered.
            After nearly a decade as a{" "}
            <strong>Journeyman Automotive Technician</strong> I left a trade I
            was good at to start over in software. I needed a bigger challenge
            and a career that could grow with me long term.
          </p>
          <p>
            What I brought with me was a mindset. In a busy shop you learn to
            work systematically, communicate clearly, stay calm under pressure,
            and never cut corners on documentation. Those habits follow me into
            every line of code I write.
          </p>
          <p>
            I am currently finishing my{" "}
            <strong>Software Development diploma at Keyin College</strong> and
            actively looking for opportunities to contribute to a team and grow
            as a developer.
          </p>
        </div>
        <div className="skills-block">
          <h3>Languages</h3>
          <div className="skill-tags">
            <span className="tag">Python</span>
            <span className="tag">JavaScript</span>
            <span className="tag">Java</span>
            <span className="tag">SQL</span>
            <span className="tag">HTML</span>
            <span className="tag">CSS</span>
          </div>
          <h3>Frontend & Backend</h3>
          <div className="skill-tags">
            <span className="tag">React</span>
            <span className="tag">Node.js</span>
            <span className="tag">Express.js</span>
            <span className="tag">REST APIs</span>
            <span className="tag">PostgreSQL</span>
          </div>
          <h3>Cloud & DevOps</h3>
          <div className="skill-tags">
            <span className="tag">AWS EC2</span>
            <span className="tag">S3</span>
            <span className="tag">RDS</span>
            <span className="tag">Lambda</span>
            <span className="tag">IAM</span>
            <span className="tag">VPC</span>
            <span className="tag">Docker</span>
            <span className="tag">CI/CD</span>
          </div>
          <h3>Tools</h3>
          <div className="skill-tags">
            <span className="tag">Git</span>
            <span className="tag">GitHub</span>
            <span className="tag">Maven</span>
            <span className="tag">Jupyter</span>
            <span className="tag">pandas</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
