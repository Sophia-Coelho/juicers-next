import nodemailer from "nodemailer";
import { lookup } from "node:dns/promises";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendDoctorInviteEmail({
  patientEmail,
  patientName,
  doctorName,
  inviteLink,
}) {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("GMAIL_USER e GMAIL_APP_PASSWORD não estão configurados.");
  }

  if (!gmailUser.toLowerCase().endsWith("@gmail.com")) {
    throw new Error("GMAIL_USER precisa ser um endereço @gmail.com.");
  }

  const smtpHost = "smtp.gmail.com";
  const { address: smtpAddress } = await lookup(smtpHost, { family: 4 });

  const transporter = nodemailer.createTransport({
    host: smtpAddress,
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailAppPassword },
    tls: { servername: smtpHost },
  });

  const safePatientName = escapeHtml(patientName);
  const safeDoctorName = escapeHtml(doctorName);
  const safeInviteLink = escapeHtml(inviteLink);

  await transporter.sendMail({
    from: `Juicers <${gmailUser}>`,
    to: patientEmail,
    subject: "Convite para acessar o Juicers",
    text: `Olá, ${patientName}!\n\n${doctorName} convidou você para criar sua conta no Juicers.\n\nAcesse o convite: ${inviteLink}\n\nEste link expira em 7 dias.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#202124;line-height:1.6">
        <h1 style="font-size:22px">Você recebeu um convite para o Juicers</h1>
        <p>Olá, ${safePatientName}!</p>
        <p><strong>${safeDoctorName}</strong> convidou você para criar sua conta e acessar o Juicers.</p>
        <p><a href="${safeInviteLink}" style="display:inline-block;padding:12px 20px;background:#2fd6be;color:#06201d;text-decoration:none;border-radius:8px;font-weight:bold">Aceitar convite</a></p>
        <p>Se o botão não funcionar, copie este link para o navegador:</p>
        <p><a href="${safeInviteLink}">${safeInviteLink}</a></p>
        <p>Este link expira em 7 dias.</p>
      </div>
    `,
  });
}
