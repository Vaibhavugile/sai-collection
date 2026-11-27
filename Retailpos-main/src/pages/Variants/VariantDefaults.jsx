
import { useEffect, useState } from "react";
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./VariantDefaults.css";

const DEFAULT_COLORS = [
  "Black", "White", "Blue", "Red",
  "Green", "Yellow", "Grey", "Brown",
];

const DEFAULT_SIZES = [
  "XS", "S", "M", "L", "XL", "XXL",
  "30", "32", "34", "36",
];

const defaultsRef = doc(db, "variants", "defaults");

export default function VariantDefaults() {
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");

  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");

  // ---------------------------------------
  // LOAD FIREBASE DEFAULTS
  // ---------------------------------------

  useEffect(() => {
    let mounted = true;

    const loadDefaults = async () => {
      try {
        const data = await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(defaultsRef);

          if (!snapshot.exists()) {
            transaction.set(defaultsRef, {
              colors: DEFAULT_COLORS,
              sizes: DEFAULT_SIZES,
              updatedAt: serverTimestamp(),
            });

            return {
              colors: DEFAULT_COLORS,
              sizes: DEFAULT_SIZES,
            };
          }

          return snapshot.data();
        });

        if (!mounted) return;

        setColors(Array.isArray(data.colors) ? data.colors : DEFAULT_COLORS);
        setSizes(Array.isArray(data.sizes) ? data.sizes : DEFAULT_SIZES);
      } catch (err) {
        console.error("Failed to load variant defaults:", err);
        if (mounted) setError("Unable to load variant settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDefaults();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------------------
  // SAVE ONE FIELD WITHOUT OVERWRITING OTHER
  // ---------------------------------------

  const saveField = async (field, nextValues) => {
    setSaving(true);
    setError("");

    try {
      const savedValues = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(defaultsRef);
        const current = snapshot.exists() ? snapshot.data() : {};

        const values = Array.isArray(nextValues) ? nextValues : [];

        transaction.set(
          defaultsRef,
          {
            [field]: values,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        return values;
      });

      if (field === "colors") setColors(savedValues);
      if (field === "sizes") setSizes(savedValues);

      return true;
    } catch (err) {
      console.error("Failed to save variant defaults:", err);
      setError("Could not save changes. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------
  // ADD VALUE
  // ---------------------------------------

  const addValue = async (field, value) => {
    const cleanValue = value.trim();

    if (!cleanValue || saving) return;

    const current = field === "colors" ? colors : sizes;

    const exists = current.some(
      (item) => item.toLowerCase() === cleanValue.toLowerCase()
    );

    if (exists) {
      setError(`${cleanValue} already exists.`);
      return;
    }

    const success = await saveField(field, [...current, cleanValue]);

    if (success) {
      if (field === "colors") setNewColor("");
      else setNewSize("");
    }
  };

  // ---------------------------------------
  // EDIT VALUE
  // ---------------------------------------

  const startEdit = (field, index, value) => {
    setEditing({ field, index });
    setEditValue(value);
    setError("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const updateValue = async () => {
    if (!editing || saving) return;

    const cleanValue = editValue.trim();

    if (!cleanValue) {
      setError("Please enter a value.");
      return;
    }

    const current =
      editing.field === "colors" ? colors : sizes;

    const duplicate = current.some(
      (item, index) =>
        index !== editing.index &&
        item.toLowerCase() === cleanValue.toLowerCase()
    );

    if (duplicate) {
      setError(`${cleanValue} already exists.`);
      return;
    }

    const next = [...current];
    next[editing.index] = cleanValue;

    const success = await saveField(editing.field, next);

    if (success) cancelEdit();
  };

  // ---------------------------------------
  // REMOVE VALUE
  // ---------------------------------------

  const removeValue = async (field, index) => {
    if (saving) return;

    const current = field === "colors" ? colors : sizes;
    const value = current[index];

    const confirmed = window.confirm(
      `Remove "${value}" from default ${field}? Existing product variants will not be deleted.`
    );

    if (!confirmed) return;

    const next = current.filter((_, i) => i !== index);

    await saveField(field, next);

    if (
      editing &&
      editing.field === field &&
      editing.index === index
    ) {
      cancelEdit();
    }
  };

  const getColorStyle = (color) => {
    const known = {
      black: "#222222",
      white: "#ffffff",
      blue: "#2563eb",
      red: "#dc2626",
      green: "#16a34a",
      yellow: "#eab308",
      grey: "#9ca3af",
      gray: "#9ca3af",
      brown: "#92400e",
      pink: "#ec4899",
      purple: "#9333ea",
      orange: "#f97316",
      navy: "#1e3a8a",
      maroon: "#7f1d1d",
      beige: "#d6c2a1",
    };

    return known[color.toLowerCase()] || "#c9b99b";
  };

  const renderSection = (field, title, subtitle, values, input, setInput) => (
    <section className="variant-settings-card">
      <div className="variant-settings-heading">
        <div>
          <span className="variant-settings-eyebrow">PRODUCT DEFAULTS</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <span className="variant-settings-count">
          {values.length} {values.length === 1 ? "item" : "items"}
        </span>
      </div>

      <form
        className="variant-add-form"
        onSubmit={(e) => {
          e.preventDefault();
          addValue(field, input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Enter new ${field === "colors" ? "color" : "size"}...`}
          disabled={saving || loading}
        />

        <button
          type="submit"
          disabled={saving || loading || !input.trim()}
        >
          <span>＋</span> Add {field === "colors" ? "Color" : "Size"}
        </button>
      </form>

      <div className="variant-settings-list">
        {values.length === 0 ? (
          <div className="variant-settings-empty">
            No defaults added yet.
          </div>
        ) : (
          values.map((value, index) => {
            const isEditing =
              editing?.field === field && editing?.index === index;

            return (
              <div className="variant-default-row" key={`${field}-${index}`}>
                {isEditing ? (
                  <>
                    <input
                      className="variant-edit-input"
                      value={editValue}
                      autoFocus
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          updateValue();
                        }
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />

                    <div className="variant-row-actions">
                      <button
                        type="button"
                        className="variant-action-save"
                        onClick={updateValue}
                        disabled={saving}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="variant-action-cancel"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="variant-default-name">
                      {field === "colors" && (
                        <span
                          className="variant-color-dot"
                          style={{
                            background: getColorStyle(value),
                            border:
                              value.toLowerCase() === "white"
                                ? "1px solid #d8d3ca"
                                : "none",
                          }}
                        />
                      )}

                      <span>{value}</span>
                    </div>

                    <div className="variant-row-actions">
                      <button
                        type="button"
                        className="variant-action-edit"
                        onClick={() => startEdit(field, index, value)}
                        disabled={saving}
                        title="Edit"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="variant-action-delete"
                        onClick={() => removeValue(field, index)}
                        disabled={saving}
                        title="Remove"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );

  return (
    <div className="variant-settings-page">
      <div className="variant-settings-top">
        <div>
          <div className="variant-settings-breadcrumb">
            PRODUCT MANAGEMENT <span>/</span> VARIANT SETTINGS
          </div>

          <h1>Variant Settings</h1>

          <p>
            Manage the default colors and sizes available when creating
            product variants.
          </p>
        </div>

        <div className="variant-settings-status">
          <span className="variant-status-dot" />
          Firebase Connected
        </div>
      </div>

      {error && (
        <div className="variant-settings-error">
          {error}
          <button type="button" onClick={() => setError("")}>×</button>
        </div>
      )}

      {saving && (
        <div className="variant-saving-indicator">
          Saving changes to Firebase...
        </div>
      )}

      {loading ? (
        <div className="variant-settings-loading">
          <span className="variant-loader" />
          Loading variant settings...
        </div>
      ) : (
        <>
          <div className="variant-settings-info">
            <div className="variant-info-icon">i</div>
            <div>
              <strong>Global product defaults</strong>
              <p>
                These values are shared across new product forms. Removing a
                default does not delete variants already saved in products.
              </p>
            </div>
          </div>

          <div className="variant-settings-grid">
            {renderSection(
              "colors",
              "Default Colors",
              "Manage the colors available for product variants.",
              colors,
              newColor,
              setNewColor
            )}

            {renderSection(
              "sizes",
              "Default Sizes",
              "Manage clothing and other product sizes.",
              sizes,
              newSize,
              setNewSize
            )}
          </div>

          <div className="variant-settings-footer">
            <span>
              <span className="variant-footer-dot" />
              Changes are saved directly to Firestore.
            </span>
            <span>Collection: variants / defaults</span>
          </div>
        </>
      )}
    </div>
  );
}
