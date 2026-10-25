import { useEffect, useRef, useState } from "react";
import Switch from "../components/Switch";
import { useAppStore } from "../store";
import styles from "./Settings.module.css";

export default function Settings() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const exportData = useAppStore((state) => state.exportData);
  const wipeAll = useAppStore((state) => state.wipeAll);

  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [returnFocus, setReturnFocus] = useState(false);

  // After the confirm panel closes, put focus back on the button that opened it.
  useEffect(() => {
    if (returnFocus && !confirming) {
      deleteButtonRef.current?.focus();
      setReturnFocus(false);
    }
  }, [returnFocus, confirming]);

  function handleExport() {
    const json = JSON.stringify(exportData(), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "thought-dungeon-data.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Your data was downloaded.");
  }

  function handleCancel() {
    setConfirming(false);
    setReturnFocus(true);
  }

  function handleDelete() {
    wipeAll();
    setConfirming(false);
    setStatus("All data has been deleted.");
    setReturnFocus(true);
  }

  return (
    <div className={styles.page}>
      <h1>Settings</h1>

      <section className={styles.panel} aria-labelledby="comfort-heading">
        <h2 id="comfort-heading">Comfort</h2>
        <Switch
          label="Sound"
          hint="Sound effects during encounters."
          checked={settings.sound}
          onChange={(sound) => updateSettings({ sound })}
        />
        <Switch
          label="Reduce motion"
          hint="Turns off animations. Starts from your device's setting."
          checked={settings.reducedMotion}
          onChange={(reducedMotion) => updateSettings({ reducedMotion })}
        />
      </section>

      <section className={styles.panel} aria-labelledby="data-heading">
        <h2 id="data-heading">Your data</h2>
        <p className={styles.note}>Everything you write stays on this device. Nothing is sent anywhere.</p>

        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            Export my data
          </button>
          {!confirming && (
            <button
              ref={deleteButtonRef}
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStatus("");
                setConfirming(true);
              }}
            >
              Delete all data
            </button>
          )}
        </div>

        {confirming && (
          <div
            className={styles.confirm}
            role="group"
            aria-labelledby="confirm-text"
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
            <p id="confirm-text">
              This permanently removes all your encounters and your Bestiary from this device, and resets these
              settings. This can't be undone.
            </p>
            <div className={styles.actions}>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleDelete}>
                Delete everything
              </button>
            </div>
          </div>
        )}

        <p className={styles.status} role="status">
          {status}
        </p>
      </section>
    </div>
  );
}
