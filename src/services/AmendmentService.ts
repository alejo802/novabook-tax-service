import { AmendmentRepository } from '../repositories/AmendmentRepository';

export const AmendmentService = {
  async amend(amendmentData: any) {
    return await AmendmentRepository.create(amendmentData);
  },
};