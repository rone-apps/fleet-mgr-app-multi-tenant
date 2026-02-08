import { API_BASE_URL, getAuthHeaders } from './api';

/**
 * Expense Category Rule Service
 * Handles API calls for category matching rules, auto-apply, and bulk configuration
 */

/**
 * Get category rule for a specific category
 */
export async function getCategoryRule(categoryId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/expense-category-rules/${categoryId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Rule not found
      }
      throw new Error(`Failed to load category rule: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error loading category rule:', err);
    throw err;
  }
}

/**
 * Create or update category rule
 */
export async function saveCategoryRule(categoryId, ruleData) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/expense-category-rules/${categoryId}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ruleData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save category rule: ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error saving category rule:', err);
    throw err;
  }
}

/**
 * Preview matching cabs for given criteria (unsaved)
 */
export async function previewMatchingCabs(matchingCriteria) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/expense-category-rules/preview-match`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ matchingCriteria }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to preview matching cabs: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error previewing matching cabs:', err);
    throw err;
  }
}

/**
 * Get preview of cabs matching a category rule (for saved rules)
 */
export async function getMatchingCabsPreview(categoryId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/expense-category-rules/${categoryId}/matching-cabs`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to load matching cabs preview: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error loading matching cabs preview:', err);
    throw err;
  }
}

/**
 * Auto-apply expenses to matching cabs
 */
export async function autoApplyExpenses(categoryId, autoApplyRequest) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/expense-category-rules/${categoryId}/auto-apply`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(autoApplyRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to auto-apply expenses: ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error auto-applying expenses:', err);
    throw err;
  }
}

/**
 * Bulk create expenses with individual amounts per cab
 */
export async function bulkCreateExpenses(categoryId, bulkCreateRequest) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/expense-category-rules/${categoryId}/bulk-create`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bulkCreateRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to bulk create expenses: ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error bulk creating expenses:', err);
    throw err;
  }
}

/**
 * Get available cab attributes for dynamic attribute rules
 */
export async function getCabAttributeTypes() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/cab-attribute-types`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to load cab attribute types: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error loading cab attribute types:', err);
    throw err;
  }
}

/**
 * Get list of cabs with their attributes (for bulk grid)
 */
export async function getMatchingCabsForBulkConfig(categoryId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/expense-category-rules/${categoryId}/matching-cabs?limit=1000`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to load cabs: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error loading cabs for bulk config:', err);
    throw err;
  }
}
