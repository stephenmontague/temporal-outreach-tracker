'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ContactCard } from '@/components/outreach/ContactCard';
import { ContactFormDialog } from './ContactFormDialog';
import { SerializedContact } from '@/models/serialized';
import { Plus } from 'lucide-react';

interface ContactsPageClientProps {
  contacts: SerializedContact[];
}

export function ContactsPageClient({ contacts }: ContactsPageClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and track their progress through the funnel
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No contacts yet. Create your first contact to get started.
          </p>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Contact
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}

      <ContactFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}

