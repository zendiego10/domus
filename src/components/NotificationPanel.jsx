import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAllRead, markNotificationRead, getNotifIcon } from "../services/notificationService";

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

// Ruta destino según tipo de notificación y rol del receptor.
function getRouteForNotif(type, recipientRole) {
  if (recipientRole === "parent") {
    if (["task_completed", "task_review"].includes(type)) return "/parent-tasks";
    if (["reward_requested"].includes(type))              return "/parent-rewards";
  }
  if (recipientRole === "child") {
    if (["new_task", "task_approved", "task_rejected"].includes(type)) return "/child-tasks";
    if (["new_reward", "reward_approved", "reward_rejected"].includes(type)) return "/child-rewards";
  }
  return null;
}

function NotificationPanel({ recipientId, recipientRole, onClose, onRead }) {
  const navigate = useNavigate();
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

  async function handleClickNotif(notif) {
    // Marcar como leída si no lo estaba.
    if (!notif.read) {
      markNotificationRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, read: true } : n)
      );
      const remaining = notifications.filter((n) => !n.read && n.id !== notif.id).length;
      if (remaining === 0) onRead?.();
    }
    // Navegar a la pestaña correspondiente.
    const route = getRouteForNotif(notif.type, recipientRole);
    if (route) {
      onClose();
      navigate(route);
    }
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
              Marcar todo leído
            </button>
          )}
          <button className="notif-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="notif-list">
        {loading && <p className="notif-empty">Cargando...</p>}

        {!loading && notifications.length === 0 && (
          <div className="notif-empty">
            <span style={{ fontSize: 36 }}>🔔</span>
            <p>No tienes notificaciones aún.</p>
          </div>
        )}

        {!loading && notifications.map((n) => {
          const route = getRouteForNotif(n.type, recipientRole);
          return (
            <div
              key={n.id}
              className={`notif-item ${n.read ? "" : "notif-item--unread"} ${route ? "notif-item--clickable" : ""}`}
              onClick={() => handleClickNotif(n)}
            >
              <span className="notif-icon">{getNotifIcon(n.type)}</span>
              <div className="notif-content">
                <p className="notif-title">{n.title}</p>
                {n.message && <p className="notif-message">{n.message}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span className="notif-time">{timeAgo(n.created_at)}</span>
                  {route && <span className="notif-tap-hint">Toca para ver →</span>}
                </div>
              </div>
              {!n.read && <div className="notif-unread-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NotificationPanel;
