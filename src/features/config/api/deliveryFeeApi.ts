import api from "../../../shared/api/axiosClient";

export interface DeliveryFeeConfig {
    delivery_app_fee_percent: number;
    usa_default_global: boolean;
    tenant_slug: string | null;
}

const BASE = "/api/v1/config/delivery-fee";

export const deliveryFeeApi = {
    get: () => api.get<DeliveryFeeConfig>(BASE).then((r) => r.data),
    save: (delivery_app_fee_percent: number) =>
        api.put<DeliveryFeeConfig>(BASE, { delivery_app_fee_percent }).then((r) => r.data),
};
