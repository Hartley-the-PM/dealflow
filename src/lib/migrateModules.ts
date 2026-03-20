import type { OfferModule, ProductsModule, ProductsModuleEntry } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

/**
 * Detects old `product_lines` / `product_showcase` modules in a module array
 * and merges them into a single `ProductsModule`.
 *
 * Preserves visibility toggles from `product_lines` and product data from `product_showcase`.
 * Returns the migrated array (or the original if no migration needed).
 */
export function migrateModules(modules: OfferModule[]): OfferModule[] {
  const hasOldProductLines = modules.some((m) => m.type === 'product_lines');
  const hasOldShowcase = modules.some((m) => m.type === 'product_showcase');

  // No migration needed if neither old type is present, or if a products module already exists
  if ((!hasOldProductLines && !hasOldShowcase) || modules.some((m) => m.type === 'products')) {
    return modules;
  }

  // Extract old modules
  const productLinesModule = modules.find((m) => m.type === 'product_lines');
  const showcaseModule = modules.find((m) => m.type === 'product_showcase');

  // Build entries from showcase products (if any)
  const entries: ProductsModuleEntry[] = [];
  if (showcaseModule && showcaseModule.type === 'product_showcase') {
    for (const product of showcaseModule.products) {
      entries.push({
        id: uuidv4(),
        productId: '',  // no catalog mapping in old showcase data
        quantity: null,
        unit: 'MT',
        pricePerUnit: 0,
        description: product.description || product.specs || '',
        imageUrl: product.imageUrl || '',
      });
    }
  }

  // Build merged ProductsModule with visibility toggles from product_lines
  const merged: ProductsModule = {
    type: 'products',
    id: uuidv4(),
    visible: productLinesModule?.visible ?? showcaseModule?.visible ?? true,
    showQuantity: productLinesModule?.type === 'product_lines' ? productLinesModule.showQuantity : true,
    showUnit: productLinesModule?.type === 'product_lines' ? productLinesModule.showUnit : true,
    showUnitPrice: productLinesModule?.type === 'product_lines' ? productLinesModule.showUnitPrice : true,
    showTotal: productLinesModule?.type === 'product_lines' ? productLinesModule.showTotal : true,
    entries,
  };

  // Replace old modules with merged one (insert at the position of the first old module found)
  const firstOldIndex = modules.findIndex(
    (m) => m.type === 'product_lines' || m.type === 'product_showcase'
  );

  const result: OfferModule[] = [];
  let inserted = false;

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    if (mod.type === 'product_lines' || mod.type === 'product_showcase') {
      if (!inserted && i === firstOldIndex) {
        result.push(merged);
        inserted = true;
      }
      // Skip old modules
      continue;
    }
    result.push(mod);
  }

  return result;
}
