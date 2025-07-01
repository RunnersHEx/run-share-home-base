
// Sistema de backup para datos críticos del usuario
import { supabase } from "@/integrations/supabase/client";

interface BackupData {
  profile: any;
  properties: any[];
  races: any[];
  bookings: any[];
  timestamp: string;
}

export class BackupService {
  static async createUserBackup(userId: string): Promise<BackupData | null> {
    try {
      // Obtener datos del perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Obtener propiedades del usuario
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', userId);

      // Obtener carreras del usuario
      const { data: races } = await supabase
        .from('races')
        .select('*')
        .eq('host_id', userId);

      // Obtener bookings del usuario
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .or(`guest_id.eq.${userId},host_id.eq.${userId}`);

      return {
        profile,
        properties: properties || [],
        races: races || [],
        bookings: bookings || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  }

  static async downloadBackup(userId: string): Promise<void> {
    const backup = await this.createUserBackup(userId);
    
    if (!backup) {
      throw new Error('No se pudo crear el backup');
    }

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `runners-home-exchange-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }

  static validateBackup(backupData: any): boolean {
    return (
      backupData &&
      typeof backupData === 'object' &&
      backupData.timestamp &&
      backupData.profile &&
      Array.isArray(backupData.properties) &&
      Array.isArray(backupData.races) &&
      Array.isArray(backupData.bookings)
    );
  }
}
