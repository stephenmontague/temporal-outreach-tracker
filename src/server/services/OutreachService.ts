import { ContactEventType } from '@/models/ContactEvent';
import { FollowUp } from '@/models/FollowUp';
import { Outreach } from '@/models/Outreach';
import { OutreachMethod } from '@/models/OutreachMethod';
import { FollowUpRepository } from '@/server/repositories/FollowUpRepository';
import { OutreachRepository } from '@/server/repositories/OutreachRepository';
import { ContactEventService } from './ContactEventService';

export class OutreachService {
  private outreachRepository: OutreachRepository;
  private followUpRepository: FollowUpRepository;
  private contactEventService: ContactEventService;

  constructor() {
    this.outreachRepository = new OutreachRepository();
    this.followUpRepository = new FollowUpRepository();
    this.contactEventService = new ContactEventService();
  }

  async createOutreach(data: {
    contactId: string;
    userId: string;
    method: string;
    dateTime: Date;
    subject?: string;
    messagePreview?: string;
    notes?: string;
  }): Promise<{ outreach: Outreach }> {
    const method = data.method as OutreachMethod;

    // Create outreach directly in database
    const outreach = await this.outreachRepository.create({
      contactId: data.contactId,
      userId: data.userId,
      method,
      dateTime: data.dateTime,
      subject: data.subject,
      messagePreview: data.messagePreview,
      notes: data.notes,
      responseReceived: false,
    });

    // Record outreach created event
    await this.contactEventService.recordEvent({
      contactId: data.contactId,
      userId: data.userId,
      eventType: ContactEventType.OUTREACH_CREATED,
      metadata: {
        method: method,
        subject: data.subject,
      },
      occurredAt: data.dateTime,
      outreachId: outreach.id,
    });

    return { outreach };
  }

  async getOutreachById(id: string): Promise<Outreach | null> {
    return this.outreachRepository.findById(id);
  }

  async getOutreachesByContact(contactId: string): Promise<Outreach[]> {
    return this.outreachRepository.findByContactId(contactId);
  }

  async getOutreachesByUser(userId: string): Promise<Outreach[]> {
    return this.outreachRepository.findByUserId(userId);
  }

  async updateOutreach(id: string, data: Partial<Omit<Outreach, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Outreach> {
    return this.outreachRepository.update(id, data);
  }
}

