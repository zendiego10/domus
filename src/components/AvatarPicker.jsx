import { useState } from "react";
import { AVATARS } from "../lib/avatars";

function AvatarPicker({ currentAvatarId, onSelect, onConfirm, onCancel, confirmLabel = "Guardar", loading = false }) {
  const [selected, setSelected] = useState(currentAvatarId || null);

  const boys  = AVATARS.filter((a) => a.id.startsWith("boy_"));
  const girls = AVATARS.filter((a) => a.id.startsWith("girl_"));

  return (
    <div className="avatar-picker-wrap">
      <h2 className="avatar-picker-title">Elige tu avatar</h2>
      <p className="avatar-picker-subtitle">Puedes cambiarlo cuando quieras desde tu perfil.</p>

      <div className="avatar-picker-section-label">👦 Niños</div>
      <div className="avatar-picker-grid">
        {boys.map((av) => (
          <button
            key={av.id}
            className={`avatar-option ${selected === av.id ? "avatar-option--selected" : ""}`}
            onClick={() => { setSelected(av.id); onSelect?.(av.id); }}
            title={av.label}
            type="button"
          >
            <div className="avatar-option-circle" style={{ background: av.bg }}>
              {av.emoji}
            </div>
            <span className="avatar-option-label">{av.label}</span>
          </button>
        ))}
      </div>

      <div className="avatar-picker-section-label" style={{ marginTop: 16 }}>👧 Niñas</div>
      <div className="avatar-picker-grid">
        {girls.map((av) => (
          <button
            key={av.id}
            className={`avatar-option ${selected === av.id ? "avatar-option--selected" : ""}`}
            onClick={() => { setSelected(av.id); onSelect?.(av.id); }}
            title={av.label}
            type="button"
          >
            <div className="avatar-option-circle" style={{ background: av.bg }}>
              {av.emoji}
            </div>
            <span className="avatar-option-label">{av.label}</span>
          </button>
        ))}
      </div>

      <div className="avatar-picker-actions">
        <button
          className="btn-save-inline"
          style={{ padding: "10px 28px", fontSize: 15 }}
          disabled={!selected || loading}
          onClick={() => onConfirm(selected)}
          type="button"
        >
          {loading ? "Guardando…" : confirmLabel}
        </button>
        {onCancel && (
          <button className="btn-cancel-inline" onClick={onCancel} type="button">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export default AvatarPicker;
