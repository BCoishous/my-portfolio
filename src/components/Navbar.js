import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <span className="nav-logo">BC</span>
      <ul className="nav-links">
        <li>
          <a href="#about">About</a>
        </li>
        <li>
          <a href="#projects">Projects</a>
        </li>
        <li>
          <a href="#contact">Contact</a>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
