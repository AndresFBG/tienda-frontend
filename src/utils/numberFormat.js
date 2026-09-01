export function formatNumberInput(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('es-CL') : '';
}

export function parseNumberInput(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}
