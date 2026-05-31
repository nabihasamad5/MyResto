export interface User {
  id: string;
    name: string;
    email: string;
    image: string;
    role: string;
    department: string;
}
export interface Student {
  id: number;
  student: {
    image: string;
    name: string;
    regNo: string;
  };
  title: string;
  category: string;
  status: string;
  submittedAt: string;
}
export type Status = "Pending" | "In Process" | "Resolved" | "Completed" | "Rejected";
export interface RestaurantForm {
  id: string;
  title: string;
  description: string;
  status: Status;
  assignedTo: string;
  createdAt: string;
  priority?: "Low" | "Medium" | "High";
  category?: string;
}
export type Role = "Admin" | "Manager" | "Kitchen" | "Waiter" | "Delivery" | "Customer";

export interface UserData {
  id?: number;
  name?: string;
  email?: string;
  role?: Role;
  phone?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: number;
  image?: string;
  gender?: string;
  address?: string;
}

// Table view model used by RestaurantsTable
export interface RestaurantTableItem {
  id: number;
  complaint_id: string;
  user: {
    image: string;
    name: string;
    role: string;
    department: string;
    email: string;
  };
  description: string;
  category: string;
  subject: string;
  priority: string;
  status: Status;
  image: string | null;
  assignedTo: string;
  created_by: string;
created_at: string;
  updated_at: string;

}
export interface Restaurant {
  id: number;
  complaint_id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  image: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "created"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "completed";

export interface Order {
  id: number;
  status: OrderStatus;
  customer_id?: number | null;
  total?: number | null;
  created_at: string;
  updated_at?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  order_type?: string | null;
}

export interface Delivery {
  id: number;
  order_id: number;
  delivery_boy_id: number | null;
  status: string;
  assigned_at: string | null;
  delivered_at: string | null;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku?: string | null;
  quantity: number;
  unit?: string | null;
  cost_price?: number | null;
  selling_price?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id: number;
  item_id: number;
  type: "in" | "out";
  quantity: number;
  reference?: string | null;
  created_at?: string;
}

export interface Feedback {
  id: number;
  user_id: number;
  order_id?: number | null;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  note?: string | null;
  created_at: string;
}

export interface LoyaltyAccount {
  id: number;
  user_id: number;
  points: number;
  tier?: string | null;
  updated_at?: string;
}

export interface PushToken {
  id: number;
  user_id: number;
  token: string;
  platform?: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  read: number;
  created_at: string;
}

export interface StaffPerformanceEntry {
  id: number;
  staff_id: number;
  metric: string;
  value: number;
  recorded_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  details?: string | null;
  created_at: string;
}

export type Announcement = {
  id: number;
  title: string;
  message: string;
  created_by: string;
  createdAt: string;
  creator: {
    image: string;
    name: string;
    email: string;
  };
};

export interface MenuItem {
  id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  is_available: number;
  image: string | null;
  popularity?: number | null;
  prep_time_minutes?: number | null;
}

export interface MenuCategory {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
}
