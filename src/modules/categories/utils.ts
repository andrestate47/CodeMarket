import { CategoryRecord } from './actions';

/**
 * Generate a clean, URL-safe slug from category name
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

/**
 * Helper to check if potentialParentId is a descendant of categoryId (prevents cycles)
 */
export function isDescendant(
    categories: CategoryRecord[],
    categoryId: string,
    potentialParentId: string | null | undefined
): boolean {
    if (!potentialParentId) return false;
    if (categoryId === potentialParentId) return true;

    let currentParent = categories.find(c => c.id === potentialParentId);
    while (currentParent) {
        if (currentParent.id === categoryId) return true;
        if (!currentParent.parent_id) break;
        currentParent = categories.find(c => c.id === currentParent?.parent_id);
    }

    return false;
}
