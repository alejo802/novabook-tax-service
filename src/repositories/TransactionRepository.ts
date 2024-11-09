import { model, Schema, Document } from 'mongoose';

interface Transaction extends Document {
  eventType: 'SALES' | 'TAX_PAYMENT';
  date: Date;
  invoiceId?: string;
  items?: Array<{ itemId: string; cost: number; taxRate: number }>;
  amount?: number; // For TAX_PAYMENT events
}

const transactionSchema = new Schema<Transaction>({
  eventType: { type: String, enum: ['SALES', 'TAX_PAYMENT'], required: true },
  date: { type: Date, required: true },
  invoiceId: { type: String, required: function () { return this.eventType === 'SALES'; } },
  items: {
    type: [
      {
        itemId: String,
        cost: Number,
        taxRate: Number,
      },
    ],
    required: function () { return this.eventType === 'SALES'; },
  },
  amount: {
    type: Number,
    required: function () { return this.eventType === 'TAX_PAYMENT'; },
  },
});

const TransactionModel = model<Transaction>('Transaction', transactionSchema);

export const TransactionRepository = {
  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    return await TransactionModel.create(transactionData);
  },

  async findUpToDate(date: Date): Promise<Transaction[]> {
    return await TransactionModel.find({ date: { $lte: date } }).exec();
  },

  async findAll(): Promise<Transaction[]> {
    return await TransactionModel.find().exec();
  },
};