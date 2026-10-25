import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../components/usePageTitle";
import styles from "./Support.module.css";

// Rendered outside the game layout. No game elements or terminology (S3).
export default function Support() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  usePageTitle("Get support now");

  // This page sits outside Layout, so it handles its own focus on arrival.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className={styles.page}>
      <h1 ref={headingRef} tabIndex={-1}>
        You don't have to go through this alone
      </h1>
      <p>If you are thinking about suicide or are in crisis, please reach out now. All of these are free.</p>

      <section className={styles.section} aria-labelledby="danger-heading">
        <h2 id="danger-heading">If you're in danger right now</h2>
        <ul className={styles.list}>
          <li>
            <strong>Emergency services:</strong> call <a href="tel:911">911</a>
          </li>
          <li>
            <strong>UVic Campus Security:</strong> call <a href="tel:+12507217599">250-721-7599</a>
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="now-heading">
        <h2 id="now-heading">Talk to someone now, any time</h2>
        <ul className={styles.list}>
          <li>
            <strong>9-8-8 Suicide Crisis Helpline</strong> (Canada, 24/7): call <a href="tel:988">9-8-8</a> or text{" "}
            <a href="sms:988">9-8-8</a>
          </li>
          <li>
            <strong>UVic SupportConnect</strong> (free, confidential counselling for UVic students, 24/7): call{" "}
            <a href="tel:+18447731427">1-844-773-1427</a>, or <a href="tel:+12509997621">1-250-999-7621</a> from
            outside North America. You can also chat live in the "TELUS Health Student Support" app.{" "}
            <a href="https://www.uvic.ca/student-wellness/wellness-resources/supportconnect/" target="_blank" rel="noopener noreferrer">
              About SupportConnect<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="campus-heading">
        <h2 id="campus-heading">On campus</h2>
        <ul className={styles.list}>
          <li>
            <strong>UVic Student Wellness Centre:</strong> counselling, nurses, and physicians, with same-day or
            booked appointments Monday to Friday. Call <a href="tel:+12507218563">250-721-8563</a> or visit 2300
            McKenzie Ave., across from CARSA.
          </li>
          <li>
            <strong>Indigenous counselling:</strong> call <a href="tel:+12507218563">250-721-8563</a> or visit the
            Wellness Centre and ask for an Indigenous counselling appointment.
          </li>
        </ul>
      </section>

      <p className={styles.note}>
        This app is a practice tool and is not a replacement for professional support.
      </p>
      <Link to="/">Return to home</Link>
    </main>
  );
}
