'use client';

import { useCallback, useMemo, useRef } from 'react';
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { LayoutItem, Layout, ResponsiveLayouts } from 'react-grid-layout';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DefaultChartWrapper from './DefaultChartWrapper';
import CustomChartCard from './CustomChartCard';
import { useDashboardStore } from '@/stores/dashboardStore';
import type { Dashboard, DashboardItem, Offer, Deal, Customer } from '@/types';

import 'react-grid-layout/css/styles.css';

interface DashboardGridProps {
  dashboard: Dashboard;
  filteredOffers: Offer[];
  deals: Deal[];
  customers: Customer[];
}

export default function DashboardGrid({ dashboard, filteredOffers, deals, customers }: DashboardGridProps) {
  const updateLayout = useDashboardStore((s) => s.updateLayout);
  const removeChartFromDashboard = useDashboardStore((s) => s.removeChartFromDashboard);
  const deleteChartConfig = useDashboardStore((s) => s.deleteChartConfig);
  const chartConfigs = useDashboardStore((s) => s.chartConfigs);

  const { containerRef, width, mounted } = useContainerWidth();

  const itemsRef = useRef(dashboard.items);
  itemsRef.current = dashboard.items;

  const layoutItems: Layout = useMemo(
    () =>
      dashboard.items.map((item) => {
        const key = item.type === 'default' ? item.id : item.chartId;
        return {
          i: key,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: item.minW ?? 3,
          minH: item.minH ?? 3,
        };
      }),
    [dashboard.items]
  );

  const handleLayoutChange = useCallback(
    (newLayout: Layout, _layouts: ResponsiveLayouts) => {
      const current = itemsRef.current;
      const updatedItems: DashboardItem[] = current.map((item) => {
        const key = item.type === 'default' ? item.id : item.chartId;
        const layoutItem = newLayout.find((l: LayoutItem) => l.i === key);
        if (!layoutItem) return item;
        return { ...item, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h };
      });
      updateLayout(dashboard.id, updatedItems);
    },
    [dashboard.id, updateLayout]
  );

  const handleDeleteCustomChart = useCallback(
    (chartId: string) => {
      removeChartFromDashboard(dashboard.id, chartId);
      deleteChartConfig(chartId);
    },
    [dashboard.id, removeChartFromDashboard, deleteChartConfig]
  );

  const handleRemoveDefault = useCallback(
    (itemId: string) => {
      const updatedItems = itemsRef.current.filter((item) =>
        item.type === 'default' ? item.id !== itemId : true
      );
      updateLayout(dashboard.id, updatedItems);
    },
    [dashboard.id, updateLayout]
  );

  if (dashboard.items.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No charts on this dashboard yet. Click &quot;AI Chart Builder&quot; to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <div ref={containerRef}>
      {mounted && width > 0 && (
        <ResponsiveGridLayout
          width={width}
          layouts={{ lg: layoutItems, md: layoutItems, sm: layoutItems }}
          breakpoints={{ lg: 1200, md: 900, sm: 600 }}
          cols={{ lg: 12, md: 12, sm: 6 }}
          rowHeight={60}
          onLayoutChange={handleLayoutChange}
          dragConfig={{ enabled: true, handle: '.drag-handle' }}
          resizeConfig={{ enabled: true, handles: ['se'] }}
          compactor={verticalCompactor}
          margin={[16, 16] as const}
        >
          {dashboard.items.map((item) => {
            if (item.type === 'default') {
              return (
                <div key={item.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
                  <DefaultChartWrapper
                    componentName={item.componentName}
                    filteredOffers={filteredOffers}
                    deals={deals}
                    customers={customers}
                    onRemove={() => handleRemoveDefault(item.id)}
                  />
                </div>
              );
            }

            const config = chartConfigs[item.chartId];
            if (!config) return <div key={item.chartId} />;

            return (
              <div key={item.chartId} style={{ border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
                <CustomChartCard
                  config={config}
                  onDelete={() => handleDeleteCustomChart(item.chartId)}
                />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
