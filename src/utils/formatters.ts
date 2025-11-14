export const currency = (value: number, locale = "pt-BR", currency = "BRL") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

export const dateBR = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");

