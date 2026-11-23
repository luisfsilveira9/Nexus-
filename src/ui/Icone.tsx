// Ícone de linha da arte (`*_linha.svg`, traço em currentColor) usado como máscara CSS: assim ele
// herda a cor do texto do componente (guia visual §5) sem copiar o SVG para o código.
import type { CSSProperties } from 'react';
import css from './jogo.module.css';

export function Icone({ src, tamanho = 24 }: { src: string; tamanho?: number }) {
  const mascara = `url("${src}")`;
  const estilo: CSSProperties = {
    width: tamanho,
    height: tamanho,
    WebkitMaskImage: mascara,
    maskImage: mascara,
  };
  return <span className={css.icone} style={estilo} aria-hidden="true" />;
}
