import { useEffect, useState } from "react";
import { getNotifications, markAllRead, getNotifIcon } from "../services/notificationService";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 1)   return "ahora mismo";
  if (mins < 60)  return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours} h`;
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

function NotificationPanel({ recipientId, recipientRole, onClose, onRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    getNotifications(recipientId, recipientRole)
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [recipientId, recipientRole]);

  async function handleMarkAllRead() {
    await markAllRead(recipientId, recipientRole);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onRead?.();
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
      <div className="notif-panel-header">
        <span className="notif-panel-title">
          🔔 Notificaciones
          {unread > 0 && <span className="notif-badge-count">{unread}</span>}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {unread > 0 && (
            <button className="notif-mark-read" onClick={handleMarkAllRead}>
              Marcar todo como leído
            </button>
          )}
          <button className="notif-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="notif-list">
        {loading && <p className="notif-empty">Cargando...</p>}

        {!loading && notifications.length === 0 && (
          <div className="notif-empty">
            <span style={{ fontSize: 32 }}>🔔</span>
            <p>No tienes notificaciones aún.</p>
          </div>
        )}

        {!loading && notifications.map((n) => (
          <div key={n.id} className={`notif-item ${n.read ? "" : "notif-item--unread"}`}>
            <span className="notif-icon">{getNotifIcon(n.type)}</span>
            <div className="notif-content">
              <p className="notif-title">{n.title}</p>
              {n.message && <p className="notif-message">{n.message}</p>}
              <span className="notif-time">{timeAgo(n.created_at)}</span>
            </div>
            {!n.read && <div className="notif-unread-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationPanel;
