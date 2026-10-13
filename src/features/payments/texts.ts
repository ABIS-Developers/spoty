export const paymentsTexts = {
  history: {
    title: "Historial de pagos",
    emptyTitle: "Sin pagos registrados",
    emptyDescription: "Los pagos que registres aparecerán aquí, del más reciente al más antiguo.",
    paidOn: "Pagado el",
  },
  strip: {
    title: "Últimos 12 meses",
    states: {
      PAID: "Pagado",
      PENDING: "Pendiente",
      OVERDUE: "Vencido",
      NOT_APPLICABLE: "No aplica",
    },
  },
  form: {
    title: "Registrar pago",
    open: "Registrar pago",
    period: "Mes que paga",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    paidAt: "Fecha de pago",
    amount: "Monto",
    save: "Registrar pago",
    saveError: "No se pudo registrar el pago. Intenta de nuevo.",
    errors: {
      duplicate: "Ya hay un pago registrado para ese mes",
      paidAtRequired: "Elige la fecha de pago",
      amountInvalid: "Escribe un monto entero, sin decimales",
    },
  },
} as const;
