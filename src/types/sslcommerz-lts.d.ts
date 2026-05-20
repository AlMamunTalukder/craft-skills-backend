declare module 'sslcommerz-lts' {
    class SSLCommerzPayment {
        constructor(storeId: string, storePassword: string, isLive: boolean);

        init(data: Record<string, any>): Promise<any>;

        validate(data: Record<string, any>): Promise<any>;

        initiateRefund(data: Record<string, any>): Promise<any>;

        refundQuery(data: Record<string, any>): Promise<any>;

        transactionQueryByTransactionId(data: Record<string, any>): Promise<any>;

        transactionQueryBySessionId(data: Record<string, any>): Promise<any>;
    }

    export default SSLCommerzPayment;
}
