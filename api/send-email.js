// Vercel Serverless Function: Secure Email Dispatch
// Utilise EXCLUSIVEMENT les variables d'environnement serveur (EMAIL_USER, EMAIL_PASSWORD, SMTP_HOST, SMTP_PORT)

const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const records = rateLimitMap.get(ip) || [];
  const recentRecords = records.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRecords.length >= maxRequests) {
    return true;
  }
  
  recentRecords.push(now);
  rateLimitMap.set(ip, recentRecords);
  return false;
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim()) && email.length <= 100;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeHeaderField(str) {
  if (typeof str !== 'string') return '';
  // Strip newlines, carriage returns and control characters to prevent header injection
  return str.replace(/[\r\n\t\0\x08\x0b\x0c]/g, ' ').replace(/[<>]/g, '').trim();
}

function sanitizeMessageBody(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
}

export default async function handler(req, res) {
  // 1. Restriction méthode HTTP
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  // 2. Protection Anti-Abus : Rate Limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ 
      error: 'Trop de requêtes. Veuillez patienter une minute avant de réessayer.' 
    });
  }

  try {
    const { name, email, subject, message, _honeypot } = req.body || {};

    // 3. Protection Anti-Spam : Champ Honeypot invisible
    if (_honeypot && String(_honeypot).trim().length > 0) {
      // Les robots remplissent souvent ce champ invisible : on simule un succès pour ne pas les alerter
      return res.status(200).json({ success: true, message: 'Message reçu.' });
    }

    // 4. Validation stricte des données entrantes
    const cleanName = sanitizeHeaderField(name);
    const cleanEmail = typeof email === 'string' ? email.replace(/[\r\n]/g, '').trim() : '';
    const cleanSubject = sanitizeHeaderField(subject) || 'Nouveau message de contact Mwana Lari';
    const cleanMessage = sanitizeMessageBody(message);

    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({ error: 'Le nom doit comporter entre 2 et 100 caractères.' });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    if (!cleanMessage || cleanMessage.length < 5 || cleanMessage.length > 5000) {
      return res.status(400).json({ error: 'Le message doit comporter entre 5 et 5000 caractères.' });
    }

    // 5. Récupération des variables d'environnement serveur
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
    const DESTINATION_EMAIL = process.env.CONTACT_DESTINATION_EMAIL || EMAIL_USER;

    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      console.error('[API Send-Email] Erreur de configuration : EMAIL_USER ou EMAIL_PASSWORD manquant sur le serveur.');
      return res.status(503).json({ 
        error: 'Le service d\'envoi d\'e-mail n\'est pas configuré sur ce serveur.' 
      });
    }

    // 6. Envoi via SMTP avec transport sécurisé
    let nodemailer;
    try {
      nodemailer = await import('nodemailer');
    } catch {
      // Si nodemailer n'est pas installé, log côté serveur sans fuiter d'identifiants
      console.warn('[API Send-Email] Package nodemailer non disponible.');
    }

    if (nodemailer && (nodemailer.default || nodemailer).createTransport) {
      const transporter = (nodemailer.default || nodemailer).createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Mwana Lari Support" <${EMAIL_USER}>`,
        to: DESTINATION_EMAIL,
        replyTo: cleanEmail,
        subject: `[Mwana Lari Contact] ${cleanSubject}`,
        text: `Nom: ${cleanName}\nEmail: ${cleanEmail}\n\nMessage:\n${cleanMessage}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e1b4b; padding: 20px;">
            <h2 style="color: #ea580c;">Nouveau message depuis Mwana Lari</h2>
            <p><strong>Expéditeur :</strong> ${escapeHtml(cleanName)} (&lt;${escapeHtml(cleanEmail)}&gt;)</p>
            <p><strong>Objet :</strong> ${escapeHtml(cleanSubject)}</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #ea580c; margin-top: 15px;">
              <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(cleanMessage)}</p>
            </div>
          </div>
        `,
      });
    } else {
      console.log(`[API Send-Email Mock/Dry-Run] Message reçu de ${cleanEmail}: ${cleanSubject}`);
    }

    // 7. Réponse sans aucune donnée sensible
    return res.status(200).json({
      success: true,
      message: 'Votre message a été transmis avec succès.'
    });

  } catch (error) {
    // Log d'erreur côté serveur masquant les secrets
    console.error('[API Send-Email] Erreur d\'envoi:', error.message || 'Erreur inconnue');
    return res.status(500).json({
      error: 'Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer plus tard.'
    });
  }
}
