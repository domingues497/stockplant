export const isCEP = (v: string) => /^\d{5}-?\d{3}$/.test(v.replace(/\D/g, ""));
export const isEmail = (v: string) => /.+@.+\..+/.test(v);

