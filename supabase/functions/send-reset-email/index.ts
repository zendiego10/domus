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

    const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey  = Deno.env.get("BREVO_API_KEY")!;
    const senderEmail  = Deno.env.get("BREVO_SENDER_EMAIL")!;
    const appUrl       = Deno.env.get("APP_URL") ?? "https://domus.vercel.app";

    console.log(`[reset] email solicitado: ${email}`);
    console.log(`[reset] APP_URL: ${appUrl}`);

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: parent, error: parentError } = await supabase
      .from("parents")
      .select("id, first_name")
      .eq("email", email)
      .maybeSingle();

    if (parentError) console.error("[reset] error buscando padre:", parentError);

    if (parent) {
      console.log(`[reset] padre encontrado: id=${parent.id}`);

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const { error: tokenError } = await supabase
        .from("password_reset_tokens")
        .insert([{ parent_id: parent.id, token, expires_at: expiresAt }]);

      if (tokenError) {
        console.error("[reset] error guardando token:", tokenError);
      } else {
        console.log("[reset] token guardado OK");
      }

      const resetLink = `${appUrl}/reset-password?token=${token}`;

      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Domus", email: senderEmail },
          to: [{ email }],
          subject: "Recupera tu contraseña de Domus",
          htmlContent: `
            <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
              <h1 style="color:#9420D4;font-size:28px;margin-bottom:4px;">Domus!</h1>
              <hr style="border:none;border-top:1px solid #f0f0f5;margin-bottom:24px;">
              <h2 style="font-size:20px;color:#1f2937;">Hola, ${parent.first_name} 👋</h2>
              <p style="color:#374151;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                Haz clic en el botón para crear una nueva (el enlace expira en <strong>1 hora</strong>).
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetLink}"
                   style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#9420D4,#b44de8);
                          color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">
                  Restablecer contraseña
                </a>
              </div>
              <p style="color:#9ca3af;font-size:13px;">
                Si no solicitaste esto, puedes ignorar este correo. Tu contraseña no cambiará.
              </p>
            </div>
          `,
        }),
      });

      const brevoBody = await brevoRes.json();
      console.log(`[reset] Brevo status: ${brevoRes.status}`, JSON.stringify(brevoBody));

      if (!brevoRes.ok) {
        console.error("[reset] Brevo error:", brevoBody);
      }
    } else {
      console.log("[reset] padre NO encontrado — no se envía correo");
    }

    // Siempre responder OK (anti-enumeración).
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("[reset] error inesperado:", err);
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
