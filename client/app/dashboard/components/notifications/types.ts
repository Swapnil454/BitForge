
export type Role = "admin" | "seller" | "buyer";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  icon?: React.ReactNode;
  type?: string;
}
