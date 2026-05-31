import BuyerSwipeNavigation from "../components/buyer/BuyerSwipeNavigation";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <BuyerSwipeNavigation>
      {children}
    </BuyerSwipeNavigation>
  );
}
