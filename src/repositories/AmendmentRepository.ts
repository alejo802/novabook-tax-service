import { model, Schema, Document } from 'mongoose';

export interface Amendment extends Document {
  date: Date;
  invoiceId: string;
  itemId: string;
  cost: number;
  taxRate: number;
}

const amendmentSchema = new Schema<Amendment>({
  date: { type: Date, required: true },
  invoiceId: { type: String, required: true },
  itemId: { type: String, required: true },
  cost: { type: Number, required: true },
  taxRate: { type: Number, required: true },
});

const AmendmentModel = model<Amendment>('Amendment', amendmentSchema);

export const AmendmentRepository = {
  async create(amendmentData: Partial<Amendment>): Promise<Amendment> {
    return await AmendmentModel.create(amendmentData);
  },

  async findByInvoiceId(invoiceId: string): Promise<Amendment[]> {
    return await AmendmentModel.find({ invoiceId }).exec();
  },

  async findUpToDate(date: Date): Promise<Amendment[]> {
    return await AmendmentModel.find({ date: { $lte: date } }).exec();
  },
};