'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

// Propiedades para el renderizado de expresiones matemáticas en formato LaTeX mediante KaTeX
interface MathBlockProps {
  math: string;       // Expresión matemática en sintaxis LaTeX
  block?: boolean;    // Si es true, se renderiza en modo bloque centrado; si es false, en línea
  className?: string; // Clases CSS adicionales opcionales
}

/**
 * Componente reutilizable que compila y muestra expresiones matemáticas LaTeX usando KaTeX.
 */
export function MathBlock({ math, block = false, className = '' }: MathBlockProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `<code>${math}</code>`;
    }
  }, [math, block]);

  return (
    <span
      className={`inline-block font-serif ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
