#!/usr/bin/env node

/**
 * Script para verificar se as variáveis de ambiente foram corretamente
 * embarcadas no build da aplicação Vite
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando se as variáveis de ambiente estão no build...\n');

const distPath = path.join(__dirname, 'dist');

if (!fs.existsSync(distPath)) {
    console.log('❌ Pasta dist/ não encontrada. Execute npm run build primeiro.');
    process.exit(1);
}

// Procurar por arquivos JS no build
const files = fs.readdirSync(distPath, { recursive: true });
const jsFiles = files.filter(file => file.endsWith('.js'));

console.log(`📁 Encontrados ${jsFiles.length} arquivos JS no build:`);
jsFiles.forEach(file => console.log(`   - ${file}`));

let foundSupabaseUrl = false;
let foundSupabaseKey = false;

// Verificar cada arquivo JS
for (const file of jsFiles) {
    const filePath = path.join(distPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Procurar pela URL do Supabase
    if (content.includes('nbzblkwylsgnafsegzot.supabase.co')) {
        foundSupabaseUrl = true;
        console.log(`✅ URL Supabase encontrada em: ${file}`);
    }
    
    // Procurar pela chave do Supabase (apenas parte dela para não expor)
    if (content.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
        foundSupabaseKey = true;
        console.log(`✅ Chave Supabase encontrada em: ${file}`);
    }
}

console.log('\n📊 Resultado da verificação:');
console.log(`   URL Supabase: ${foundSupabaseUrl ? '✅ OK' : '❌ NÃO ENCONTRADA'}`);
console.log(`   Chave Supabase: ${foundSupabaseKey ? '✅ OK' : '❌ NÃO ENCONTRADA'}`);

if (foundSupabaseUrl && foundSupabaseKey) {
    console.log('\n🎉 Todas as variáveis foram encontradas no build!');
    console.log('   O problema pode estar na execução do container.');
    process.exit(0);
} else {
    console.log('\n❌ Variáveis de ambiente não foram embarcadas no build.');
    console.log('   Verifique se as variáveis foram passadas corretamente no docker build.');
    process.exit(1);
}