import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type ProfileType = Database['public']['Enums']['profile_type'];

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  profile_type: ProfileType;
  plan_id: string | null;
  plan_type: string | null;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      // Check for impersonation parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const impersonateUserId = urlParams.get('impersonate');
      
      // Determine which user ID to use
      let targetUserId = user?.id;
      let impersonating = false;
      
      if (impersonateUserId && user?.id) {
        // Verify current user is super admin before allowing impersonation
        try {
          const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('profile_type')
            .eq('id', user.id)
            .single();
            
          if (currentUserProfile?.profile_type === 'superadmin') {
            targetUserId = impersonateUserId;
            impersonating = true;
          }
        } catch (err) {
          console.error('Error checking super admin status:', err);
        }
      }
      
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setIsImpersonating(impersonating);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const isSuperAdmin = profile?.profile_type === 'superadmin';
  const isClient = profile?.profile_type === 'cliente';

  return {
    profile,
    loading,
    error,
    isSuperAdmin,
    isClient,
    isImpersonating,
    refetchProfile: () => {
      if (user?.id) {
        setLoading(true);
        // Re-trigger the effect
        setProfile(null);
      }
    }
  };
};