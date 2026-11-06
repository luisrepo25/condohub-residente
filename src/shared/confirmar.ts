export interface OpcionesConfirmacion {
  aceptar: string;
  volver?: string;
  peligro?: boolean;
}

function crearBoton(texto: string, clase: string, alPulsar: () => void): HTMLButtonElement {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = texto;
  boton.className = clase;
  boton.onclick = alPulsar;
  return boton;
}

/** Pide confirmación en un diálogo propio; si el navegador no tiene `<dialog>`, usa el confirm nativo. Esc o «Volver» cancelan. */
export function confirmar(mensaje: string, opciones: OpcionesConfirmacion): Promise<boolean> {
  const dialogo = document.createElement('dialog');
  if (typeof dialogo.showModal !== 'function') return Promise.resolve(window.confirm(mensaje));
  return new Promise((resolver) => {
    let aceptado = false;
    dialogo.className = 'ch-dialogo';
    const texto = document.createElement('p');
    texto.textContent = mensaje;
    const acciones = document.createElement('div');
    acciones.className = 'ch-dialogo-acciones';
    const volver = crearBoton(opciones.volver ?? 'Volver', 'ch-boton ch-boton--suave', () => dialogo.close());
    const aceptar = crearBoton(opciones.aceptar, opciones.peligro ? 'ch-boton-peligro' : 'ch-boton', () => {
      aceptado = true;
      dialogo.close();
    });
    dialogo.onclose = () => {
      dialogo.remove();
      resolver(aceptado);
    };
    acciones.append(volver, aceptar);
    dialogo.append(texto, acciones);
    document.body.append(dialogo);
    dialogo.showModal();
    volver.focus();
  });
}
