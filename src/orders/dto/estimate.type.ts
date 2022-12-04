export class EstimateType {
  works: [
    {
      price: number;
      total: number;
      work_id: string;
      work_name: string;
      work_time: number;
      commission: number;
    },
  ];
  per_task: [
    {
      work_id: string;
      work_name: string;
      work_time: number;
      price: number;
      commission: number;
    },
  ];
  pricing: {
    promo: number;
    total: number;
    worker: number;
    discount: number;
    commission: number;
  };
  promo?: {
    status: boolean;
    promo_code?: string;
    promo_amount?: number;
    error?: string;
  };
  task_count: number;
  validity: Date;
  created_at: Date;
  overtime_per_minute: number;
}