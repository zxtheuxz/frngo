/**
 * Normaliza valores de altura para metros
 * 
 * Esta função detecta automaticamente se a altura está em metros ou centímetros
 * e sempre retorna o valor em metros.
 * 
 * @param altura - Altura que pode estar em metros ou centímetros (string ou number)
 * @returns Altura em metros
 * 
 * @example
 * normalizarAltura("1.71") // retorna 1.71 (já em metros)
 * normalizarAltura(1.71) // retorna 1.71 (já em metros)
 * normalizarAltura("171") // retorna 1.71 (converte de cm para m)
 * normalizarAltura(171) // retorna 1.71 (converte de cm para m)
 * normalizarAltura("170") // retorna 1.70 (converte de cm para m)
 */
export function normalizarAltura(altura: string | number | undefined | null): number {
  if (!altura) {
    return 1.70; // Valor padrão em metros
  }

  // Converter para número se for string
  const alturaNum = typeof altura === 'string' ? parseFloat(altura) : altura;

  // Se o valor não for válido, retornar valor padrão
  if (isNaN(alturaNum) || alturaNum <= 0) {
    return 1.70;
  }

  // Se altura for menor que 10, assumir que já está em metros
  // (é improvável alguém ter menos de 10 cm ou mais de 10 metros de altura)
  if (alturaNum < 10) {
    return alturaNum;
  }

  // Se altura for maior ou igual a 10, assumir que está em centímetros e converter
  return alturaNum / 100;
}

/**
 * Normaliza valores de altura para centímetros
 * 
 * Esta função detecta automaticamente se a altura está em metros ou centímetros
 * e sempre retorna o valor em centímetros.
 * 
 * @param altura - Altura que pode estar em metros ou centímetros (string ou number)
 * @returns Altura em centímetros
 * 
 * @example
 * normalizarAlturaCm("1.71") // retorna 171 (converte de m para cm)
 * normalizarAlturaCm(1.71) // retorna 171 (converte de m para cm)
 * normalizarAlturaCm("171") // retorna 171 (já em cm)
 * normalizarAlturaCm(171) // retorna 171 (já em cm)
 */
export function normalizarAlturaCm(altura: string | number | undefined | null): number {
  if (!altura) {
    return 170; // Valor padrão em centímetros
  }

  // Converter para número se for string
  const alturaNum = typeof altura === 'string' ? parseFloat(altura) : altura;

  // Se o valor não for válido, retornar valor padrão
  if (isNaN(alturaNum) || alturaNum <= 0) {
    return 170;
  }

  // Se altura for menor que 10, assumir que está em metros e converter para cm
  if (alturaNum < 10) {
    return alturaNum * 100;
  }

  // Se altura for maior ou igual a 10, assumir que já está em centímetros
  return alturaNum;
}