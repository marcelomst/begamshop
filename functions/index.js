const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const { onCall } = require('firebase-functions/v2/https');
let sgMail = null;
// Evitar params en inicialización para no bloquear carga del emulador

function getDb() {
  if (getApps().length === 0) {
    initializeApp();
  }
  return getFirestore();
}

// Prueba mínima para ver que el emulador carga definiciones
exports.ping = onCall(async () => {
  return { ok: true, ts: Date.now() };
});


// --- RESERVA DE STOCK REAL ---
exports.reserveStock = onCall(async (request) => {
  const items = Array.isArray(request?.data?.items) ? request.data.items : [];
  if (!items.length) {
    return { ok: false, error: 'Sin items para reservar.' };
  }
  const uid = request?.auth?.uid || null;
  const db = getDb();
  const reservationRef = db.collection('reservations').doc();
  console.log(
    '[reserveStock] Solicitud:',
    JSON.stringify({ uid, items }),
  );

  try {
    // Resolver referencias de producto por doc.id o por campos alternativos
    // (CODIGO, CODIGO_SKU)
    const resolvedRefs = [];
    for (const i of items) {
      const idStr = String(i.id);
      let ref = db.collection('catalog').doc(idStr);
      const snap = await ref.get();
      if (!snap.exists) {
        const byCodigo = await db.collection('catalog')
          .where('CODIGO', '==', idStr)
          .limit(1)
          .get();
        if (!byCodigo.empty) {
          ref = byCodigo.docs[0].ref;
        } else {
          const bySku = await db.collection('catalog')
            .where('CODIGO_SKU', '==', idStr)
            .limit(1)
            .get();
          if (!bySku.empty) {
            ref = bySku.docs[0].ref;
          } else {
            console.error(
              '[reserveStock] No se encontró producto para id: ' + idStr,
            );
            throw new Error(`Producto no encontrado: ${idStr}`);
          }
        }
      }
      resolvedRefs.push(ref);
    }

    await db.runTransaction(async (tx) => {
      // Leer productos y validar stock
      const productSnaps = await Promise.all(
        resolvedRefs.map((r) => tx.get(r)),
      );

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const snap = productSnaps[idx];
        if (!snap.exists) {
          throw new Error(`Producto no encontrado: ${item.id}`);
        }
        const data = snap.data() || {};
        const disponible = Number.isFinite(Number(data.STOCK_DISPONIBLE))
          ? Number(data.STOCK_DISPONIBLE)
          : 0;
        const cant = Number.isFinite(Number(item.cantidad))
          ? Number(item.cantidad)
          : 1;
        if (disponible < cant) {
          throw new Error(
            `Stock insuficiente para ${item.id}. ` +
            `Disponible ${disponible}, requerido ${cant}`,
          );
        }
      }

      // Descontar stock
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const ref = resolvedRefs[idx];
        const snap = productSnaps[idx];
        const data = snap.data() || {};
        const disponible = Number.isFinite(Number(data.STOCK_DISPONIBLE))
          ? Number(data.STOCK_DISPONIBLE)
          : 0;
        const cant = Number.isFinite(Number(item.cantidad))
          ? Number(item.cantidad)
          : 1;
        tx.update(ref, { STOCK_DISPONIBLE: disponible - cant });
      }

      // Registrar reserva
      tx.set(reservationRef, {
        status: 'active',
        items: items.map((i, idx) => ({
          id: String(resolvedRefs[idx].id),
          cantidad: Number(i.cantidad || 1),
        })),
        uid,
        createdAt: new Date(),
      });
    });

    return { ok: true, reservationId: reservationRef.id };
  } catch (err) {
    console.error('[reserveStock] Error:', err);
    return { ok: false, error: err?.message || 'Fallo al reservar stock' };
  }
});
exports.releaseStock = onCall(async () => {
  return { ok: false, error: 'releaseStock deshabilitada en modo debug' };
});
exports.sendOrderEmail = onCall(async () => {
  return {
    success: false,
    adminEmailSent: false,
    clientEmailSent: false,
    sendgridReady: false,
    error: 'sendOrderEmail deshabilitada en modo debug',
  };
});
/*
exports.reserveStock = onCall(async (request) => {
  const items = Array.isArray(request?.data?.items) ? request.data.items : [];
  if (!items.length) {
    return { ok: false, error: 'Sin items para reservar.' };
  }
  const uid = request?.auth?.uid || null;
  const db = getDb();
  const reservationRef = db.collection('reservations').doc();
  console.log(
    '[reserveStock] Solicitud:',
    JSON.stringify({ uid, items }),
  );

  try {
    // Resolver referencias de producto por doc.id o por campos alternativos
    // (CODIGO, CODIGO_SKU)
    const resolvedRefs = [];
    for (const i of items) {
      const idStr = String(i.id);
      let ref = db.collection('catalog').doc(idStr);
      const snap = await ref.get();
      if (!snap.exists) {
        const byCodigo = await db.collection('catalog')
          .where('CODIGO', '==', idStr)
          .limit(1)
          .get();
        if (!byCodigo.empty) {
          ref = byCodigo.docs[0].ref;
        } else {
          const bySku = await db.collection('catalog')
            .where('CODIGO_SKU', '==', idStr)
            .limit(1)
            .get();
          if (!bySku.empty) {
            ref = bySku.docs[0].ref;
          } else {
            console.error(
              '[reserveStock] No se encontró producto para id: ' + idStr,
            );
            throw new Error(`Producto no encontrado: ${idStr}`);
          }
        }
      }
      resolvedRefs.push(ref);
    }

    await db.runTransaction(async (tx) => {
      // Leer productos y validar stock
      const productSnaps = await Promise.all(
        resolvedRefs.map((r) => tx.get(r)),
      );

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const snap = productSnaps[idx];
        if (!snap.exists) {
          throw new Error(`Producto no encontrado: ${item.id}`);
        }
        const data = snap.data() || {};
        const disponible = Number.isFinite(Number(data.STOCK_DISPONIBLE))
          ? Number(data.STOCK_DISPONIBLE)
          : 0;
        const cant = Number.isFinite(Number(item.cantidad))
          ? Number(item.cantidad)
          : 1;
        if (disponible < cant) {
          throw new Error(
            `Stock insuficiente para ${item.id}. ` +
            `Disponible ${disponible}, requerido ${cant}`,
          );
        }
      }

      // Descontar stock
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const ref = resolvedRefs[idx];
        const snap = productSnaps[idx];
        const data = snap.data() || {};
        const disponible = Number.isFinite(Number(data.STOCK_DISPONIBLE))
          ? Number(data.STOCK_DISPONIBLE)
          : 0;
        const cant = Number.isFinite(Number(item.cantidad))
          ? Number(item.cantidad)
          : 1;
        tx.update(ref, { STOCK_DISPONIBLE: disponible - cant });
      }

      // Registrar reserva
      tx.set(reservationRef, {
        status: 'active',
        items: items.map((i, idx) => ({
          id: String(resolvedRefs[idx].id),
          cantidad: Number(i.cantidad || 1),
        })),
        uid,
        createdAt: new Date(),
      });
    });

    return { ok: true, reservationId: reservationRef.id };
  } catch (err) {
    console.error('[reserveStock] Error:', err);
    return { ok: false, error: err?.message || 'Fallo al reservar stock' };
  }
});

exports.releaseStock = onCall(async (request) => {
  const reservationId = String(request?.data?.reservationId || '');
  if (!reservationId) {
    return { ok: false, error: 'reservationId requerido' };
  }
  const db = getDb();
  const reservationRef = db.collection('reservations').doc(reservationId);
  console.log('[releaseStock] Solicitud:', reservationId);
  const snap = await reservationRef.get();
  if (!snap.exists) {
    return { ok: false, error: 'Reserva no encontrada' };
  }
  const res = snap.data() || {};
  if (res.status !== 'active') {
    return { ok: false, error: 'Reserva no activa' };
  }
  const items = Array.isArray(res.items) ? res.items : [];

  try {
    await db.runTransaction(async (tx) => {
      // Restaurar stock
      for (const item of items) {
        const ref = db.collection('catalog').doc(String(item.id));
        const psnap = await tx.get(ref);
        if (!psnap.exists) continue;
        const pdata = psnap.data() || {};
        const disponible = Number.isFinite(Number(pdata.STOCK_DISPONIBLE))
          ? Number(pdata.STOCK_DISPONIBLE)
          : 0;
        const cant = Number.isFinite(Number(item.cantidad))
          ? Number(item.cantidad)
          : 1;
        tx.update(ref, { STOCK_DISPONIBLE: disponible + cant });
      }
      tx.update(reservationRef, { status: 'released', releasedAt: new Date() });
    });
    return { ok: true };
  } catch (err) {
    console.error('[releaseStock] Error:', err);
    return { ok: false, error: err?.message || 'Fallo al liberar stock' };
  }
});


// Lectura directa desde variables de entorno para simplificar

/**
 * Inicializa SendGrid con API key desde params/env.
 * Si la clave es inválida, registra un aviso y deshabilita emails.
 * @return {boolean} true si SendGrid quedó listo; false en caso contrario.
 */
