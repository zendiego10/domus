import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { email } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const appUrl = Deno.env.get("APP_URL") ?? "https://domus.vercel.app";

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar el padre (siempre responder OK para anti-enumeración).
    const { data: parent } = await supabase
      .from("parents")
      .select("id, first_name")
      .eq("email", email)
      .maybeSingle();

    if (parent) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await supabase.from("password_reset_tokens").insert([{
        parent_id: parent.id,
        token,
        expires_at: expiresAt,
      }]);

      const resetLink = `${appUrl}/reset-password?token=${token}`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Domus <onboarding@resend.dev>",
          to: [email],
          subject: "Recupera tu contraseña de Domus",
          html: `
            <h2>Hola, ${parent.first_name}!</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Domus</strong>.</p>
            <p>Haz clic en el botón para crear una nueva contraseña (el enlace expira en 1 hora):</p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#9420D4;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
              Restablecer contraseña
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
              Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.
            </p>
          `,
        }),
      });
    }

    // Siempre responder OK (anti-enumeración de emails).
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("send-reset-email error:", err);
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
