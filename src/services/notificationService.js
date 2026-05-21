import { supabase } from "./supabase";

const ICONS = {
  new_task:         "📋",
  task_completed:   "✅",
  task_review:      "📷",
  task_approved:    "🎉",
  task_rejected:    "↩️",
  new_reward:       "🎁",
  reward_requested: "🙋",
  reward_approved:  "🎊",
  reward_rejected:  "❌",
};

export function getNotifIcon(type) {
  return ICONS[type] || "🔔";
}

// Crea una notificación. Fire-and-forget: no lanza error si falla.
export async function createNotification(recipientId, recipientRole, type, title, message = "") {
  if (!recipientId) return;
  const { error } = await supabase.from("notifications").insert([{
    recipient_id: recipientId,
    recipient_role: recipientRole,
    type,
    title,
    message,
  }]);
  if (error) console.warn("[notif] error creando notificación:", error.message);
}

export async function getNotifications(recipientId, recipientRole, limit = 25) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", recipientId)
    .eq("recipient_role", recipientRole)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(recipientId, recipientRole) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("recipient_role", recipientRole)
    .eq("read", false);
  if (error) return 0;
  return count || 0;
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllRead(recipientId, recipientRole) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", recipientId)
    .eq("recipient_role", recipientRole)
    .eq("read", false);
  if (error) throw error;
}
