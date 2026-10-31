// Entrada de compilación del contenedor de Module Federation. El módulo que se expone al shell es `./remote` (src/remote.tsx):
// si ese mismo archivo fuera también la entrada, en Linux (Docker, CI, la nube) Rollup lo fusionaría con el contenedor y el
// plugin dejaría sin resolver el marcador `__federation_expose_`. Por eso la entrada es este archivo vacío.
export {};
