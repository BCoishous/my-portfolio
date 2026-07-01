import "./Projects.css";

const projects = [
  {
    title: "Meeting of the Minds Trivia Championship",
    description:
      "Production event website for St. John's annual trivia championship, built and shipped on a live public deadline as a volunteer developer with NL Eats. Real users, real consequences, real deadline.",
    tags: ["React", "Node.js", "Shopify"],
    link: "https://www.meetingofthemindstrivia.com/",
    live: true,
  },
  {
    title: "Canadian Housing Market Analysis",
    description:
      "45 years of Statistics Canada housing data, cleaned and restructured with pandas, visualized across five cities covering decade averages, post-pandemic trends, and total growth rates. Built to answer a personal question about the St. John's market.",
    tags: ["Python", "pandas", "matplotlib", "seaborn", "Jupyter"],
    link: "https://github.com/BCoishous/canadian-housing-eda",
    live: false,
  },
  {
    title: "Gym Management System",
    description:
      "Full Java application with a normalized PostgreSQL backend, role-based access control across Admin, Trainer, and Member roles, and clean object-oriented architecture throughout.",
    tags: ["Java", "PostgreSQL", "Maven", "JDBC", "OOP"],
    link: "https://github.com/BCoishous/Advanced-Java-Final---Gym-Management-System",
    live: false,
  },
];

function Projects() {
  return (
    <section id="projects" className="projects">
      <p className="section-label">Projects</p>
      <div className="projects-grid">
        {projects.map((project, index) => (
          <a
            key={index}
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="project-card"
          >
            <div className="project-header">
              <span className="project-title">{project.title}</span>
              <span className="project-link-icon">↗</span>
            </div>
            <p className="project-desc">{project.description}</p>
            <div className="project-tags">
              {project.live && <span className="live-badge">Live</span>}
              {project.tags.map((tag, i) => (
                <span key={i} className="project-tag">
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default Projects;
