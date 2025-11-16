import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

const testEdgeFunctionReliability = async () => {
  console.log('🧪 Iniciando testes de confiabilidade das Edge Functions...\n');
  
  const results: TestResult[] = [];
  
  // Teste 1: Chamada não autenticada (deve falhar)
  console.log('📝 Teste 1: Tentativa não autenticada');
  const test1Start = Date.now();
  try {
    const response = await supabase.functions.invoke('create-user', {
      body: {
        email: 'test@test.com',
        password: 'Test@123',
        full_name: 'Test User',
        permissions: {}
      }
    });
    
    results.push({
      name: 'Chamada não autenticada',
      success: response.error !== null, // Deve ter erro
      duration: Date.now() - test1Start,
      error: response.error ? 'Esperado: ' + response.error.message : 'Erro: deveria ter falhado'
    });
  } catch (error: any) {
    results.push({
      name: 'Chamada não autenticada',
      success: true, // Erro é esperado
      duration: Date.now() - test1Start,
      error: 'Esperado: ' + error.message
    });
  }
  
  // Teste 2: Login e tentativa autenticada
  console.log('\n📝 Teste 2: Login e chamada autenticada');
  const test2Start = Date.now();
  try {
    // Tentar fazer login (precisa de credenciais válidas no .env)
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@malta.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    if (authError) {
      results.push({
        name: 'Login para teste',
        success: false,
        duration: Date.now() - test2Start,
        error: authError.message
      });
    } else {
      console.log('✅ Login realizado com sucesso');
      
      // Tentar criar usuário
      const createUserStart = Date.now();
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: `test-${Date.now()}@test.com`,
          password: 'Test@123456',
          full_name: 'Test User Automated',
          permissions: {
            is_active: true,
            can_access_main_menu: true,
            can_access_admin: false,
            can_view_products: true,
            can_create_reports: false,
            can_view_reports: false,
            can_create_withdrawals: false,
            can_view_withdrawal_history: false,
            can_edit_products: false,
            can_delete_products: false,
            can_edit_reports: false,
            can_delete_reports: false,
            can_access_assets: false,
            can_create_assets: false,
            can_edit_assets: false,
            can_delete_assets: false,
            can_scan_assets: false,
          }
        }
      });
      
      results.push({
        name: 'Criar usuário (autenticado)',
        success: !response.error && !response.data?.error,
        duration: Date.now() - createUserStart,
        error: response.error?.message || response.data?.error
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Login e criação de usuário',
      success: false,
      duration: Date.now() - test2Start,
      error: error.message
    });
  }
  
  // Teste 3: Múltiplas chamadas simultâneas (stress test)
  console.log('\n📝 Teste 3: Múltiplas chamadas simultâneas');
  const test3Start = Date.now();
  try {
    const promises = Array.from({ length: 10 }, (_, i) => 
      supabase.functions.invoke('n8n-api', {
        body: { endpoint: 'test', index: i }
      })
    );
    
    const responses = await Promise.allSettled(promises);
    const successCount = responses.filter(r => r.status === 'fulfilled').length;
    
    results.push({
      name: 'Múltiplas chamadas simultâneas (10x)',
      success: successCount >= 8, // Pelo menos 80% de sucesso
      duration: Date.now() - test3Start,
      error: `${successCount}/10 chamadas bem-sucedidas`
    });
  } catch (error: any) {
    results.push({
      name: 'Múltiplas chamadas simultâneas',
      success: false,
      duration: Date.now() - test3Start,
      error: error.message
    });
  }
  
  // Resumo dos resultados
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`\n${icon} ${result.name}`);
    console.log(`   Duração: ${result.duration}ms`);
    if (result.error) {
      console.log(`   Detalhes: ${result.error}`);
    }
  });
  
  const totalSuccess = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`✨ Resultado Final: ${totalSuccess}/${totalTests} testes passaram`);
  console.log('='.repeat(60));
  
  // Retornar código de saída apropriado
  process.exit(totalSuccess === totalTests ? 0 : 1);
};

// Executar testes
testEdgeFunctionReliability().catch(error => {
  console.error('❌ Erro ao executar testes:', error);
  process.exit(1);
});
