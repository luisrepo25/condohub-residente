/** «dd/mm/aaaa» a partir de una fecha ISO (yyyy-MM-dd); solo texto, sin `Date`. El formateo es de la capa de interfaz. */
export const fechaLegible = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
