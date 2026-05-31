import BuyerSwipeNavigation from "../dashboard/components/buyer/BuyerSwipeNavigation";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <BuyerSwipeNavigation>
      {children}
    </BuyerSwipeNavigation>
  );
}
