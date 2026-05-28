export async function getGlobalLegalDates(pageId?: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Fetch with no-store or revalidate
    const url = pageId ? `${apiUrl}/settings/legal-dates?pageId=${pageId}` : `${apiUrl}/settings/legal-dates`;
    
    const res = await fetch(url, {
      next: { tags: ['global-settings'], revalidate: 3600 }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching legal dates:", error);
    return null;
  }
}
