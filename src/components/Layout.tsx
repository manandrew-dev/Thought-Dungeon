import { NavLink, Outlet } from "react-router-dom";
import SafetyNotice from "./SafetyNotice";
import { useRouteFocus } from "./useRouteFocus";
import styles from "./Layout.module.css";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/bestiary", label: "Bestiary" },
  { to: "/learn", label: "Learn" },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  useRouteFocus();

  return (
    <div className={styles.shell}>
      {/* Focus manually: with hash routing, href="#main" alone would navigate away. */}
      <a
        className={styles.skipLink}
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className={styles.header}>
        <span className={styles.brand}>Thought Dungeon</span>
        <nav aria-label="Main">
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <SafetyNotice />
    </div>
  );
}
