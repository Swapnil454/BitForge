
import Product from "../models/Product.js";
import User from "../models/User.js";

// ─── GET /marketplace/search/suggestions?q=  (public) ─────────────────────────
export const getSearchSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) return res.json({ suggestions: [] });

    const regex = new RegExp(q, "i");

    const products = await Product.find({
      status: "approved",
      isDeleted: { $ne: true },
      $or: [{ title: regex }, { description: regex }],
    })
      .select("title category")
      .limit(30)
      .lean();

    // Deduplicate and extract meaningful suggestions from titles
    const seen = new Set();
    const suggestions = [];

    for (const p of products) {
      const normalised = (p.title || "").toLowerCase();
      if (normalised && !seen.has(normalised)) {
        seen.add(normalised);
        suggestions.push({ text: p.title, category: p.category });
      }
      if (suggestions.length >= 8) break;
    }

    res.json({ suggestions });
  } catch (err) {
    console.error("Search suggestions error:", err);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

// ─── GET /marketplace/search/history  (auth) ──────────────────────────────────
export const getSearchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("searchHistory").lean();
    const history = (user?.searchHistory || [])
      .sort((a, b) => new Date(b.searchedAt) - new Date(a.searchedAt))
      .slice(0, 10);
    res.json({ history });
  } catch (err) {
    console.error("Get search history error:", err);
    res.status(500).json({ message: "Failed to fetch search history" });
  }
};

// ─── POST /marketplace/search/history  (optionalAuth) ─────────────────────────
export const saveSearchHistory = async (req, res) => {
  try {
    if (!req.user) return res.json({ success: true }); // guest — silently skip
    const q = (req.body.query || "").trim();
    if (!q || q.length < 2) return res.json({ success: true });

    // Pull any existing entry with the same query (case-insensitive dedup)
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { searchHistory: { query: { $regex: `^${q}$`, $options: "i" } } },
    });

    // Push new entry and trim to 10
    const user = await User.findById(req.user._id).select("searchHistory").lean();
    const newHistory = [
      { query: q, searchedAt: new Date() },
      ...(user?.searchHistory || []),
    ].slice(0, 8); // keep only the 8 most recent

    await User.findByIdAndUpdate(req.user._id, { searchHistory: newHistory });
    res.json({ success: true });
  } catch (err) {
    console.error("Save search history error:", err);
    res.status(500).json({ message: "Failed to save search" });
  }
};

// ─── DELETE /marketplace/search/history/:query  (auth) ────────────────────────
export const deleteSearchHistoryItem = async (req, res) => {
  try {
    const query = decodeURIComponent(req.params.query || "").trim();
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { searchHistory: { query } },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete history item error:", err);
    res.status(500).json({ message: "Failed to delete history item" });
  }
};

// ─── DELETE /marketplace/search/history  (auth) ───────────────────────────────
export const clearSearchHistory = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { searchHistory: [] });
    res.json({ success: true });
  } catch (err) {
    console.error("Clear search history error:", err);
    res.status(500).json({ message: "Failed to clear search history" });
  }
};
