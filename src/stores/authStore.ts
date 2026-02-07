import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import type { CompanyMembership } from '../services/companyService';

interface AuthState {
    user: User | null;
    activeCompanyId: string | null;
    companyId: string | null; // Alias para compatibilidade
    memberships: CompanyMembership[];
    isLoading: boolean;
    isAuthenticated: boolean;
    isPlatformAdmin: boolean;
    platformContextLoaded: boolean;
    initialize: () => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    switchCompany: (companyId: string) => Promise<void>;
    refreshMemberships: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            activeCompanyId: null,
            companyId: null,
            memberships: [],
            isLoading: true,
            isAuthenticated: false,
            isPlatformAdmin: false,
            platformContextLoaded: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            initialize: async () => {
                set({ isLoading: true });
                try {
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session?.user) {
                        const [profile, memberships] = await Promise.all([
                            userService.getProfile(session.user.id),
                            companyService.listMyCompanies()
                        ]);

                        const activeId = profile?.active_company_id || profile?.company_id || null;

                        set({
                            user: session.user,
                            activeCompanyId: activeId,
                            companyId: activeId,
                            memberships: memberships || [],
                            isAuthenticated: true,
                            isPlatformAdmin: profile?.is_platform_admin || false,
                            platformContextLoaded: true
                        });
                    } else {
                        set({
                            user: null,
                            activeCompanyId: null,
                            companyId: null,
                            memberships: [],
                            isAuthenticated: false,
                            isPlatformAdmin: false,
                            platformContextLoaded: true
                        });
                    }

                    supabase.auth.onAuthStateChange(async (event, session) => {
                        if (event === 'SIGNED_IN' && session?.user) {
                            const [profile, memberships] = await Promise.all([
                                userService.getProfile(session.user.id),
                                companyService.listMyCompanies()
                            ]);
                            const activeId = profile?.active_company_id || profile?.company_id || null;
                            set({
                                user: session.user,
                                activeCompanyId: activeId,
                                companyId: activeId,
                                memberships: memberships || [],
                                isAuthenticated: true,
                                isPlatformAdmin: profile?.is_platform_admin || false,
                                platformContextLoaded: true
                            });
                        } else if (event === 'SIGNED_OUT') {
                            set({
                                user: null,
                                activeCompanyId: null,
                                companyId: null,
                                memberships: [],
                                isAuthenticated: false,
                                isPlatformAdmin: false,
                                platformContextLoaded: true
                            });
                        }
                    });
                } catch (err) {
                    console.error('Error initializing auth store:', err);
                    // Ensure platform context is marked as loaded even if initialization failed
                    set({ platformContextLoaded: true });
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                await supabase.auth.signOut();
                set({ user: null, activeCompanyId: null, companyId: null, memberships: [], isAuthenticated: false, isPlatformAdmin: false });
                localStorage.removeItem('nanoclean-auth');
            },

            switchCompany: async (companyId: string) => {
                try {
                    await companyService.switchCompany(companyId);
                    window.location.reload();
                } catch (err) {
                    console.error('Error switching company:', err);
                    throw err;
                }
            },

            refreshMemberships: async () => {
                try {
                    const memberships = await companyService.listMyCompanies();
                    set({ memberships });
                } catch (err) {
                    console.error('Error refreshing memberships:', err);
                }
            }
        }),
        {
            name: 'nanoclean-auth',
            partialize: (state) => ({
                // Persist only minimal non-sensitive state to avoid storing user PII/tokens
                activeCompanyId: state.activeCompanyId,
                companyId: state.activeCompanyId,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
