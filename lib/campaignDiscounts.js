export async function applyCampaignDiscounts(db, products) {
  const today = new Date().toISOString().split('T')[0];

  const { data: campaigns } = await db
    .from('campaigns')
    .select('discount_type, discount_value, applies_to, target_category')
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today);

  if (!campaigns || campaigns.length === 0) return products;

  return products.map(p => {
    let applicableCampaign = null;

    for (const c of campaigns) {
      if (c.applies_to === 'all') {
        applicableCampaign = c;
        break;
      }
      if (c.applies_to === 'category' && c.target_category === p.category) {
        applicableCampaign = c;
        break;
      }
    }

    if (!applicableCampaign) return p;

    const basePrice = p.discount_type === 'real' && p.discounted_price > 0
      ? p.discounted_price
      : p.price;

    let campaignPrice;
    if (applicableCampaign.discount_type === 'percent') {
      campaignPrice = Math.round(basePrice * (1 - applicableCampaign.discount_value / 100));
    } else {
      campaignPrice = Math.max(0, basePrice - applicableCampaign.discount_value);
    }

    return {
      ...p,
      price: p.price,
      discountedPrice: campaignPrice,
      campaignDiscount: basePrice - campaignPrice,
      campaignName: applicableCampaign.discount_type === 'percent'
        ? `%${applicableCampaign.discount_value}`
        : `${applicableCampaign.discount_value} TL`,
    };
  });
}
