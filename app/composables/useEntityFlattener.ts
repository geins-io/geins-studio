/**
 * Composable for flattening nested entity relationships.
 *
 * Provides utilities for transforming parent-child entity structures
 * into flat arrays suitable for table display with grouping. Commonly
 * used when displaying child entities (e.g., SKUs) that need to maintain
 * a reference to their parent entity (e.g., Product).
 *
 * @example
 * ```ts
 * const { flattenChildren } = useEntityFlattener();
 *
 * const skuEntities = computed(() =>
 *   flattenChildren(
 *     products.value,
 *     'skus',
 *     ['productId', 'name', 'thumbnail']
 *   )
 * );
 * ```
 */
export const useEntityFlattener = () => {
  /**
   * Flattens child entities from parent entities while preserving parent context.
   *
   * Takes an array of parent entities and extracts child entities from a specified
   * property, optionally copying parent fields to each child for reference.
   *
   * @template TParent - Type of the parent entity
   * @template TChild - Type of the child entity
   * @param parents - Array of parent entities containing children
   * @param childKey - Property name on parent that contains child array
   * @param parentFields - Optional array of parent fields to copy to each child (prefixed with 'parent_')
   * @returns Flattened array of child entities with parent context
   *
   * @example
   * ```ts
   * // Flatten product SKUs with parent product info
   * const flattened = flattenChildren(
   *   products,
   *   'skus',
   *   ['productId', 'name', 'thumbnail']
   * );
   * // Result: Array of SKUs with parent_productId, parent_name, parent_thumbnail
   * ```
   */
  const flattenChildren = <TParent, TChild>(
    parents: TParent[],
    childKey: keyof TParent,
    parentFields?: (keyof TParent)[],
  ): (TChild & Record<string, any>)[] => {
    return parents.flatMap((parent) => {
      const children = (parent[childKey] as unknown as TChild[]) || [];

      return children.map((child) => {
        const result = { ...child } as any;

        // Copy specified parent fields with 'parent_' prefix
        if (parentFields && parentFields.length > 0) {
          parentFields.forEach((field) => {
            const fieldValue = parent[field];
            result[`parent_${String(field)}`] = fieldValue;
          });
        }

        return result as TChild & Record<string, any>;
      });
    });
  };

  /**
   * Groups flat entities by a specified key.
   *
   * Useful for organizing data before display or processing.
   *
   * @template T - Type of entities to group
   * @param entities - Array of entities to group
   * @param groupByKey - Key to group entities by
   * @returns Map of grouped entities with key as group identifier
   */
  const groupBy = <T>(entities: T[], groupByKey: keyof T): Map<any, T[]> => {
    const grouped = new Map<any, T[]>();

    entities.forEach((entity) => {
      const key = entity[groupByKey];
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entity);
    });

    return grouped;
  };

  return {
    flattenChildren,
    groupBy,
  };
};
