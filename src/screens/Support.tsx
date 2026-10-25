import { Link } from "react-router-dom";
import styles from "./Support.module.css";

// Rendered outside the game layout. No game elements or terminology (S3).
// Full screen built out in #14.
export default function Support() {
  return (
    <main className={styles.page}>
      <h1>You don't have to go through this alone</h1>
      <p>If you are thinking about suicide or are in crisis, please reach out now.</p>
      <ul className={styles.list}>
        <li>
          <strong>9-8-8 Suicide Crisis Helpline</strong> (Canada): call or text{" "}
          <a href="tel:988">9-8-8</a>, any time.
        </li>
        <li>
          <strong>Emergency:</strong> call <a href="tel:911">911</a>.
        </li>
        <li>
          <strong>Campus counselling:</strong> contact your university's counselling services.
        </li>
      </ul>
      <p className={styles.note}>
        This app is a practice tool and is not a replacement for professional support.
      </p>
      <Link to="/">Return to home</Link>
    </main>
  );
}
