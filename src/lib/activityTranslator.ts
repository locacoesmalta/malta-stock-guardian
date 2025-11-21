interface ActivityContext {
  table_name: string;
  action: string;
  new_data?: any;
  old_data?: any;
}

/**
 * Traduz logs técnicos em mensagens amigáveis
 */
export function translateActivity(context: ActivityContext): string {
  const { table_name, action, new_data, old_data } = context;

  // Assets (Patrimônio)
  if (table_name === 'assets') {
    const pat = new_data?.asset_code || old_data?.asset_code || '----';
    const equipmentName = new_data?.equipment_name || old_data?.equipment_name || '';
    
    if (action === 'INSERT') {
      return `Cadastrou patrimônio PAT ${pat} - ${equipmentName}`;
    }
    
    if (action === 'UPDATE') {
      // Movimentação
      if (old_data?.location_type !== new_data?.location_type) {
        const oldLoc = translateLocation(old_data?.location_type);
        const newLoc = translateLocation(new_data?.location_type);
        return `Moveu PAT ${pat} de ${oldLoc} para ${newLoc}`;
      }
      
      // Substituição
      if (new_data?.was_replaced && !old_data?.was_replaced) {
        return `Substituiu PAT ${pat} - ${equipmentName}`;
      }
      
      // Edição genérica
      return `Editou patrimônio PAT ${pat}`;
    }
    
    if (action === 'DELETE') {
      return `Excluiu patrimônio PAT ${pat}`;
    }
  }

  // Reports (Relatórios)
  if (table_name === 'reports') {
    const pat = new_data?.equipment_code || old_data?.equipment_code || '----';
    const workSite = new_data?.work_site || old_data?.work_site || '';
    
    if (action === 'INSERT') {
      return `Criou relatório de manutenção - PAT ${pat} - Obra: ${workSite}`;
    }
    
    if (action === 'UPDATE') {
      return `Editou relatório - PAT ${pat}`;
    }
    
    if (action === 'DELETE') {
      return `Excluiu relatório - PAT ${pat}`;
    }
  }

  // Material Withdrawals (Retiradas)
  if (table_name === 'material_withdrawals') {
    const pat = new_data?.equipment_code || old_data?.equipment_code || '----';
    const qty = new_data?.quantity || old_data?.quantity || 0;
    
    if (action === 'INSERT') {
      return `Retirou material - PAT ${pat} - ${qty} unidades`;
    }
    
    if (action === 'UPDATE') {
      // Marcou como usado em relatório
      if (new_data?.used_in_report_id && !old_data?.used_in_report_id) {
        return `Vinculou retirada ao relatório - PAT ${pat}`;
      }
      
      // Arquivou retirada
      if (new_data?.is_archived && !old_data?.is_archived) {
        return `Arquivou retirada - PAT ${pat}`;
      }
      
      return `Editou retirada - PAT ${pat}`;
    }
    
    if (action === 'DELETE') {
      return `Excluiu retirada - PAT ${pat}`;
    }
  }

  // Products (Produtos)
  if (table_name === 'products') {
    const name = new_data?.name || old_data?.name || '';
    const code = new_data?.code || old_data?.code || '';
    
    if (action === 'INSERT') {
      return `Cadastrou produto: ${name} (${code})`;
    }
    
    if (action === 'UPDATE') {
      // Ajuste de estoque
      if (old_data?.quantity !== new_data?.quantity) {
        const diff = (new_data?.quantity || 0) - (old_data?.quantity || 0);
        return `Ajustou estoque: ${name} (${diff > 0 ? '+' : ''}${diff})`;
      }
      
      return `Editou produto: ${name}`;
    }
    
    if (action === 'DELETE') {
      return `Excluiu produto: ${name}`;
    }
  }

  // User Permissions (Permissões)
  if (table_name === 'user_permissions') {
    if (action === 'INSERT') {
      return 'Configurou permissões de usuário';
    }
    
    if (action === 'UPDATE') {
      return 'Alterou permissões de usuário';
    }
    
    if (action === 'DELETE') {
      return 'Removeu permissões de usuário';
    }
  }

  // Equipment Receipts (Comprovantes)
  if (table_name === 'equipment_receipts') {
    const receiptNum = new_data?.receipt_number || old_data?.receipt_number || '';
    const type = new_data?.receipt_type || old_data?.receipt_type || '';
    
    if (action === 'INSERT') {
      return `Criou comprovante de ${type === 'entrega' ? 'entrega' : 'devolução'} #${receiptNum}`;
    }
    
    if (action === 'UPDATE') {
      return `Editou comprovante #${receiptNum}`;
    }
    
    if (action === 'DELETE') {
      return `Excluiu comprovante #${receiptNum}`;
    }
  }

  // Asset Maintenances (Manutenções)
  if (table_name === 'asset_maintenances') {
    if (action === 'INSERT') {
      return 'Registrou manutenção de equipamento';
    }
    
    if (action === 'UPDATE') {
      return 'Editou registro de manutenção';
    }
    
    if (action === 'DELETE') {
      return 'Excluiu registro de manutenção';
    }
  }

  // Cash Box (Caixa)
  if (table_name === 'cash_boxes') {
    if (action === 'INSERT') {
      return 'Abriu caixa';
    }
    
    if (action === 'UPDATE') {
      return 'Editou caixa';
    }
  }

  if (table_name === 'cash_box_transactions') {
    const type = new_data?.type || old_data?.type || '';
    const value = new_data?.value || old_data?.value || 0;
    
    if (action === 'INSERT') {
      return `Registrou ${type === 'entrada' ? 'entrada' : 'saída'} no caixa: R$ ${value.toFixed(2)}`;
    }
    
    if (action === 'UPDATE') {
      return `Editou transação do caixa`;
    }
    
    if (action === 'DELETE') {
      return `Excluiu transação do caixa`;
    }
  }

  // Rental Companies (Empresas de Locação)
  if (table_name === 'rental_companies') {
    const name = new_data?.company_name || old_data?.company_name || '';
    
    if (action === 'INSERT') {
      return `Cadastrou empresa de locação: ${name}`;
    }
    
    if (action === 'UPDATE') {
      return `Editou empresa de locação: ${name}`;
    }
    
    if (action === 'DELETE') {
      return `Excluiu empresa de locação: ${name}`;
    }
  }

  // Fallback genérico
  const actionLabel = action === 'INSERT' ? 'Criou' : action === 'UPDATE' ? 'Editou' : 'Excluiu';
  const tableFriendly = table_name?.replace(/_/g, ' ') || 'registro';
  return `${actionLabel} ${tableFriendly}`;
}

/**
 * Traduz tipos de localização
 */
function translateLocation(locationType?: string): string {
  if (!locationType) return 'desconhecido';
  
  const translations: Record<string, string> = {
    'obra': 'obra',
    'deposito': 'depósito',
    'manutencao': 'manutenção',
    'locacao': 'locação',
    'malta': 'malta',
  };
  
  return translations[locationType] || locationType;
}

/**
 * Obtém emoji representativo da ação
 */
export function getActionEmoji(action: string): string {
  switch (action) {
    case 'INSERT':
      return '🟢';
    case 'UPDATE':
      return '🔵';
    case 'DELETE':
      return '🔴';
    default:
      return '⚪';
  }
}

/**
 * Obtém cor representativa da ação
 */
export function getActionColor(action: string): string {
  switch (action) {
    case 'INSERT':
      return 'text-green-600 dark:text-green-400';
    case 'UPDATE':
      return 'text-blue-600 dark:text-blue-400';
    case 'DELETE':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Traduz ação para label amigável
 */
export function translateAction(action: string): string {
  switch (action) {
    case 'INSERT':
      return 'Criou';
    case 'UPDATE':
      return 'Editou';
    case 'DELETE':
      return 'Excluiu';
    default:
      return action;
  }
}
