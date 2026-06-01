export const generateSlug = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
};

export const generateUniqueSlug = async (Model, baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let isUnique = false;

  while (!isUnique) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existingDoc = await Model.findOne(query);

    if (existingDoc) {
      // Append a random 4-character alphanumeric string (e.g. -a7x9)
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      slug = `${baseSlug}-${randomSuffix}`;
    } else {
      isUnique = true;
    }
  }

  return slug;
};
