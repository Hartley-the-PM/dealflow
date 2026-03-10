import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Dashboard,
  DashboardItem,
  ChartConfig,
  ChartBuilderSession,
  ChatMessage,
  ChartDataSource,
  ChartType,
} from '@/types';

const DEFAULT_ITEMS: DashboardItem[] = [
  { type: 'default', id: 'default-win-product', componentName: 'WinRateByProduct', x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
  { type: 'default', id: 'default-win-customer', componentName: 'WinRateByCustomer', x: 6, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
  { type: 'default', id: 'default-monthly', componentName: 'MonthlyActivity', x: 0, y: 5, w: 6, h: 5, minW: 4, minH: 4 },
  { type: 'default', id: 'default-margin', componentName: 'MarginAnalysis', x: 6, y: 5, w: 6, h: 5, minW: 4, minH: 4 },
];

const DEFAULT_DASHBOARD: Dashboard = {
  id: 'default',
  name: 'Default Dashboard',
  items: DEFAULT_ITEMS,
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
};

const EMPTY_SESSION: ChartBuilderSession = {
  id: '',
  messages: [],
  currentConfig: null,
  selectedDataSource: null,
  selectedChartType: null,
  status: 'idle',
};

interface DashboardStore {
  // Persisted state
  dashboards: Dashboard[];
  activeDashboardId: string;
  chartConfigs: Record<string, ChartConfig>;

  // Ephemeral state
  builderSession: ChartBuilderSession;
  isBuilderOpen: boolean;

  // Dashboard CRUD
  createDashboard: (name: string) => string;
  renameDashboard: (id: string, name: string) => void;
  deleteDashboard: (id: string) => void;
  setActiveDashboard: (id: string) => void;
  getActiveDashboard: () => Dashboard;

  // Layout management
  updateLayout: (dashboardId: string, items: DashboardItem[]) => void;
  addChartToDashboard: (dashboardId: string, config: ChartConfig) => void;
  removeChartFromDashboard: (dashboardId: string, chartId: string) => void;

  // Chart config CRUD
  saveChartConfig: (config: ChartConfig) => void;
  deleteChartConfig: (id: string) => void;

  // Builder session management
  openBuilder: () => void;
  closeBuilder: () => void;
  addMessage: (message: ChatMessage) => void;
  setCurrentConfig: (config: ChartConfig | null) => void;
  setBuilderDataSource: (source: ChartDataSource | null) => void;
  setBuilderChartType: (type: ChartType | null) => void;
  setBuilderStatus: (status: 'idle' | 'loading' | 'error') => void;
  setBuilderError: (error: string | undefined) => void;
  resetBuilderSession: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      dashboards: [DEFAULT_DASHBOARD],
      activeDashboardId: 'default',
      chartConfigs: {},
      builderSession: { ...EMPTY_SESSION },
      isBuilderOpen: false,

      // Dashboard CRUD
      createDashboard: (name) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const dashboard: Dashboard = {
          id,
          name,
          items: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          dashboards: [...s.dashboards, dashboard],
          activeDashboardId: id,
        }));
        return id;
      },

      renameDashboard: (id, name) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === id ? { ...d, name, updatedAt: new Date().toISOString() } : d
          ),
        })),

      deleteDashboard: (id) => {
        const state = get();
        if (state.dashboards.length <= 1) return;
        const remaining = state.dashboards.filter((d) => d.id !== id);
        set({
          dashboards: remaining,
          activeDashboardId: state.activeDashboardId === id ? remaining[0].id : state.activeDashboardId,
        });
      },

      setActiveDashboard: (id) => set({ activeDashboardId: id }),

      getActiveDashboard: () => {
        const state = get();
        return state.dashboards.find((d) => d.id === state.activeDashboardId) ?? state.dashboards[0];
      },

      // Layout management
      updateLayout: (dashboardId, items) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId ? { ...d, items, updatedAt: new Date().toISOString() } : d
          ),
        })),

      addChartToDashboard: (dashboardId, config) => {
        // Save the chart config globally
        set((s) => ({
          chartConfigs: { ...s.chartConfigs, [config.id]: config },
        }));

        // Find max Y in the current dashboard to place the new chart below
        const dashboard = get().dashboards.find((d) => d.id === dashboardId);
        const maxY = dashboard?.items.reduce((max, item) => Math.max(max, item.y + item.h), 0) ?? 0;

        const newItem: DashboardItem = {
          type: 'custom',
          chartId: config.id,
          x: 0,
          y: maxY,
          w: 6,
          h: 5,
          minW: 3,
          minH: 3,
        };

        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId
              ? { ...d, items: [...d.items, newItem], updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },

      removeChartFromDashboard: (dashboardId, chartId) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  items: d.items.filter((item) =>
                    item.type === 'custom' ? item.chartId !== chartId : true
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        })),

      // Chart config CRUD
      saveChartConfig: (config) =>
        set((s) => ({
          chartConfigs: { ...s.chartConfigs, [config.id]: config },
        })),

      deleteChartConfig: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.chartConfigs;
          return { chartConfigs: rest };
        }),

      // Builder session management
      openBuilder: () =>
        set({
          isBuilderOpen: true,
          builderSession: {
            ...EMPTY_SESSION,
            id: uuidv4(),
          },
        }),

      closeBuilder: () =>
        set({
          isBuilderOpen: false,
          builderSession: { ...EMPTY_SESSION },
        }),

      addMessage: (message) =>
        set((s) => ({
          builderSession: {
            ...s.builderSession,
            messages: [...s.builderSession.messages, message],
          },
        })),

      setCurrentConfig: (config) =>
        set((s) => ({
          builderSession: {
            ...s.builderSession,
            currentConfig: config,
          },
        })),

      setBuilderDataSource: (source) =>
        set((s) => ({
          builderSession: {
            ...s.builderSession,
            selectedDataSource: source,
          },
        })),

      setBuilderChartType: (type) =>
        set((s) => ({
          builderSession: {
            ...s.builderSession,
            selectedChartType: type,
          },
        })),

      setBuilderStatus: (status) =>
        set((s) => ({
          builderSession: {
            ...s.builderSession,
            status,
          },
        })),

      setBuilderError: (error) =>
        set((s) => ({
          builderSession: {
            ...s.builderSession,
            error,
            status: error ? 'error' : 'idle',
          },
        })),

      resetBuilderSession: () =>
        set({
          builderSession: {
            ...EMPTY_SESSION,
            id: uuidv4(),
          },
        }),
    }),
    {
      name: 'dealflow-dashboards',
      partialize: (state) => ({
        dashboards: state.dashboards,
        activeDashboardId: state.activeDashboardId,
        chartConfigs: state.chartConfigs,
      }),
    }
  )
);
