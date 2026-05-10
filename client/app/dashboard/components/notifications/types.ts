
export type Role = "admin" | "seller" | "buyer";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type?: string;
  category?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  actionUrl?: string | null;
  actionLabel?: string;
  audienceRole?: Role;
  source?: {
    name?: string;
    logoUrl?: string;
  };
}
