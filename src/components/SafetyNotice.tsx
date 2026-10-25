import { Link } from "react-router-dom";
import styles from "./SafetyNotice.module.css";

// Persistent notice required on every screen except Support (S4).
export default function SafetyNotice() {
  return (
    <footer className={styles.notice}>
      <p className={styles.text}>
        Thought Dungeon is a practice tool, not a replacement for professional support.{" "}
        <Link to="/support">Get support now</Link>
      </p>
    </footer>
  );
}