function ensureSendgridInitialized() {
  // Lazy-load para evitar fallos en inicialización del módulo
  if (!sgMail) {
    try {
      sgMail = require("@sendgrid/mail");
    } catch (e) {
      console.warn(
        "[@sendgrid/mail] no instalado; " +
        "sendgridReady=false (modo local)",
      );
      return false;
    }
  }
  const key = process.env.SENDGRID_API_KEY;
  if (!key || !key.startsWith("SG.")) {
    console.warn("SENDGRID_API_KEY inválida; emails deshabilitados");
    return false;
  }
  sgMail.setApiKey(key);
  return true;
}


/**
 * Envía correos de confirmación del pedido (empresa y cliente).
 * Cloud Function HTTPS callable v2.
 * @param {{data: Object}} request Objeto con datos del pedido en `data`.
 * @return {Promise<{success: boolean, adminEmailSent: boolean,
 * clientEmailSent: boolean, sendgridReady: boolean}>>} Resultado.
 */
exports.sendOrderEmail = onCall(async (request) => {
  const sendgridReady = ensureSendgridInitialized();
  const orderData = (
    request && request.data && typeof request.data === "object"
  ) ? request.data : {};
  const uid = (request && request.auth && request.auth.uid)
    ? request.auth.uid
    : null;
  const {
    orderId,
    timestamp,
    email,
    nombre,
    telefono,
    items,
    total,
    empresaEmail,
    empresaNombre,
    moneda,
    logoUrl,
    siteUrl,
    whatsappUrl,
    reservationId,
  } = orderData;
  const totalNumber = Number(total);
  const totalDisplay = isNaN(totalNumber) ? "0.00" : totalNumber.toFixed(2);
  const fromAddress = (
    process.env.SENDGRID_FROM || empresaEmail
  );
  const asuntoCliente =
    "✅ Confirmación y Recibo de su Pedido - " + empresaNombre;
  const sandbox = String(process.env.SENDGRID_SANDBOX || "false") === "true";

  // Construcción de tabla para admin
  let tablaItemsAdmin =
    "<table style='width:100%;border-collapse:collapse;" +
    "font-family:Arial,sans-serif;font-size:14px;'>" +
    "<thead><tr style='background-color:#e0e0e0;'>" +
    "<th style='text-align:left;padding:8px;border-bottom:1px solid #ddd;" +
    "background-color:#e0e0e0;'>PRODUCTO</th>" +
    "<th style='text-align:right;padding:8px;border-bottom:1px solid #ddd;" +
    "background-color:#e0e0e0;'>UNITARIO</th>" +
    "<th style='text-align:right;padding:8px;border-bottom:1px solid #ddd;" +
    "background-color:#e0e0e0;'>CANT</th>" +
    "<th style='text-align:right;padding:8px;border-bottom:1px solid #ddd;" +
    "background-color:#e0e0e0;'>TOTAL</th>" +
    "</tr></thead><tbody>";
  const safeItems = Array.isArray(items) ? items : [];
  safeItems.forEach((item) => {
    tablaItemsAdmin += "<tr>" +
      "<td style='padding:4px 8px;border-bottom:1px dotted #eee;" +
      "text-align:left;'>" + item.nombre + "</td>" +
      "<td style='padding:4px 8px;border-bottom:1px dotted #eee;" +
      "text-align:right;'>" + item.precioUnitario + " " + moneda + "</td>" +
      "<td style='padding:4px 8px;border-bottom:1px dotted #eee;" +
      "text-align:right;'>" + item.cantidad + "</td>" +
      "<td style='padding:4px 8px;border-bottom:1px dotted #eee;" +
      "text-align:right;font-weight:bold;'>" +
      (Number(item.totalProducto) || 0).toFixed(2) + " " + moneda + "</td>" +
      "</tr>";
  });
  tablaItemsAdmin += "</tbody></table>";

  // Email para el administrador
  const asuntoAdmin =
    "🛒 Pedido PROCESADO #" + orderId + " de " + nombre +
    " (" + totalDisplay + " " + moneda + ")";
  const cuerpoAdminHTML =
    "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;" +
    "border:2px solid #333;padding:20px;background-color:#f7f7f7;" +
    "border-radius:8px;'>" +
    "<h3 style='color:#4CAF50;border-bottom:2px solid #4CAF50;" +
    "padding-bottom:8px;'>🛒 PEDIDO PROCESADO #" + orderId + "</h3>" +
    "<h4 style='border-bottom:1px solid #ddd;padding-bottom:5px;" +
    "margin-top:20px;'>DATOS DEL CLIENTE</h4>" +
    "<ul style='list-style:none;padding:0;'>" +
    "<li><strong>Nombre:</strong> " + nombre + "</li>" +
    "<li><strong>Email:</strong> <a href='mailto:" + email + "'>" +
    email + "</a></li>" +
    "<li><strong>Teléfono:</strong> " + telefono + "</li>" +
    "</ul>" +
    "<h4 style='border-bottom:1px solid #ddd;padding-bottom:5px;" +
    "margin-top:20px;'>ITEMS ORDENADOS</h4>" +
    tablaItemsAdmin +
    "<div style='text-align:right;padding:10px 0 0 0;" +
    "border-top:2px solid #333;margin-top:5px;'>" +
    "<p style='margin:0;font-size:1.1em;'><strong>TOTAL A COBRAR:</strong> " +
    "<span style='color:#C00;font-size:1.3em;'>" +
    totalDisplay + " " + moneda + "</span></p>" +
    "</div>" +
    "<p style='margin-top:30px;font-size:0.8em;color:#555;'>" +
    "Procesado y Registrado a las " +
    new Date(timestamp).toLocaleString() + "</p>" +
    "</div>";

  // Email para el cliente
  let tablaProductosHTML =
    "<tr style='background-color:#f2f2f2;'>" +
    "<th style='text-align:left;padding:8px;border:1px solid #ddd;'>" +
    "Producto</th>" +
    "<th style='text-align:right;padding:8px;border:1px solid #ddd;'>" +
    "Costo Unitario</th>" +
    "<th style='text-align:right;padding:8px;border:1px solid #ddd;'>" +
    "Cantidad</th>" +
    "<th style='text-align:right;padding:8px;border:1px solid #ddd;'>" +
    "Total Producto</th>" +
    "</tr>";
  safeItems.forEach((item) => {
    tablaProductosHTML += "<tr>" +
      "<td style='padding:8px;border:1px solid #ddd;'>" +
      item.nombre + "</td>" +
      "<td style='text-align:right;padding:8px;border:1px solid #ddd;'>" +
      item.precioUnitario + " " + moneda + "</td>" +
      "<td style='text-align:right;padding:8px;border:1px solid #ddd;'>" +
      item.cantidad + "</td>" +
      "<td style='text-align:right;padding:8px;border:1px solid #ddd;" +
      "font-weight:bold;'>" +
      (Number(item.totalProducto) || 0).toFixed(2) + " " + moneda +
      "</td>" +
      "</tr>";
  });
  const cuerpoClienteHTML =
    "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;" +
    "border:1px solid #ddd;border-radius:8px;padding:20px;" +
    "background-color:#fff;'>" +
    (logoUrl ? ("<div style='text-align:center;margin-bottom:12px;'>" +
      "<img alt='" + (empresaNombre || "Begam") + "' src='" + logoUrl + "' " +
      "style='max-width:128px;border-radius:8px;" +
      "display:inline-block;' /></div>") : "") +
    "<h2 style='color:#4CAF50;text-align:center;" +
    "border-bottom:2px solid #4CAF50;" +
    "padding-bottom:10px;'>✅ Pedido Confirmado - " + empresaNombre + "</h2>" +
    "<p style='text-align:center;color:#555;'>" +
    "<strong>Referencia de Pedido:</strong> " +
    orderId + "</p>" +
    "<p style='margin-top:15px;'>Gracias por su compra, " + nombre + ". " +
    "Hemos recibido su orden y la estamos procesando.</p>" +
    "<h3 style='margin-top:25px;'>Detalles de la Orden</h3>" +
    "<table style='width:100%;border-collapse:collapse;margin-bottom:20px;'>" +
    tablaProductosHTML +
    "</table>" +
    "<div style='text-align:right;padding:15px;border-top:3px solid #4CAF50;" +
    "background-color:#f2fff2;border-radius:0 0 8px 8px;'>" +
    "<h3 style='margin:0;'>TOTAL A PAGAR: <span style='color:#007000;" +
    "font-size:1.3em;'>" + totalDisplay + " " + moneda + "</span></h3>" +
    "</div>" +
    "<p style='margin-top:20px;text-align:center;'>" +
    "Nos pondremos en contacto contigo " +
    "en las próximas horas al teléfono <strong>" + telefono + "</strong> " +
    "para coordinar el pago y la entrega.</p>" +
    "<div style='text-align:center;margin-top:16px;'>" +
    (siteUrl ? (
      "<a href='" + siteUrl + "' " +
      "style='display:inline-block;background:#2563eb;color:#fff;" +
      "text-decoration:none;padding:10px 14px;border-radius:8px;" +
      "font-size:14px;margin-right:8px;'>Ver sitio</a>"
    ) : "") +
    (whatsappUrl ? (
      "<a href='" + whatsappUrl + "' " +
      "style='display:inline-block;background:#10b981;color:#fff;" +
      "text-decoration:none;padding:10px 14px;border-radius:8px;" +
      "font-size:14px;'>WhatsApp</a>"
    ) : "") +
    "</div>" +
    "<p style='margin-top:20px;text-align:center;'>Atentamente,<br>" +
    empresaNombre + "</p>" +
    "</div>";

  // Enviar email al admin
  let adminEmailSent = false;
  if (sendgridReady) {
    try {
      await sgMail.send({
        to: empresaEmail,
        from: fromAddress,
        replyTo: empresaEmail,
        subject: asuntoAdmin,
        html: cuerpoAdminHTML,
        mailSettings: {sandboxMode: {enable: sandbox}},
      });
      adminEmailSent = true;
    } catch (err) {
      const adminErrMsg = err && err.message ? err.message : err;
      console.error("Error enviando email admin:", adminErrMsg);
    }
  }

  // Enviar email al cliente
  let clientEmailSent = false;
  if (
    sendgridReady &&
    email &&
    email.indexOf("@") !== -1 &&
    !email.includes("@nodisponible.com")
  ) {
    try {
      await sgMail.send({
        to: email,
        from: fromAddress,
        replyTo: empresaEmail,
        subject: asuntoCliente,
        html: cuerpoClienteHTML,
        mailSettings: {sandboxMode: {enable: sandbox}},
      });
      clientEmailSent = true;
    } catch (err) {
      const clientErrMsg = err && err.message ? err.message : err;
      console.error("Error enviando email cliente:", clientErrMsg);
    }
  }

  // Registrar orden en Firestore y marcar reserva como consumida
  try {
    const db = getDb();
    const safeOrderId = String(orderId || Date.now());
    const orderRef = db.collection("orders").doc(safeOrderId);
    await orderRef.set({
      orderId: safeOrderId,
      reservationId: reservationId ? String(reservationId) : null,
      status: "confirmed",
      createdAt: new Date(timestamp || Date.now()),
      uid: uid || null,
      customer: {
        email: email || "",
        nombre: nombre || "",
        telefono: telefono || "",
      },
      items: Array.isArray(items) ? items : [],
      total: Number(total) || 0,
      moneda: moneda || "USD",
      emailResults: {
        sendgridReady: !!sendgridReady,
        adminEmailSent: !!adminEmailSent,
        clientEmailSent: !!clientEmailSent,
      },
      empresa: {
        nombre: empresaNombre || "",
        email: empresaEmail || "",
        logoUrl: logoUrl || "",
        siteUrl: siteUrl || "",
        whatsappUrl: whatsappUrl || "",
      },
    }, { merge: true });

    if (reservationId) {
      const resRef = db.collection("reservations").doc(String(reservationId));
      await resRef.set({
        status: "consumed",
        consumedAt: new Date(),
        orderId: safeOrderId,
      }, { merge: true });
    }
  } catch (persistErr) {
    console.warn(
      "[sendOrderEmail] No se pudo registrar la orden " +
      "o actualizar la reserva:",
      persistErr,
    );
  }

  return {
    success: true,
    adminEmailSent,
    clientEmailSent,
    sendgridReady,
    orderId,
    reservationId,
  };
});
 
