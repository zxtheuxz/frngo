#!/usr/bin/env node

/**
 * Script para substituir DYNAMIC_TIMESTAMP_PLACEHOLDER no index.html durante build
 * Também gera hash único baseado no conteúdo para cache busting ultra-agressivo
 * Uso: node replace-timestamp.js
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, 'dist', 'index.html');
const distPath = path.join(__dirname, 'dist');

// Função para gerar hash do conteúdo dos arquivos
function generateContentHash() {
  const hash = crypto.createHash('md5');

  try {
    // Ler todos os arquivos JS e CSS para gerar hash único
    const files = fs.readdirSync(path.join(distPath, 'assets'), { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .filter(dirent => dirent.name.endsWith('.js') || dirent.name.endsWith('.css'))
      .map(dirent => dirent.name);

    for (const file of files) {
      const filePath = path.join(distPath, 'assets', file);
      const content = fs.readFileSync(filePath, 'utf8');
      hash.update(content);
    }

    // Adicionar timestamp para garantir unicidade
    hash.update(Date.now().toString());

    return hash.digest('hex').substring(0, 8);
  } catch (error) {
    console.warn('⚠️ Erro gerando hash de conteúdo, usando timestamp:', error.message);
    return Date.now().toString(36);
  }
}

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  const timestamp = Date.now();
  const contentHash = generateContentHash();
  const uniqueVersion = `${timestamp}-${contentHash}`;

  console.log(`🔄 Processando cache busting...`);
  console.log(`📅 Timestamp: ${timestamp}`);
  console.log(`🔑 Content Hash: ${contentHash}`);
  console.log(`🆔 Version ID: ${uniqueVersion}`);

  // Substituir o placeholder pelo timestamp atual
  content = content.replace(/DYNAMIC_TIMESTAMP_PLACEHOLDER/g, timestamp);

  // Adicionar meta tag com hash de conteúdo para detecção mais robusta
  const buildVersionMeta = content.match(/<meta name="build-version" content="([^"]*)" \/>/);
  if (buildVersionMeta) {
    const newVersion = `${buildVersionMeta[1]}-${contentHash}`;
    content = content.replace(
      buildVersionMeta[0],
      `<meta name="build-version" content="${newVersion}" />`
    );
    console.log(`📝 Build version atualizada: ${newVersion}`);
  }

  // Adicionar meta tag com ID único do deploy
  const deployIdMeta = `<meta name="deploy-id" content="${uniqueVersion}" />`;
  content = content.replace(
    '<meta name="build-timestamp" content="' + timestamp + '" />',
    '<meta name="build-timestamp" content="' + timestamp + '" />\n    ' + deployIdMeta
  );

  // Adicionar query string nos assets para forçar reload
  content = content.replace(
    /src="([^"]*\.(js|css))"/g,
    `src="$1?v=${uniqueVersion}"`
  );

  content = content.replace(
    /href="([^"]*\.(css))"/g,
    `href="$1?v=${uniqueVersion}"`
  );

  fs.writeFileSync(indexPath, content, 'utf8');
  console.log(`✅ Cache busting aplicado com sucesso!`);
  console.log(`🎯 Deploy ID: ${uniqueVersion}`);
} else {
  console.log('⚠️ dist/index.html não encontrado. Execute npm run build primeiro.');
}