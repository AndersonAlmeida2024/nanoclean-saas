import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import type { CompanyMembership, Company } from '../services/companyService';

interface AuthState {
    user: User | null;
    activeCompanyId: string | null;
    companyId: string | null; // Alias para compatibilidade
    memberships: CompanyMembership[];
    company: Company | null;
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
            company: null,
            isLoading: true,
            isAuthenticated: false,
            isPlatformAdmin: false,
            platformContextLoaded: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            initialize: async () => {
                set({ isLoading: true });
                try {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                    if (sessionError) {
                        console.error('Error fetching session:', sessionError);
                        throw sessionError;
                    }

                    if (session?.user) {
                        try {
                            const [profile, memberships] = await Promise.all([
                                userService.getProfile(session.user.id).catch(err => {
                                    console.error('Failed to fetch profile:', err);
                                    return null;
                                }),
                                companyService.listMyCompanies().catch(err => {
                                    console.error('Failed to fetch companies:', err);
                                    return [];
                                })
                            ]);

                            const activeId = profile?.active_company_id || profile?.company_id || null;
                            const activeMembership = (memberships || []).find(m => m.company_id === activeId);
                            const companyObj = activeMembership?.companies || null;

                            if (companyObj && companyObj.trial_ends_at) {
                                companyObj.subscription_status = new Date(companyObj.trial_ends_at) > new Date() ? 'trial' : 'expired';
                            } else if (companyObj) {
                                companyObj.subscription_status = 'active';
                            }

                            set({
                                user: session.user,
                                activeCompanyId: activeId,
                                companyId: activeId,
                                company: companyObj,
                                memberships: memberships || [],
                                isAuthenticated: true,
                                isPlatformAdmin: profile?.is_platform_admin || false,
                                platformContextLoaded: true
                            });
                        } catch (innerErr) {
                            console.error('Error fetching user context:', innerErr);
                            // Even if context fails, we might want to let them in as "incomplete" user or logout
                            // For now, let's treat as authenticated but with limited data
                            set({
                                user: session.user,
                                activeCompanyId: null,
                                companyId: null,
                                memberships: [],
                                isAuthenticated: true,
                                isPlatformAdmin: false,
                                platformContextLoaded: true
                            });
                        }
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
                            try {
                                const [profile, memberships] = await Promise.all([
                                    userService.getProfile(session.user.id).catch(() => null),
                                    companyService.listMyCompanies().catch(() => [])
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
                            } catch (error) {
                                console.error('Auth state change error:', error);
                            }
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
                    set({
                        user: null,
                        activeCompanyId: null,
                        companyId: null,
                        memberships: [],
                        isAuthenticated: false,
                        isPlatformAdmin: false,
                        platformContextLoaded: true // CRITICAL: Always release 'loading' state
                    });
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                try {
                    await supabase.auth.signOut();
                } catch (error) {
                    console.error('Erro ao sair:', error);
                } finally {
                    set({
                        user: null,
                        activeCompanyId: null,
                        companyId: null,
                        memberships: [],
                        isAuthenticated: false,
                        isPlatformAdmin: false,
                        platformContextLoaded: true // Para evitar loaders infinitos se deslogar
                    });
                    localStorage.removeItem('nanoclean-auth');
                }
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

// ✅ PERFORMANCE OPTIMIZATION: Specific selectors to prevent unnecessary re-renders
// Components should use these instead of destructuring the entire store

/**
 * Selector: Get only companyId
 * Use when component only needs company context
 */
export const useCompanyId = () => useAuthStore(state => state.companyId);

/**
 * Selector: Get only company object
 * Use when component needs full company data
 */
export const useCompany = () => useAuthStore(state => state.company);

/**
 * Selector: Get only isAuthenticated
 * Use for auth guards and conditional rendering
 */
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);

/**
 * Selector: Get only platformContextLoaded
 * Use for loading states that wait for initial context
 */
export const usePlatformLoaded = () => useAuthStore(state => state.platformContextLoaded);

/**
 * Selector: Get only user object
 * Use when component needs user profile data
 */
export const useUser = () => useAuthStore(state => state.user);

/**
 * Selector: Get only isPlatformAdmin
 * Use for admin-only features
 */
export const useIsPlatformAdmin = () => useAuthStore(state => state.isPlatformAdmin);

/**
 * Selector: Get combined company context
 * Use when component needs companyId + platformContextLoaded together
 */
export const useCompanyContext = () => useAuthStore(state => ({
    companyId: state.companyId,
    platformContextLoaded: state.platformContextLoaded
}));
