export interface Offer {
  _id: string;
  imageLink: string;
  type: string;
  creativeLink: string;
  reward: number;
  minimumIq: number;
  heading: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface OffersResponse {
  success: boolean;
  message: string;
  data: Offer[];
  count: number;
}

export interface Coupon {
  _id: string;
  couponCode: string;
  company: string;
  description: string;
  expiryDate: string;
  imageLink: string;
  discount?: string; // For display purposes (e.g., "20")
}
